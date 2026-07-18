const mongoose = require('mongoose');

/**
 * One health check-in per patient per day — used for wellness score prediction.
 */
const dailyHealthSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    // Core wellness (0-10)
    energy: { type: Number, min: 0, max: 10, default: 5 },
    sleepHours: { type: Number, min: 0, max: 24, default: 7 },
    sleepQuality: { type: Number, min: 0, max: 10, default: 5 },
    stress: { type: Number, min: 0, max: 10, default: 5 },
    mood: {
      type: String,
      enum: ['great', 'good', 'ok', 'low', 'bad', ''],
      default: 'ok',
    },
    waterLiters: { type: Number, min: 0, max: 10, default: 1.5 },
    steps: { type: Number, min: 0, default: 0 },
    exerciseMinutes: { type: Number, min: 0, max: 600, default: 0 },
    // Men-focused
    workoutIntensity: { type: Number, min: 0, max: 10, default: 0 },
    recovery: { type: Number, min: 0, max: 10, default: 5 },
    // Shared clinical-ish
    weightKg: { type: Number },
    restingHeartRate: { type: Number, min: 30, max: 220 },
    // Diabetes
    fastingGlucose: { type: Number }, // mg/dL
    postMealGlucose: { type: Number },
    tookMedication: { type: Boolean, default: false },
    carbsGrams: { type: Number, min: 0 },
    // Free form
    symptoms: [{ type: String }],
    notes: { type: String, maxlength: 2000, default: '' },
    // Computed on save/read
    healthScore: { type: Number, min: 0, max: 100 },
    healthLabel: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical', ''],
      default: '',
    },
  },
  { timestamps: true }
);

dailyHealthSchema.index({ patient: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyHealthLog', dailyHealthSchema);
