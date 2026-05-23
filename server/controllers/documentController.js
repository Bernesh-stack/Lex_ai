const mongoose = require('mongoose');
const Document = require('../models/Document');
const { getGridFSBucket } = require('../config/db');
const { extractAndValidate } = require('../services/pdf.service');

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

module.exports = {
  uploadDocument,
  getDocumentFile,
};