const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Chiffrement AES-256-CBC des données de santé sensibles (au repos).
 * Conforme aux bonnes pratiques Loi 09-08 (Maroc) / HIPAA (chiffrement at rest).
 */
function getKey() {
  const secret = process.env.AES_SECRET_KEY || '0123456789abcdef0123456789abcdef';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

function encrypt(text) {
  if (text === null || text === undefined) return text;
  const plain = typeof text === 'string' ? text : JSON.stringify(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plain, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(payload) {
  if (!payload || typeof payload !== 'string' || !payload.includes(':')) {
    return payload;
  }
  const [ivHex, encrypted] = payload.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

module.exports = { encrypt, decrypt };
