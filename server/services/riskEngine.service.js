const HIGH_KEYWORDS = [
  'penalty',
  'penalise',
  'terminate',
  'termination',
  'indemnify',
  'indemnification',
  'liability',
  'liable',
  'breach',
  'default',
  'forfeit',
  'forfeiture',
  'damages',
  'sue',
  'lawsuit',
  'arbitration',
  'injunction',
  'liquidated',
];

const MEDIUM_KEYWORDS = [
  'payment delay',
  'late payment',
  'renewal',
  'auto-renew',
  'automatic renewal',
  'obligation',
  'obligations',
  'restriction',
  'restricted',
  'confidential',
  'non-disclosure',
  'non-compete',
  'exclusivity',
];

const LOW_KEYWORDS = [
  'notice',
  'notification',
  'amendment',
  'modification',
  'governing law',
  'jurisdiction',
  'waiver',
  'severability',
];

const RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

const unique = (arr) => [...new Set(arr)];

const findMatches = (text, keywords) => {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
};

const computeKeywordRisk = (clauseText = '') => {
  const highMatches = findMatches(clauseText, HIGH_KEYWORDS);
  const mediumMatches = findMatches(clauseText, MEDIUM_KEYWORDS);
  const lowMatches = findMatches(clauseText, LOW_KEYWORDS);

  let keywordRiskLevel = 'low';
  if (highMatches.length > 0) keywordRiskLevel = 'high';
  else if (mediumMatches.length > 0) keywordRiskLevel = 'medium';
  else if (lowMatches.length > 0) keywordRiskLevel = 'low';

  return {
    keywordRiskLevel,
    triggeredKeywords: unique([...highMatches, ...mediumMatches, ...lowMatches]),
  };
};

const maxRisk = (a = 'low', b = 'low') => {
  return RANK[a] >= RANK[b] ? a : b;
};

const buildFinalRiskReason = ({
  aiRiskLevel,
  aiRiskReason,
  keywordRiskLevel,
  triggeredKeywords,
  finalRiskLevel,
}) => {
  const keywordPart =
    triggeredKeywords.length > 0
      ? `Keyword engine matched: ${triggeredKeywords.join(', ')}.`
      : 'Keyword engine found no risk keywords.';

  return `AI marked this clause ${aiRiskLevel} risk because ${aiRiskReason} Keyword engine marked it ${keywordRiskLevel} risk. ${keywordPart} Final risk is ${finalRiskLevel} because the system keeps the higher of the two signals.`;
};

const computeRiskLevel = (clauseText = '', aiRiskLevel = 'low', aiRiskReason = '') => {
  const { keywordRiskLevel, triggeredKeywords } = computeKeywordRisk(clauseText);
  const finalRiskLevel = maxRisk(aiRiskLevel, keywordRiskLevel);

  const finalRiskReason = buildFinalRiskReason({
    aiRiskLevel,
    aiRiskReason,
    keywordRiskLevel,
    triggeredKeywords,
    finalRiskLevel,
  });

  return {
    keywordRiskLevel,
    triggeredKeywords,
    finalRiskLevel,
    finalRiskReason,
  };
};

module.exports = {
  HIGH_KEYWORDS,
  MEDIUM_KEYWORDS,
  LOW_KEYWORDS,
  computeRiskLevel,
};