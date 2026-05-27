const pdfParse = require('pdf-parse');
// This is your Day 3 scanned-PDF gate. If extracted text is below 200 characters after trimming, the document must be marked scanned and analysis stops
const SCANNED_THRESHOLD = 200;

const normalizeText = (text = '') => {
  return text.replace(/\s+/g, ' ').trim();
};

const extractAndValidate = async (buffer) => {
  let parsed;
  try {
    parsed = await pdfParse(buffer);
  } catch (error) {
    console.error('PDF parsing error:', error.message);
    return {
      extractedText: '',
      pageCount: 0,
      isScanned: true,
      threshold: SCANNED_THRESHOLD,
    };
  }
  const cleanedText = normalizeText(parsed.text || '');

  return {
    extractedText: cleanedText,
    pageCount: parsed.numpages || 0,
    isScanned: cleanedText.length < SCANNED_THRESHOLD,
    threshold: SCANNED_THRESHOLD,
  };
};

module.exports = {
  extractAndValidate,
  SCANNED_THRESHOLD,
};