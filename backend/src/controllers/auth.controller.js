const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'myheath_jwt_secret', {
    expiresIn: '7d',
  });

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, phone, specialty, gender, hasDiabetes, diabetesType } =
      req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    const allowedRoles = ['patient', 'doctor'];
    const safeRole = allowedRoles.includes(role) ? role : 'patient';
    const safeGender = gender === 'man' ? 'man' : 'woman';

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: safeRole,
      gender: safeGender,
      hasDiabetes: Boolean(hasDiabetes),
      diabetesType: hasDiabetes ? diabetesType || 'type2' : 'none',
      phone: phone || '',
      specialty:
        safeRole === 'doctor'
          ? specialty || (safeGender === 'man' ? 'General medicine' : 'Gynecology')
          : '',
    });

    if (user.role === 'patient') {
      await HealthRecord.create({ patient: user._id });
    }

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ message: 'Login failed' });
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
    res.status(500).json({ message: 'Failed to load doctors' });
  }
};

exports.assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    req.user.assignedDoctor = doctor._id;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign doctor' });
  }
};

exports.listUsers = async (_req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('firstName lastName email role gender specialty hasDiabetes createdAt')
      .sort({ role: 1, lastName: 1 });

    const counts = {
      total: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      doctor: users.filter((u) => u.role === 'doctor').length,
      patient: users.filter((u) => u.role === 'patient').length,
    };

    res.json({ counts, users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users' });
  }
};
