const mongoose = require('mongoose');
const Document = require('../models/Document');
const Clause = require('../models/Clause');
const { getGridFSBucket } = require('../config/db');
const { extractAndValidate } = require('../services/pdf.service');
const { detectClauses } = require('../services/clauseDetector.service');
const { simplifyClause } = require('../services/groq.service');
const { computeRiskLevel } = require('../services/riskEngine.service');
const { splitDocumentText } = require('../utils/chunkText');
const { embedText } = require('../services/gemini.service');
const { upsertChunks } = require('../services/chromadb.service');

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const path = require('path');
    const isPdfMime = req.file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(req.file.originalname).toLowerCase() === '.pdf';

    if (!isPdfMime || !isPdfExt) {
      throw new Error('Only PDF files are allowed');
    }

    // Generate custom GridFS ID
    const gridfsId = new mongoose.Types.ObjectId();

    // Stream memory buffer directly to GridFS bucket
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStreamWithId(gridfsId, req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        userId: req.user.id,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', resolve);
      uploadStream.write(req.file.buffer);
      uploadStream.end();
    });

    // Extract text from memory buffer
    const { extractedText, pageCount, isScanned, threshold } =
      await extractAndValidate(req.file.buffer);

    const document = await Document.create({
      userId: req.user.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      gridfsId,
      status: isScanned ? 'scanned' : 'extracting',
      pageCount,
      extractedText,
      processedAt: isScanned ? new Date() : null,
    });

    if (isScanned) {
      return res.status(422).json({
        message:
          'This document appears to be scanned. OCR support coming in a future version.',
        document: {
          id: document._id,
          fileName: document.fileName,
          status: document.status,
          pageCount: document.pageCount,
          createdAt: document.createdAt,
        },
        meta: {
          scannedThreshold: threshold,
        },
      });
    }

    return res.status(201).json({
      message: 'PDF uploaded and text extracted successfully',
      document: {
        id: document._id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const clauses = await Clause.find({ documentId: document._id }).sort({ order: 1 });

    const mappedClauses = clauses.map(c => {
      const obj = c.toObject();
      return {
        ...obj,
        id: obj._id,
        summary: obj.simplifiedText, // alias for E2E tests
      };
    });

    return res.status(200).json({
      id: document._id,
      _id: document._id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      status: document.status,
      pageCount: document.pageCount,
      riskScore: document.riskScore,
      createdAt: document.createdAt,
      clauses: mappedClauses,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentFile = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const bucket = getGridFSBucket();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`
    );

    const downloadStream = bucket.openDownloadStream(document.gridfsId);

    downloadStream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).json({ message: 'Stored file not found in GridFS' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

const BATCH_SIZE = 5;

const riskToScore = {
  low: 3,
  medium: 6,
  high: 9,
};

const calculateOverallRiskScore = (clauses = []) => {
  if (!clauses.length) return 1;

  const total = clauses.reduce((sum, clause) => {
    return sum + (riskToScore[clause.finalRiskLevel] || 1);
  }, 0);

  return Math.min(10, Math.max(1, Math.round(total / clauses.length)));
};

const analyseDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!document.extractedText || document.extractedText.trim().length < 200) {
      return res.status(422).json({
        message: 'Document has insufficient extracted text for analysis.',
      });
    }

    document.status = 'analysing';
    await document.save();

    await Clause.deleteMany({ documentId: document._id });

    const detectedClauses = detectClauses(document.extractedText);

    if (!detectedClauses.length) {
      document.status = 'error';
      await document.save();

      return res.status(422).json({
        message: 'No clauses detected from extracted text.',
      });
    }

    const savedClauses = [];

    for (let i = 0; i < detectedClauses.length; i += BATCH_SIZE) {
      const batch = detectedClauses.slice(i, i + BATCH_SIZE);

      const processedBatch = await Promise.all(
        batch.map(async (clause) => {
          const aiResult = await simplifyClause(clause.originalText, clause.clauseTitle);

          const riskResult = computeRiskLevel(
            clause.originalText,
            aiResult.aiRiskLevel,
            aiResult.aiRiskReason
          );

          return {
            documentId: document._id,
            clauseTitle: clause.clauseTitle,
            originalText: clause.originalText,
            simplifiedText: aiResult.summary,
            aiRiskLevel: aiResult.aiRiskLevel,
            aiRiskReason: aiResult.aiRiskReason,
            keywordRiskLevel: riskResult.keywordRiskLevel,
            triggeredKeywords: riskResult.triggeredKeywords,
            finalRiskLevel: riskResult.finalRiskLevel,
            finalRiskReason: riskResult.finalRiskReason,
            order: clause.order,
            charStart: clause.charStart,
            charEnd: clause.charEnd,
          };
        })
      );

      const inserted = await Clause.insertMany(processedBatch);
      savedClauses.push(...inserted);
    }

    const riskScore = calculateOverallRiskScore(savedClauses);

    const fullText = document.extractedText;
    if (!fullText || !fullText.trim()) {
      throw new Error("Document extractedText missing for embeddings");
    }

    const chunks = await splitDocumentText(fullText);
    const embeddings = [];

    for (const chunk of chunks) {
      const vector = await embedText(chunk.content);
      embeddings.push(vector);
    }

    await upsertChunks(document._id.toString(), chunks, embeddings);

    document.status = 'ready';
    document.riskScore = riskScore;
    document.processedAt = new Date();
    await document.save();

    return res.status(200).json({
      message: 'Document analysed successfully.',
      documentId: document._id,
      status: document.status,
      riskScore: document.riskScore,
      clausesCount: savedClauses.length,
    });
  } catch (error) {
    try {
      await Document.findByIdAndUpdate(req.params.id, { status: 'error' });
    } catch (_) {}

    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocument,
  getDocumentFile,
  analyseDocument,
};