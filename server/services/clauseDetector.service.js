const MIN_CLAUSE_LENGTH = 50;
const MAX_CLAUSE_LENGTH = 2000;

const normalizeLineBreaks = (text = '') => {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
};

const isNumberedHeading = (line) => {
  const trimmed = line.trim();
  return /^((\d+(\.\d+)*)|([a-zA-Z])|([ivxlcdmIVXLCDM]+))[\.\)]\s+.+$/.test(trimmed);
};

const isAllCapsHeading = (line) => {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 120) return false;
  if (!/[A-Z]/.test(trimmed)) return false;
  return /^[A-Z0-9\s,&\-()\/]+$/.test(trimmed);
};

const isTitleCaseHeading = (line) => {
  const trimmed = line.trim();
  if (trimmed.length < 4 || trimmed.length > 120) return false;
  if (trimmed.endsWith('.')) return false;

  const words = trimmed.split(/\s+/);
  if (words.length > 8) return false;

  const titleCaseWords = words.filter((word) => /^[A-Z][a-zA-Z'-]*$/.test(word));
  const minRequired = words.length === 1 ? 1 : Math.max(2, Math.ceil(words.length * 0.6));
  return titleCaseWords.length >= minRequired;
};

const isHeadingLine = (line) => {
  return isNumberedHeading(line) || isAllCapsHeading(line) || isTitleCaseHeading(line);
};

const splitLongClauseAtSentenceBoundary = (text, maxLength) => {
  if (text.length <= maxLength) return [text];

  const parts = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf('. ', maxLength);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf('? ', maxLength);
    if (splitIndex === -1) splitIndex = remaining.lastIndexOf('! ', maxLength);
    if (splitIndex === -1) splitIndex = maxLength;

    const chunk = remaining.slice(0, splitIndex + 1).trim();
    parts.push(chunk);
    remaining = remaining.slice(splitIndex + 1).trim();
  }

  if (remaining) parts.push(remaining);
  return parts;
};

const detectClauses = (rawText = '') => {
  const text = normalizeLineBreaks(rawText);
  if (!text) return [];

  const lines = text.split('\n');
  const clauses = [];

  let currentTitle = '';
  let currentTextLines = [];
  let currentStart = 0;
  let cursor = 0;
  let clauseCounter = 1;

  const pushClause = () => {
    const joined = currentTextLines.join('\n').trim();
    if (!joined) return;

    clauses.push({
      clauseTitle: currentTitle || `Clause ${clauseCounter}`,
      originalText: joined,
      order: clauseCounter,
      charStart: currentStart,
      charEnd: currentStart + joined.length,
    });

    clauseCounter += 1;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextLine = lines[i + 1] || '';

    const lineStart = cursor;
    cursor += line.length + 1;

    const headingMatch = isHeadingLine(trimmed);
    if (headingMatch) {
      if (currentTextLines.length > 0) {
        pushClause();
        currentTextLines = [];
      }

      currentTitle = trimmed;
      currentStart = lineStart;
      currentTextLines.push(trimmed);
      continue;
    }

    if (currentTextLines.length === 0) {
      currentStart = lineStart;
    }

    if (trimmed) {
      currentTextLines.push(trimmed);
    }
  }

  if (currentTextLines.length > 0) {
    pushClause();
  }

  const mergedClauses = [];
  for (const clause of clauses) {
    if (
      mergedClauses.length > 0 &&
      clause.originalText.length < MIN_CLAUSE_LENGTH
    ) {
      const prev = mergedClauses[mergedClauses.length - 1];
      prev.originalText = `${prev.originalText}\n\n${clause.originalText}`.trim();
      prev.charEnd = clause.charEnd;
    } else {
      mergedClauses.push({ ...clause });
    }
  }

  const finalClauses = [];
  let order = 1;

  for (const clause of mergedClauses) {
    const chunks = splitLongClauseAtSentenceBoundary(
      clause.originalText,
      MAX_CLAUSE_LENGTH
    );

    let runningStart = clause.charStart;

    chunks.forEach((chunk, index) => {
      finalClauses.push({
        clauseTitle:
          chunks.length > 1 ? `${clause.clauseTitle} (Part ${index + 1})` : clause.clauseTitle,
        originalText: chunk,
        order,
        charStart: runningStart,
        charEnd: runningStart + chunk.length,
      });

      runningStart += chunk.length + 1;
      order += 1;
    });
  }

  return finalClauses;
};

module.exports = {
  detectClauses,
  MIN_CLAUSE_LENGTH,
  MAX_CLAUSE_LENGTH,
};