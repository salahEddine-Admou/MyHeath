/**
 * Upsert subscription plans + ensure demo users have subscriptions.
 * Does not wipe users. Usage: npm run seed:plans
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const UserSubscription = require('./models/UserSubscription');

const PLAN_DEFS = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Basic health tracking',
    price: 0,
    currency: 'MAD',
    interval: 'monthly',
    features: ['Daily suivi', 'Period tracking', 'Health records'],
    includesAiCoach: false,
    includesPriorityChat: false,
    maxAiMessages: 5,
    sortOrder: 1,
  },
  {
    code: 'CARE',
    name: 'Care',
    description: 'AI coach + diabetes support',
    price: 99,
    currency: 'MAD',
    interval: 'monthly',
    features: ['Everything in Free', 'AI Coach', 'Diabetes care', 'Insights'],
    includesAiCoach: true,
    includesPriorityChat: false,
    maxAiMessages: 60,
    sortOrder: 2,
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    description: 'Full platform + priority consult',
    price: 199,
    currency: 'MAD',
    interval: 'monthly',
    features: ['Everything in Care', 'Priority chat', 'Unlimited AI', 'Admin support'],
    includesAiCoach: true,
    includesPriorityChat: true,
    maxAiMessages: 999,
    sortOrder: 3,
  },
];

async function upsertPlan(def) {
  return SubscriptionPlan.findOneAndUpdate({ code: def.code }, def, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
}

async function ensureSub(userEmail, planCode, adminId) {
  const user = await User.findOne({ email: userEmail });
  const plan = await SubscriptionPlan.findOne({ code: planCode });
  if (!user || !plan) return;

  const existing = await UserSubscription.findOne({
    user: user._id,
    status: { $in: ['active', 'trial'] },
  });
  if (existing) {
    existing.plan = plan._id;
    existing.managedBy = adminId;
    await existing.save();
    console.log(`Updated sub: ${userEmail} → ${planCode}`);
    return;
  }

  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  await UserSubscription.create({
    user: user._id,
    plan: plan._id,
    status: 'active',
    endDate: plan.price === 0 ? null : end,
    managedBy: adminId,
    notes: 'seed:plans',
  });
  console.log(`Created sub: ${userEmail} → ${planCode}`);
}

async function run() {
  await connectDB();
  for (const def of PLAN_DEFS) {
    const p = await upsertPlan(def);
    console.log('Plan:', p.code, p.price, p.currency);
  }

  const admin = await User.findOne({ email: 'admin@myheath.app' });
  await ensureSub('patient@myheath.app', 'CARE', admin?._id);
  await ensureSub('man@myheath.app', 'PREMIUM', admin?._id);
  await ensureSub('doctor@myheath.app', 'FREE', admin?._id);

  await mongoose.disconnect();
  console.log('seed:plans OK');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
