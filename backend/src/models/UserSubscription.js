const mongoose = require('mongoose');

const STATUSES = ['active', 'trial', 'cancelled', 'expired', 'past_due'];

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'active',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    autoRenew: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

userSubscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
module.exports.STATUSES = STATUSES;
