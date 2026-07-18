require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const HealthRecord = require('./models/HealthRecord');
const SymptomLog = require('./models/SymptomLog');
const DailyHealthLog = require('./models/DailyHealthLog');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const UserSubscription = require('./models/UserSubscription');
const { computeHealthScore } = require('./utils/healthScore');

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    HealthRecord.deleteMany({}),
    SymptomLog.deleteMany({}),
    DailyHealthLog.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    UserSubscription.deleteMany({}),
  ]);

  const admin = await User.create({
    firstName: 'Platform',
    lastName: 'Admin',
    email: 'admin@myheath.app',
    password: 'Admin123',
    role: 'admin',
    gender: 'woman',
  });

  const doctor = await User.create({
    firstName: 'Amina',
    lastName: 'Benali',
    email: 'doctor@myheath.app',
    password: 'Doctor123',
    role: 'doctor',
    gender: 'woman',
    specialty: 'General & Gynecology',
  });

  const woman = await User.create({
    firstName: 'Sara',
    lastName: 'Alaoui',
    email: 'patient@myheath.app',
    password: 'Patient123',
    role: 'patient',
    gender: 'woman',
    hasDiabetes: true,
    diabetesType: 'type2',
    assignedDoctor: doctor._id,
    dateOfBirth: new Date('1995-04-12'),
  });

  const man = await User.create({
    firstName: 'Youssef',
    lastName: 'Amrani',
    email: 'man@myheath.app',
    password: 'Patient123',
    role: 'patient',
    gender: 'man',
    hasDiabetes: true,
    diabetesType: 'type2',
    assignedDoctor: doctor._id,
    dateOfBirth: new Date('1990-08-03'),
  });

  for (const p of [woman, man]) {
    const record = await HealthRecord.create({ patient: p._id });
    record.bloodType = p.gender === 'man' ? 'O+' : 'A+';
    record.setSensitiveFields({
      allergies: ['Penicillin'],
      medications: p.hasDiabetes ? ['Metformin'] : ['None'],
      clinicalNotes: `${p.gender} patient — MyHeath seed profile.`,
    });
    await record.save();
  }

  const starts = [
    '2025-11-01',
    '2025-12-05',
    '2026-01-20',
    '2026-02-12',
    '2026-03-28',
    '2026-05-02',
    '2026-06-18',
  ];

  for (const d of starts) {
    await SymptomLog.create({
      patient: woman._id,
      date: new Date(d),
      entryType: 'period_start',
      flow: 'medium',
      symptoms: ['cramps'],
      painLevel: 5,
    });
  }

  await SymptomLog.create({
    patient: woman._id,
    date: new Date('2026-07-01'),
    entryType: 'symptom',
    symptoms: ['pelvic pain', 'hirsutism'],
    painLevel: 9,
    mood: 'bad',
  });

  // Daily health samples for both
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (const offset of days) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    for (const person of [woman, man]) {
      const payload =
        person.gender === 'man'
          ? {
              energy: 5 + (offset % 3),
              sleepHours: 6 + (offset % 2),
              sleepQuality: 5 + (offset % 4),
              stress: 3 + (offset % 5),
              mood: offset % 2 ? 'good' : 'ok',
              waterLiters: 2,
              steps: 6000 + offset * 400,
              exerciseMinutes: 40,
              workoutIntensity: 6 + (offset % 3),
              recovery: 7 - (offset % 4),
              fastingGlucose: 95 + offset * 3,
              tookMedication: offset % 3 !== 0,
            }
          : {
              energy: 4 + (offset % 4),
              sleepHours: 7,
              sleepQuality: 6,
              stress: 4 + (offset % 3),
              mood: 'good',
              waterLiters: 1.8,
              steps: 4500,
              exerciseMinutes: 25,
              recovery: 6,
              workoutIntensity: 0,
              fastingGlucose: 110 + offset * 2,
              tookMedication: true,
            };

      const scored = computeHealthScore(payload, {
        gender: person.gender,
        hasDiabetes: person.hasDiabetes,
      });

      await DailyHealthLog.create({
        patient: person._id,
        date,
        ...payload,
        healthScore: scored.score,
        healthLabel: scored.label,
      });
    }
  }

  const [freePlan, carePlan, premiumPlan] = await SubscriptionPlan.create([
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
  ]);

  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  await UserSubscription.create([
    {
      user: woman._id,
      plan: carePlan._id,
      status: 'active',
      endDate: end,
      managedBy: admin._id,
      notes: 'Seed Care plan',
    },
    {
      user: man._id,
      plan: premiumPlan._id,
      status: 'active',
      endDate: end,
      managedBy: admin._id,
      notes: 'Seed Premium plan',
    },
    {
      user: doctor._id,
      plan: freePlan._id,
      status: 'active',
      endDate: null,
      managedBy: admin._id,
    },
  ]);

  console.log('Seed OK');
  console.log('Admin  : admin@myheath.app / Admin123');
  console.log('Doctor : doctor@myheath.app / Doctor123');
  console.log('Woman  : patient@myheath.app / Patient123 (Care plan)');
  console.log('Man    : man@myheath.app / Patient123 (Premium plan)');
  console.log('Plans  : FREE / CARE (99 MAD) / PREMIUM (199 MAD)');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
