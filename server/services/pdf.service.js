const { PDFParse } = require('pdf-parse');
// This is your Day 3 scanned-PDF gate. If extracted text is below 200 characters after trimming, the document must be marked scanned and analysis stops
const SCANNED_THRESHOLD = 200;

const normalizeText = (text = '') => {
  return text.replace(/\s+/g, ' ').trim();
};

const extractAndValidate = async (buffer) => {
  // Convert Node Buffer to Uint8Array as required by pdf-parse v2.4.5
  const parser = new PDFParse(new Uint8Array(buffer));
  const parsed = await parser.getText();
  const cleanedText = normalizeText(parsed.text || '');

  return {
    extractedText: cleanedText,
    pageCount: parsed.total || 0,
    isScanned: cleanedText.length < SCANNED_THRESHOLD,
    threshold: SCANNED_THRESHOLD,
  };
};

module.exports = {
  extractAndValidate,
  SCANNED_THRESHOLD,
};