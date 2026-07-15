const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto');

/**
 * Message de télémédecine — contenu chiffré au repos (AES-256).
 */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    encryptedContent: { type: String, required: true },
    conversationId: { type: String, required: true, index: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.statics.buildConversationId = function buildConversationId(a, b) {
  return [String(a), String(b)].sort().join('_');
};

messageSchema.statics.createEncrypted = async function createEncrypted({
  sender,
  receiver,
  content,
}) {
  const conversationId = this.buildConversationId(sender, receiver);
  return this.create({
    sender,
    receiver,
    encryptedContent: encrypt(content),
    conversationId,
  });
};

messageSchema.methods.toClient = function toClient() {
  return {
    id: this._id,
    sender: this.sender,
    receiver: this.receiver,
    content: decrypt(this.encryptedContent),
    conversationId: this.conversationId,
    read: this.read,
    createdAt: this.createdAt,
    encrypted: true,
  };
};

module.exports = mongoose.model('Message', messageSchema);
