const DailyHealthLog = require('../models/DailyHealthLog');
const User = require('../models/User');
const { computeHealthScore, summarizeTrend } = require('../utils/healthScore');

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

exports.upsertDaily = async (req, res) => {
  try {
    const date = dayStart(req.body.date || new Date());
    const profile = {
      gender: req.user.gender || 'woman',
      hasDiabetes: Boolean(req.user.hasDiabetes),
    };

    const payload = {
      energy: req.body.energy,
      sleepHours: req.body.sleepHours,
      sleepQuality: req.body.sleepQuality,
      stress: req.body.stress,
      mood: req.body.mood,
      waterLiters: req.body.waterLiters,
      steps: req.body.steps,
      exerciseMinutes: req.body.exerciseMinutes,
      workoutIntensity: req.body.workoutIntensity,
      recovery: req.body.recovery,
      weightKg: req.body.weightKg,
      restingHeartRate: req.body.restingHeartRate,
      fastingGlucose: req.body.fastingGlucose,
      postMealGlucose: req.body.postMealGlucose,
      tookMedication: req.body.tookMedication,
      carbsGrams: req.body.carbsGrams,
      symptoms: req.body.symptoms || [],
      notes: req.body.notes || '',
    };

    const scored = computeHealthScore(payload, profile);

    const log = await DailyHealthLog.findOneAndUpdate(
      { patient: req.user._id, date },
      {
        patient: req.user._id,
        date,
        ...payload,
        healthScore: scored.score,
        healthLabel: scored.label,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      log,
      prediction: scored,
      message: scored.isGoodHealth
        ? 'Today looks like a good health day based on your inputs.'
        : 'Today needs attention — review tips and consider contacting a clinician if symptoms persist.',
    });
  } catch (error) {
    console.error('upsertDaily:', error);
    res.status(500).json({ message: 'Failed to save daily health log' });
  }
};

exports.getDailyHistory = async (req, res) => {
  try {
    const limit = Math.min(90, Number(req.query.limit) || 30);
    const logs = await DailyHealthLog.find({ patient: req.user._id })
      .sort({ date: -1 })
      .limit(limit);

    const chronological = [...logs].reverse();
    const trend = summarizeTrend(chronological);

    let today = null;
    const todayKey = dayStart(new Date()).toISOString().slice(0, 10);
    const found = logs.find((l) => l.date.toISOString().slice(0, 10) === todayKey);
    if (found) {
      today = {
        log: found,
        prediction: computeHealthScore(found, {
          gender: req.user.gender,
          hasDiabetes: req.user.hasDiabetes,
        }),
      };
    }

    res.json({
      logs,
      trend,
      today,
      chart: chronological.map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        score: l.healthScore,
        label: l.healthLabel,
        fastingGlucose: l.fastingGlucose,
        energy: l.energy,
        stress: l.stress,
      })),
    });
  } catch (error) {
    console.error('getDailyHistory:', error);
    res.status(500).json({ message: 'Failed to load health history' });
  }
};

exports.getToday = async (req, res) => {
  try {
    const date = dayStart(new Date());
    const log = await DailyHealthLog.findOne({ patient: req.user._id, date });
    if (!log) return res.json({ log: null, prediction: null });
    const prediction = computeHealthScore(log, {
      gender: req.user.gender,
      hasDiabetes: req.user.hasDiabetes,
    });
    res.json({ log, prediction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load today log' });
  }
};

exports.updateDiabetesProfile = async (req, res) => {
  try {
    const { hasDiabetes, diabetesType } = req.body;
    if (hasDiabetes !== undefined) req.user.hasDiabetes = Boolean(hasDiabetes);
    if (diabetesType !== undefined) req.user.diabetesType = diabetesType;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update diabetes profile' });
  }
};

exports.getDiabetesOverview = async (req, res) => {
  try {
    const logs = await DailyHealthLog.find({ patient: req.user._id })
      .sort({ date: -1 })
      .limit(30);

    const withGlucose = logs.filter(
      (l) => l.fastingGlucose != null || l.postMealGlucose != null
    );
    const fasting = withGlucose
      .map((l) => l.fastingGlucose)
      .filter((v) => v != null);
    const avgFasting = fasting.length
      ? Math.round(fasting.reduce((a, b) => a + b, 0) / fasting.length)
      : null;

    const medDays = logs.filter((l) => l.tookMedication).length;
    const adherence =
      logs.length > 0 ? Math.round((medDays / logs.length) * 100) : null;

    res.json({
      profile: {
        hasDiabetes: req.user.hasDiabetes,
        diabetesType: req.user.diabetesType,
      },
      avgFasting,
      adherencePercent: adherence,
      recent: withGlucose.slice(0, 14).map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        fastingGlucose: l.fastingGlucose,
        postMealGlucose: l.postMealGlucose,
        tookMedication: l.tookMedication,
        carbsGrams: l.carbsGrams,
        healthScore: l.healthScore,
      })),
      chart: [...logs]
        .reverse()
        .filter((l) => l.fastingGlucose != null)
        .map((l) => ({
          date: l.date.toISOString().slice(0, 10),
          fastingGlucose: l.fastingGlucose,
          postMealGlucose: l.postMealGlucose,
        })),
    });
  } catch (error) {
    console.error('getDiabetesOverview:', error);
    res.status(500).json({ message: 'Failed to load diabetes overview' });
  }
};
