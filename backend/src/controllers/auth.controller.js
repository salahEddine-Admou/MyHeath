const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'heracare_jwt_secret', {
    expiresIn: '7d',
  });

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, phone, specialty } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    const allowedRoles = ['patient', 'doctor'];
    const safeRole = allowedRoles.includes(role) ? role : 'patient';

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: safeRole,
      phone: phone || '',
      specialty: safeRole === 'doctor' ? specialty || 'Gynécologie' : '',
    });

    if (user.role === 'patient') {
      await HealthRecord.create({ patient: user._id });
    }

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ message: 'Erreur lors de l’inscription' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};

exports.listDoctors = async (_req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true }).select(
      'firstName lastName specialty email'
    );
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération médecins' });
  }
};

exports.assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Médecin introuvable' });
    }

    req.user.assignedDoctor = doctor._id;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Erreur assignation médecin' });
  }
};
