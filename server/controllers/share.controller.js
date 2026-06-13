const Document = require('../models/Document');
const Clause = require('../models/Clause');

const getSharedDocument = async (req, res, next) => {
  try {
    const { token } = req.params;

    const doc = await Document.findOne({ shareToken: token })
      .select('fileName shareExpiry riskScore status createdAt pageCount');

    if (!doc) {
      return res.status(404).json({ message: 'Invalid share link' });
    }

    if (!doc.shareExpiry || new Date(doc.shareExpiry) < new Date()) {
      return res.status(410).json({ message: 'Share link expired' });
    }

    const clauses = await Clause.find({ documentId: doc._id }).sort({ order: 1 });

    return res.json({
      fileName: doc.fileName,
      shareExpiry: doc.shareExpiry,
      riskScore: doc.riskScore,
      status: doc.status,
      pageCount: doc.pageCount,
      createdAt: doc.createdAt,
      clauses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSharedDocument,
};
