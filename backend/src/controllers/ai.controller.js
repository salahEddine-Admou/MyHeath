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
    /* ignore */
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
    patient: { firstName: user.firstName, role: user.role },
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
      return res.status(400).json({ message: 'Message is required' });
    }

    const ctx = await buildPatientContext(req.user);
    const system = `${SYSTEM_BASE}

Confidential patient context (personalize answers; do not dump raw JSON):
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
      disclaimer: 'MyHeath AI provides general information only. This is not medical advice.',
    });
  } catch (error) {
    console.error('ai.chat:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
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
          content: `Write a personalized, clear, reassuring English explanation of these cycle insights for ${ctx.patient.firstName}.
Structure:
1) 2-sentence summary
2) What the cycle looks like right now
3) Any alerts (no drama, no diagnosis)
4) 3 concrete actions this week
5) When to see a clinician

Data:
${JSON.stringify(ctx.insights, null, 2)}
Recent logs:
${JSON.stringify(ctx.recentLogs, null, 2)}`,
        },
      ],
      maxTokens: 1200,
    });
    res.json({ explanation: text, insights: ctx.insights, model });
  } catch (error) {
    console.error('ai.explainInsights:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.parseSymptoms = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Extract a structured symptom journal entry. Reply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Convert this free text into JSON with exactly these keys:
{
  "entryType": "symptom" | "period_start" | "period_end" | "note",
  "symptoms": string[],
  "painLevel": number 0-10,
  "mood": "great"|"good"|"ok"|"low"|"bad"|"",
  "flow": "none"|"light"|"medium"|"heavy"|"",
  "notes": string,
  "aiSummary": string (1 English sentence),
  "urgency": "low"|"medium"|"high",
  "suggestedActions": string[]
}

Patient text: """${text.trim().slice(0, 2000)}"""`,
        },
      ],
      maxTokens: 800,
      temperature: 0.2,
    });

    const parsed = extractJson(raw);
    res.json({ parsed, raw });
  } catch (error) {
    console.error('ai.parseSymptoms:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
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
          content: `Generate a structured MEDICAL BRIEF (English) the patient can share with their doctor on MyHeath.
Markdown format:
# MyHeath Brief
## Reason for visit
## Cycle history (facts)
## Notable symptoms
## Algorithmic alert signals
## Suggested consultation questions
## Note: AI-generated — patient should review before sharing

Data:
${JSON.stringify(ctx, null, 2)}`,
        },
      ],
      maxTokens: 1500,
    });
    res.json({ brief: text, model });
  } catch (error) {
    console.error('ai.doctorBrief:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.wellnessPlan = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Reply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Create a personalized wellness plan for today based on cycle phase.
Exact JSON:
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

Context:
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
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.askDoctor = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const concern = req.body.concern || 'general gynecological follow-up';
    const { text: raw } = await callClaude({
      system: `${SYSTEM_BASE}
Reply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Generate smart questions to prepare for a consultation.
JSON:
{
  "title": string,
  "questions": [{"q": string, "why": string}],
  "redFlagsToMention": string[],
  "documentsToBring": string[]
}

Concern: ${concern}
Context: ${JSON.stringify(ctx.insights)}
Recent: ${JSON.stringify(ctx.recentLogs)}`,
        },
      ],
      maxTokens: 1000,
      temperature: 0.4,
    });
    res.json({ prep: extractJson(raw) });
  } catch (error) {
    console.error('ai.askDoctor:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};
