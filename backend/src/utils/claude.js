/**
 * Anthropic Claude client — MyHeath health assistant.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_BASE = `You are Heath, the AI assistant for MyHeath — a FemTech telemedicine and women's health tracking platform.

STRICT rules:
- Reply in clear, warm, professional English.
- You are NOT a doctor: never give a definitive diagnosis.
- You may explain concepts (cycle, PCOS, endometriosis) in an educational way.
- For alarming signals (extreme pain, heavy bleeding, pregnancy risk, suicidal thoughts), advise seeking emergency care / a clinician immediately.
- Encourage human consultation via MyHeath when relevant.
- Be concise and useful; use short lists when helpful.
- Respect privacy: do not ask for unnecessary personal identity details.`;

async function callClaude({ system, messages, maxTokens = 1200, temperature = 0.6 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is missing');
    err.status = 503;
    throw err;
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: system || SYSTEM_BASE,
      messages,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Anthropic HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status >= 500 ? 502 : 400;
    err.details = data;
    throw err;
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return { text, model: data.model, usage: data.usage };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response is not JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

module.exports = {
  SYSTEM_BASE,
  callClaude,
  extractJson,
};
