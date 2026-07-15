/**
 * Client Anthropic Claude — assistant santé HeraCare.
 * Ne stocke jamais les clés dans le code source ; lit process.env.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_BASE = `Tu es Hera, l'assistante IA de HeraCare — plateforme de télémédecine et suivi de santé féminine (FemTech).

Règles STRICTES :
- Tu réponds en français, ton chaleureux, clair, professionnel et rassurant.
- Tu n'es PAS un médecin : tu ne poses jamais de diagnostic définitif.
- Tu peux expliquer des notions (cycle, SOPK, endométriose) de façon pédagogique.
- En cas de signaux alarmants (douleur extrême, saignement abondant, grossesse à risque, idées suicidaires), conseille d'appeler les urgences / un médecin immédiatement.
- Encourage la consultation humaine via HeraCare quand c'est pertinent.
- Sois concise mais utile ; utilise des listes et emojis avec parcimonie (1–2 max).
- Respecte la confidentialité : ne demande pas d'identité civile inutile.`;

async function callClaude({ system, messages, maxTokens = 1200, temperature = 0.6 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY manquante');
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
    const msg = data?.error?.message || `Erreur Anthropic HTTP ${res.status}`;
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
  if (start === -1 || end === -1) throw new Error('Réponse IA non JSON');
  return JSON.parse(raw.slice(start, end + 1));
}

module.exports = {
  SYSTEM_BASE,
  callClaude,
  extractJson,
};
