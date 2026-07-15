require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const HealthRecord = require('./models/HealthRecord');
const SymptomLog = require('./models/SymptomLog');

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    HealthRecord.deleteMany({}),
    SymptomLog.deleteMany({}),
  ]);

  const doctor = await User.create({
    firstName: 'Amina',
    lastName: 'Benali',
    email: 'docteur@heracare.ma',
    password: 'Doctor123',
    role: 'doctor',
    specialty: 'Gynécologie-Obstétrique',
  });

  const patient = await User.create({
    firstName: 'Sara',
    lastName: 'Alaoui',
    email: 'patiente@heracare.ma',
    password: 'Patient123',
    role: 'patient',
    assignedDoctor: doctor._id,
    dateOfBirth: new Date('1995-04-12'),
  });

  await HealthRecord.create({
    patient: patient._id,
  });

  const record = await HealthRecord.findOne({ patient: patient._id });
  record.bloodType = 'A+';
  record.setSensitiveFields({
    allergies: ['Pénicilline'],
    medications: ['Aucun'],
    clinicalNotes: 'Suivi cycle menstruel — première consultation HeraCare.',
  });
  await record.save();

  // Historique de cycles (irréguliers pour démontrer les alertes)
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
      patient: patient._id,
      date: new Date(d),
      entryType: 'period_start',
      flow: 'medium',
      symptoms: ['crampes'],
      painLevel: 5,
    });
  }

  await SymptomLog.create({
    patient: patient._id,
    date: new Date('2026-06-20'),
    entryType: 'symptom',
    symptoms: ['acné', 'fatigue', 'douleur pelvienne'],
    painLevel: 8,
    mood: 'low',
  });
  await SymptomLog.create({
    patient: patient._id,
    date: new Date('2026-07-01'),
    entryType: 'symptom',
    symptoms: ['douleur pelvienne', 'hirsutisme'],
    painLevel: 9,
    mood: 'bad',
  });
  await SymptomLog.create({
    patient: patient._id,
    date: new Date('2026-07-10'),
    entryType: 'symptom',
    symptoms: ['prise de poids', 'acné'],
    painLevel: 7,
    mood: 'ok',
  });

  console.log('Seed OK');
  console.log('Médecin  : docteur@heracare.ma / Doctor123');
  console.log('Patiente : patiente@heracare.ma / Patient123');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
