const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Dossier médical partagé — champs sensibles chiffrés AES-256-CBC au repos.
 */
const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Contenu clinique chiffré (JSON stringifié puis encrypté)
    encryptedData: { type: String, default: '' },
    bloodType: { type: String, default: '' },
    allergiesEncrypted: { type: String, default: '' },
    medicationsEncrypted: { type: String, default: '' },
    notesEncrypted: { type: String, default: '' },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

healthRecordSchema.methods.setSensitiveFields = function setSensitiveFields({
  allergies,
  medications,
  clinicalNotes,
  extra,
}) {
  if (allergies !== undefined) this.allergiesEncrypted = encrypt(allergies);
  if (medications !== undefined) this.medicationsEncrypted = encrypt(medications);
  if (clinicalNotes !== undefined) this.notesEncrypted = encrypt(clinicalNotes);
  if (extra !== undefined) this.encryptedData = encrypt(extra);
};

healthRecordSchema.methods.getDecrypted = function getDecrypted() {
  return {
    id: this._id,
    patient: this.patient,
    bloodType: this.bloodType,
    allergies: this.allergiesEncrypted ? decrypt(this.allergiesEncrypted) : [],
    medications: this.medicationsEncrypted
      ? decrypt(this.medicationsEncrypted)
      : [],
    clinicalNotes: this.notesEncrypted ? decrypt(this.notesEncrypted) : '',
    extra: this.encryptedData ? decrypt(this.encryptedData) : {},
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
