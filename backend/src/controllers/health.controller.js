const SymptomLog = require('../models/SymptomLog');
const HealthRecord = require('../models/HealthRecord');
const { analyzeCycle } = require('../utils/analyzer');

exports.logSymptom = async (req, res) => {
  try {
    const {
      date,
      entryType,
      symptoms,
      painLevel,
      mood,
      flow,
      temperature,
      notes,
    } = req.body;

    const log = await SymptomLog.create({
      patient: req.user._id,
      date: date ? new Date(date) : new Date(),
      entryType: entryType || 'symptom',
      symptoms: symptoms || [],
      painLevel: painLevel ?? 0,
      mood: mood || '',
      flow: flow || '',
      temperature,
      notes: notes || '',
    });

    res.status(201).json({ log });
  } catch (error) {
    console.error('logSymptom:', error);
    res.status(500).json({ message: 'Failed to save symptom log' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const logs = await SymptomLog.find({ patient: req.user._id })
      .sort({ date: -1 })
      .limit(200);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load history' });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const patientId =
      req.user.role === 'doctor' && req.query.patientId
        ? req.query.patientId
        : req.user._id;

    if (
      req.user.role === 'doctor' &&
      String(patientId) !== String(req.user._id)
    ) {
      const User = require('../models/User');
      const patient = await User.findById(patientId);
      if (!patient || String(patient.assignedDoctor) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access to this record is denied' });
      }
    }

    const logs = await SymptomLog.find({ patient: patientId }).sort({ date: 1 });

    const periodStarts = logs.filter((l) => l.entryType === 'period_start');
    const cycles = periodStarts.map((l) => ({ startDate: l.date }));
    const symptomOnly = logs.filter((l) => l.entryType === 'symptom' || l.painLevel > 0);

    const insights = analyzeCycle(cycles, symptomOnly);
    res.json({ insights, logsCount: logs.length });
  } catch (error) {
    console.error('getInsights:', error);
    res.status(500).json({ message: 'Failed to analyze cycle' });
  }
};

exports.getHealthRecord = async (req, res) => {
  try {
    let record = await HealthRecord.findOne({ patient: req.user._id });
    if (!record) {
      record = await HealthRecord.create({ patient: req.user._id });
    }
    res.json({ record: record.getDecrypted() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load health record' });
  }
};

exports.updateHealthRecord = async (req, res) => {
  try {
    let record = await HealthRecord.findOne({ patient: req.user._id });
    if (!record) {
      record = await HealthRecord.create({ patient: req.user._id });
    }

    const { bloodType, allergies, medications, clinicalNotes, extra } = req.body;
    if (bloodType !== undefined) record.bloodType = bloodType;
    record.setSensitiveFields({ allergies, medications, clinicalNotes, extra });
    record.lastUpdatedBy = req.user._id;
    await record.save();

    res.json({ record: record.getDecrypted() });
  } catch (error) {
    console.error('updateHealthRecord:', error);
    res.status(500).json({ message: 'Failed to update health record' });
  }
};

function toDay(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

/**
 * Detailed period management payload: cycles, calendar marks, stats.
 */
exports.getPeriods = async (req, res) => {
  try {
    const logs = await SymptomLog.find({ patient: req.user._id }).sort({ date: 1 });
    const starts = logs.filter((l) => l.entryType === 'period_start');
    const ends = logs.filter((l) => l.entryType === 'period_end');
    const periodRelated = logs.filter(
      (l) =>
        l.entryType === 'period_start' ||
        l.entryType === 'period_end' ||
        (l.flow && l.flow !== 'none' && l.flow !== '')
    );

    const cycles = starts.map((l) => ({ startDate: l.date }));
    const symptomOnly = logs.filter((l) => l.entryType === 'symptom' || l.painLevel > 0);
    const insights = analyzeCycle(cycles, symptomOnly);

    const avgPeriodLength =
      (() => {
        const durations = [];
        starts.forEach((start) => {
          const end = ends.find(
            (e) =>
              new Date(e.date) >= new Date(start.date) &&
              daysBetween(start.date, e.date) <= 12
          );
          if (end) durations.push(daysBetween(start.date, end.date) + 1);
        });
        if (!durations.length) return 5;
        return Math.round(durations.reduce((s, n) => s + n, 0) / durations.length);
      })();

    const periodEpisodes = starts
      .map((start, idx) => {
        const startDay = toDay(start.date);
        const end = ends.find(
          (e) =>
            new Date(e.date) >= new Date(start.date) &&
            daysBetween(start.date, e.date) <= 12
        );
        const endDate = end
          ? new Date(end.date)
          : addDays(start.date, avgPeriodLength - 1);
        const lengthDays = daysBetween(start.date, endDate) + 1;
        const nextStart = starts[idx + 1];
        const cycleLength = nextStart
          ? daysBetween(start.date, nextStart.date)
          : insights.averageCycleLength;

        const days = [];
        for (let i = 0; i < lengthDays; i++) {
          days.push(toDay(addDays(start.date, i)));
        }

        return {
          id: start._id,
          startDate: startDay,
          endDate: toDay(endDate),
          endedExplicitly: Boolean(end),
          lengthDays,
          cycleLength,
          flow: start.flow || '',
          painLevel: start.painLevel || 0,
          notes: start.notes || '',
          days,
        };
      })
      .reverse();

    // Calendar marks for current + adjacent months
    const calendarMarks = {};
    periodEpisodes.forEach((ep) => {
      ep.days.forEach((day, i) => {
        calendarMarks[day] = {
          ...(calendarMarks[day] || {}),
          period: true,
          periodDay: i + 1,
          episodeId: ep.id,
          flow: ep.flow,
        };
      });
    });

    if (insights.ovulationWindow) {
      const { start, end, peak } = insights.ovulationWindow;
      let cursor = new Date(start);
      const last = new Date(end);
      while (cursor <= last) {
        const key = toDay(cursor);
        calendarMarks[key] = {
          ...(calendarMarks[key] || {}),
          fertile: true,
          ovulationPeak: key === peak,
        };
        cursor = addDays(cursor, 1);
      }
    }

    if (insights.nextPeriodPrediction) {
      const predStart = new Date(insights.nextPeriodPrediction);
      for (let i = 0; i < avgPeriodLength; i++) {
        const key = toDay(addDays(predStart, i));
        calendarMarks[key] = {
          ...(calendarMarks[key] || {}),
          predictedPeriod: true,
          predictedDay: i + 1,
        };
      }
    }

    const openPeriod = starts.length
      ? (() => {
          const lastStart = starts[starts.length - 1];
          const hasEnd = ends.some(
            (e) =>
              new Date(e.date) >= new Date(lastStart.date) &&
              daysBetween(lastStart.date, e.date) <= 12
          );
          if (hasEnd) return null;
          const dayNum = daysBetween(lastStart.date, new Date()) + 1;
          if (dayNum > 12) return null;
          return {
            startDate: toDay(lastStart.date),
            dayNumber: dayNum,
            flow: lastStart.flow || '',
            logId: lastStart._id,
          };
        })()
      : null;

    res.json({
      insights,
      avgPeriodLength,
      openPeriod,
      episodes: periodEpisodes,
      calendarMarks,
      recentLogs: periodRelated.slice(-40).reverse(),
      stats: {
        totalCycles: Math.max(0, starts.length - 1),
        loggedPeriods: starts.length,
        averageCycleLength: insights.averageCycleLength,
        averagePeriodLength: avgPeriodLength,
        currentPhase: insights.currentPhase,
        nextPeriodPrediction: insights.nextPeriodPrediction,
        ovulationWindow: insights.ovulationWindow,
      },
    });
  } catch (error) {
    console.error('getPeriods:', error);
    res.status(500).json({ message: 'Failed to load period overview' });
  }
};

exports.updateSymptom = async (req, res) => {
  try {
    const log = await SymptomLog.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });
    if (!log) return res.status(404).json({ message: 'Log not found' });

    const fields = [
      'date',
      'entryType',
      'symptoms',
      'painLevel',
      'mood',
      'flow',
      'temperature',
      'notes',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        log[f] = f === 'date' ? new Date(req.body[f]) : req.body[f];
      }
    });
    await log.save();
    res.json({ log });
  } catch (error) {
    console.error('updateSymptom:', error);
    res.status(500).json({ message: 'Failed to update log' });
  }
};

exports.deleteSymptom = async (req, res) => {
  try {
    const log = await SymptomLog.findOneAndDelete({
      _id: req.params.id,
      patient: req.user._id,
    });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ ok: true, id: log._id });
  } catch (error) {
    console.error('deleteSymptom:', error);
    res.status(500).json({ message: 'Failed to delete log' });
  }
};
