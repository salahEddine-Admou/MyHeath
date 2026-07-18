const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['patient', 'doctor', 'admin'];
const GENDERS = ['woman', 'man'];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'patient' },
    gender: { type: String, enum: GENDERS, default: 'woman' },
    hasDiabetes: { type: Boolean, default: false },
    diabetesType: {
      type: String,
      enum: ['none', 'type1', 'type2', 'gestational', 'prediabetes', ''],
      default: 'none',
    },
    phone: { type: String, default: '' },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    specialty: { type: String, default: '' },
    dateOfBirth: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    gender: this.gender,
    hasDiabetes: this.hasDiabetes,
    diabetesType: this.diabetesType,
    phone: this.phone,
    assignedDoctor: this.assignedDoctor,
    specialty: this.specialty,
    dateOfBirth: this.dateOfBirth,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.GENDERS = GENDERS;
