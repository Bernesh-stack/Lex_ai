const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.GROQAPIKEY,
});

const cleanJsonResponse = (content = '') => {
  const trimmed = content.trim();

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return trimmed;
};

const simplifyClause = async (clauseText = '', clauseTitle = 'Untitled Clause') => {
  const prompt = `
You are analysing a legal contract clause.

Return STRICT JSON only with this exact shape:
{
  "summary": "plain english summary in 2-4 sentences",
  "aiRiskLevel": "low | medium | high",
  "aiRiskReason": "1-2 sentence reason"
}

Rules:
- Be precise and simple.
- Do not add markdown.
- Do not add extra keys.
- If the clause creates strong liability, penalties, termination rights, indemnity, lawsuit, arbitration, damages, or severe restrictions, mark high.
- If the clause creates obligations, renewal terms, confidentiality, payment timing, or restrictions, mark medium.
- If it is procedural or informational, mark low.

Clause title:
${clauseTitle}

Clause text:
${clauseText}
  `.trim();

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a legal simplification assistant. Output valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(cleanJsonResponse(content));

  return {
    summary: parsed.summary?.trim() || 'Summary unavailable.',
    aiRiskLevel: ['low', 'medium', 'high'].includes(parsed.aiRiskLevel)
      ? parsed.aiRiskLevel
      : 'low',
    aiRiskReason: parsed.aiRiskReason?.trim() || 'No AI risk reason returned.',
  };
};

module.exports = {
  simplifyClause,
};