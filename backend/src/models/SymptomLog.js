const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, default: Date.now },
    // Type d'entrée
    entryType: {
      type: String,
      enum: ['symptom', 'period_start', 'period_end', 'note'],
      default: 'symptom',
    },
    symptoms: [{ type: String }],
    painLevel: { type: Number, min: 0, max: 10, default: 0 },
    mood: {
      type: String,
      enum: ['great', 'good', 'ok', 'low', 'bad', ''],
      default: '',
    },
    flow: {
      type: String,
      enum: ['none', 'light', 'medium', 'heavy', ''],
      default: '',
    },
    temperature: { type: Number },
    notes: { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

symptomLogSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
