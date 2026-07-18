const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'MAD' },
    interval: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      default: 'monthly',
    },
    features: [{ type: String }],
    maxAiMessages: { type: Number, default: 30 },
    includesDiabetes: { type: Boolean, default: true },
    includesPeriod: { type: Boolean, default: true },
    includesAiCoach: { type: Boolean, default: false },
    includesPriorityChat: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
