// server/utils/chunkText.js
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

async function splitDocumentText(fullText) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3200,
    chunkOverlap: 600,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const splitTexts = await splitter.splitText(fullText);

  let cursor = 0;

  return splitTexts.map((content, index) => {
    const startChar = fullText.indexOf(content, cursor);
    const safeStart = startChar >= 0 ? startChar : cursor;
    const endChar = safeStart + content.length;
    cursor = endChar;

    return {
      chunkIndex: index,
      content,
      startChar: safeStart,
      endChar,
    };
  });
}

module.exports = {
  splitDocumentText,
};