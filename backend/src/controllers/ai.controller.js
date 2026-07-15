const SymptomLog = require('../models/SymptomLog');
const HealthRecord = require('../models/HealthRecord');
const { analyzeCycle } = require('../utils/analyzer');
const { callClaude, extractJson, SYSTEM_BASE } = require('../utils/claude');

async function buildPatientContext(user) {
  const logs = await SymptomLog.find({ patient: user._id }).sort({ date: 1 }).limit(120);
  const periodStarts = logs.filter((l) => l.entryType === 'period_start');
  const cycles = periodStarts.map((l) => ({ startDate: l.date }));
  const symptomOnly = logs.filter((l) => l.entryType === 'symptom' || l.painLevel > 0);
  const insights = analyzeCycle(cycles, symptomOnly);

  let recordSummary = {};
  try {
    const record = await HealthRecord.findOne({ patient: user._id });
    if (record) {
      const d = record.getDecrypted();
      recordSummary = {
        bloodType: d.bloodType,
        allergies: d.allergies,
        medications: d.medications,
      };
    }
  } catch {
    /* ignore decrypt errors for context */
  }

  const recent = logs
    .slice(-12)
    .reverse()
    .map((l) => ({
      date: l.date?.toISOString?.()?.slice(0, 10) || l.date,
      type: l.entryType,
      symptoms: l.symptoms,
      pain: l.painLevel,
      mood: l.mood,
      notes: l.notes,
    }));

  return {
    patient: {
      firstName: user.firstName,
      role: user.role,
    },
    insights,
    recordSummary,
    recentLogs: recent,
    logsCount: logs.length,
  };
}

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message requis' });
    }

    const ctx = await buildPatientContext(req.user);
    const system = `${SYSTEM_BASE}

Contexte clinique confidentiel de la patiente (utilise-le pour personnaliser, ne le récite pas en entier) :
${JSON.stringify(ctx, null, 2)}`;

    const messages = [
      ...history
        .slice(-10)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })),
      { role: 'user', content: message.trim().slice(0, 4000) },
    ];

    const { text, model, usage } = await callClaude({ system, messages, maxTokens: 1400 });
    res.json({
      reply: text,
      model,
      usage,
      disclaimer:
        'Hera AI fournit des informations générales. Ce n’est pas un avis médical.',
    });
  } catch (error) {
    console.error('ai.chat:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};

exports.explainInsights = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const { text, model } = await callClaude({
      system: SYSTEM_BASE,
      messages: [
        {
          role: 'user',
          content: `Rédige une explication personnalisée, claire et bienveillante (FR) des insights de cycle ci-dessous pour ${ctx.patient.firstName}.
Structure :
1) Résumé en 2 phrases
2) Ce que dit ton cycle en ce moment
3) Alertes éventuelles (sans dramatiser, sans diagnostic)
4) 3 actions concrètes cette semaine
5) Quand consulter

Données :
${JSON.stringify(ctx.insights, null, 2)}
Logs récents :
${JSON.stringify(ctx.recentLogs, null, 2)}`,
        },
      ],
      maxTokens: 1200,
    });
    res.json({ explanation: text, insights: ctx.insights, model });
  } catch (error) {
    console.error('ai.explainInsights:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};

exports.parseSymptoms = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Texte requis' });
    }

    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Tu extrais un journal de symptômes structuré. Réponds UNIQUEMENT en JSON valide.`,
      messages: [
        {
          role: 'user',
          content: `Convertis ce texte libre en JSON avec exactement ces clés :
{
  "entryType": "symptom" | "period_start" | "period_end" | "note",
  "symptoms": string[],
  "painLevel": number 0-10,
  "mood": "great"|"good"|"ok"|"low"|"bad"|"",
  "flow": "none"|"light"|"medium"|"heavy"|"",
  "notes": string,
  "aiSummary": string (1 phrase FR),
  "urgency": "low"|"medium"|"high",
  "suggestedActions": string[]
}

Texte patiente : """${text.trim().slice(0, 2000)}"""`,
        },
      ],
      maxTokens: 800,
      temperature: 0.2,
    });

    const parsed = extractJson(raw);
    res.json({ parsed, raw });
  } catch (error) {
    console.error('ai.parseSymptoms:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};

exports.doctorBrief = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const { text, model } = await callClaude({
      system: SYSTEM_BASE,
      messages: [
        {
          role: 'user',
          content: `Génère un BRIEF MÉDICAL structuré (FR) que la patiente peut partager avec son médecin sur HeraCare.
Format markdown :
# Brief HeraCare
## Motif
## Historique de cycle (faits)
## Symptômes marquants
## Signaux d'alerte algorithmiques
## Questions suggérées pour la consultation
## Note : ce brief est généré par IA, à valider par la patiente

Données :
${JSON.stringify(ctx, null, 2)}`,
        },
      ],
      maxTokens: 1500,
    });
    res.json({ brief: text, model });
  } catch (error) {
    console.error('ai.doctorBrief:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};

exports.wellnessPlan = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Réponds UNIQUEMENT en JSON valide.`,
      messages: [
        {
          role: 'user',
          content: `Crée un plan bien-être personnalisé pour aujourd'hui selon la phase du cycle.
JSON exact :
{
  "phase": string,
  "headline": string,
  "energyTip": string,
  "nutrition": string[],
  "movement": string[],
  "selfCare": string[],
  "watchOut": string[],
  "affirmation": string
}

Contexte :
${JSON.stringify({ insights: ctx.insights, recent: ctx.recentLogs }, null, 2)}`,
        },
      ],
      maxTokens: 900,
      temperature: 0.5,
    });

    const plan = extractJson(raw);
    res.json({ plan });
  } catch (error) {
    console.error('ai.wellnessPlan:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};

exports.askDoctor = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const concern = req.body.concern || 'suivi gynécologique général';
    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Réponds UNIQUEMENT en JSON valide.`,
      messages: [
        {
          role: 'user',
          content: `Génère des questions intelligentes pour préparer une consultation.
JSON :
{
  "title": string,
  "questions": [{"q": string, "why": string}],
  "redFlagsToMention": string[],
  "documentsToBring": string[]
}

Préoccupation : ${concern}
Contexte : ${JSON.stringify(ctx.insights)}
Récents : ${JSON.stringify(ctx.recentLogs)}`,
        },
      ],
      maxTokens: 1000,
      temperature: 0.4,
    });
    res.json({ prep: extractJson(raw) });
  } catch (error) {
    console.error('ai.askDoctor:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'Erreur IA' });
  }
};
