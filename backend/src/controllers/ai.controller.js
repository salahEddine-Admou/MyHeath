const SymptomLog = require('../models/SymptomLog');
const HealthRecord = require('../models/HealthRecord');
const DailyHealthLog = require('../models/DailyHealthLog');
const { analyzeCycle } = require('../utils/analyzer');
const { callClaude, extractJson, systemForUser } = require('../utils/claude');
const { computeHealthScore, summarizeTrend } = require('../utils/healthScore');

async function buildPatientContext(user) {
  const logs = await SymptomLog.find({ patient: user._id }).sort({ date: 1 }).limit(120);
  const periodStarts = logs.filter((l) => l.entryType === 'period_start');
  const cycles = periodStarts.map((l) => ({ startDate: l.date }));
  const symptomOnly = logs.filter((l) => l.entryType === 'symptom' || l.painLevel > 0);
  const insights = user.gender === 'woman' ? analyzeCycle(cycles, symptomOnly) : null;

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

  const daily = await DailyHealthLog.find({ patient: user._id })
    .sort({ date: -1 })
    .limit(14);

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
      gender: user.gender || 'woman',
      hasDiabetes: Boolean(user.hasDiabetes),
      diabetesType: user.diabetesType,
    },
    insights,
    recordSummary,
    recentLogs: user.gender === 'woman' ? recent : recent.filter((r) => r.type === 'symptom' || r.type === 'note'),
    dailyHealth: daily.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      score: d.healthScore,
      label: d.healthLabel,
      energy: d.energy,
      sleepHours: d.sleepHours,
      stress: d.stress,
      fastingGlucose: d.fastingGlucose,
      exerciseMinutes: d.exerciseMinutes,
      recovery: d.recovery,
    })),
    dailyTrend: summarizeTrend([...daily].reverse()),
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
    const system = `${systemForUser(req.user)}

Confidential patient context (personalize; do not dump raw JSON):
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
      disclaimer: 'MyHeath AI Coach provides general information only. This is not medical advice.',
    });
  } catch (error) {
    console.error('ai.chat:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.coachPlan = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const gender = req.user.gender === 'man' ? 'man' : 'woman';
    const { text: raw } = await callClaude({
      system: `${systemForUser(req.user)}\nReply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Create a personalized AI Coach day plan for a ${gender} user.
JSON exact:
{
  "headline": string,
  "healthVerdict": "good" | "needs_attention",
  "focus": string[],
  "morning": string[],
  "afternoon": string[],
  "evening": string[],
  "diabetesTips": string[],
  "genderTips": string[],
  "motivation": string
}

Context:
${JSON.stringify(ctx, null, 2)}`,
        },
      ],
      maxTokens: 1100,
      temperature: 0.5,
    });
    res.json({ plan: extractJson(raw) });
  } catch (error) {
    console.error('ai.coachPlan:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.explainInsights = async (req, res) => {
  try {
    if (req.user.gender === 'man') {
      const ctx = await buildPatientContext(req.user);
      const { text, model } = await callClaude({
        system: systemForUser(req.user),
        messages: [
          {
            role: 'user',
            content: `Explain this man's recent daily health scores and trends for ${req.user.firstName}.
Include: summary, what looks good, what needs attention, 3 actions, when to see a clinician.
Data: ${JSON.stringify({ trend: ctx.dailyTrend, daily: ctx.dailyHealth }, null, 2)}`,
          },
        ],
      });
      return res.json({ explanation: text, model });
    }

    const ctx = await buildPatientContext(req.user);
    const { text, model } = await callClaude({
      system: systemForUser(req.user),
      messages: [
        {
          role: 'user',
          content: `Write a personalized English explanation of cycle insights for ${ctx.patient.firstName}.
Structure: summary, current cycle, alerts, 3 actions, when to consult.
Insights: ${JSON.stringify(ctx.insights, null, 2)}
Daily health: ${JSON.stringify(ctx.dailyHealth?.slice(0, 5), null, 2)}`,
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
      system: `${systemForUser(req.user)}\nReply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Convert free text into JSON:
{
  "entryType": "symptom" | "period_start" | "period_end" | "note",
  "symptoms": string[],
  "painLevel": number 0-10,
  "mood": "great"|"good"|"ok"|"low"|"bad"|"",
  "flow": "none"|"light"|"medium"|"heavy"|"",
  "notes": string,
  "aiSummary": string,
  "urgency": "low"|"medium"|"high",
  "suggestedActions": string[]
}
Text: """${text.trim().slice(0, 2000)}"""`,
        },
      ],
      maxTokens: 800,
      temperature: 0.2,
    });

    res.json({ parsed: extractJson(raw), raw });
  } catch (error) {
    console.error('ai.parseSymptoms:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.doctorBrief = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const { text, model } = await callClaude({
      system: systemForUser(req.user),
      messages: [
        {
          role: 'user',
          content: `Generate a MEDICAL BRIEF (English) for MyHeath.
Include reason, recent daily scores, diabetes notes if any, cycle notes if woman, questions for clinician.
Data: ${JSON.stringify(ctx, null, 2)}`,
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
      system: `${systemForUser(req.user)}\nReply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `Wellness plan JSON:
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
Context: ${JSON.stringify(ctx, null, 2)}`,
        },
      ],
      maxTokens: 900,
      temperature: 0.5,
    });
    res.json({ plan: extractJson(raw) });
  } catch (error) {
    console.error('ai.wellnessPlan:', error.message);
    res.status(error.status || 500).json({ message: error.message || 'AI error' });
  }
};

exports.askDoctor = async (req, res) => {
  try {
    const ctx = await buildPatientContext(req.user);
    const concern = req.body.concern || 'general health follow-up';
    const { text: raw } = await callClaude({
      system: `${systemForUser(req.user)}\nReply with VALID JSON only.`,
      messages: [
        {
          role: 'user',
          content: `JSON:
{
  "title": string,
  "questions": [{"q": string, "why": string}],
  "redFlagsToMention": string[],
  "documentsToBring": string[]
}
Concern: ${concern}
Context: ${JSON.stringify(ctx, null, 2)}`,
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

// re-export helper for tests
exports._compute = computeHealthScore;
