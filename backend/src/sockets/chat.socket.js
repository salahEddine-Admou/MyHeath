const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * Canal temps réel Socket.io — messagerie privée Patient ↔ Médecin.
 * Contenu persisté chiffré AES-256.
 */
function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'heracare_jwt_secret'
      );
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);
    console.log(`[Socket] ${socket.user.email} connecté`);

    socket.on('join_conversation', ({ partnerId }) => {
      if (!partnerId) return;
      const room = Message.buildConversationId(userId, partnerId);
      socket.join(room);
    });

    socket.on('private_message', async (payload, ack) => {
      try {
        const { receiverId, content } = payload || {};
        if (!receiverId || !content?.trim()) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Données invalides' });
          return;
        }

        // Vérifier relation patient ↔ médecin assigné
        const allowed = await canCommunicate(socket.user, receiverId);
        if (!allowed) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Non autorisé' });
          return;
        }

        const msg = await Message.createEncrypted({
          sender: socket.user._id,
          receiver: receiverId,
          content: content.trim(),
        });

        const clientMsg = msg.toClient();
        const room = msg.conversationId;
        io.to(room).emit('private_message', clientMsg);
        io.to(`user:${receiverId}`).emit('private_message', clientMsg);

        if (typeof ack === 'function') ack({ ok: true, message: clientMsg });
      } catch (error) {
        console.error('private_message error:', error);
        if (typeof ack === 'function') ack({ ok: false, error: 'Erreur serveur' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${socket.user.email} déconnecté`);
    });
  });
}

async function canCommunicate(user, partnerId) {
  const partner = await User.findById(partnerId);
  if (!partner) return false;

  if (user.role === 'patient' && partner.role === 'doctor') {
    return String(user.assignedDoctor) === String(partner._id);
  }
  if (user.role === 'doctor' && partner.role === 'patient') {
    return String(partner.assignedDoctor) === String(user._id);
  }
  if (user.role === 'admin') return true;
  return false;
}

module.exports = initSocket;
