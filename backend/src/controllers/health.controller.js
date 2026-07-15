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
