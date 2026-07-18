const Message = require('../models/Message');
const User = require('../models/User');

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

exports.getConversation = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const conversationId = Message.buildConversationId(req.user._id, partnerId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({
      conversationId,
      encrypted: true,
      messages: messages.map((m) => m.toClient()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load conversation' });
  }
};

exports.getPartners = async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      if (!req.user.assignedDoctor) {
        return res.json({ partners: [] });
      }
      const doctor = await User.findById(req.user.assignedDoctor).select(
        'firstName lastName specialty role email'
      );
      return res.json({ partners: doctor ? [doctor] : [] });
    }

    if (req.user.role === 'doctor') {
      const patients = await User.find({
        role: 'patient',
        assignedDoctor: req.user._id,
      }).select('firstName lastName email role');
      return res.json({ partners: patients });
    }

    if (req.user.role === 'admin') {
      const partners = await User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        role: { $in: ['doctor', 'patient'] },
      }).select('firstName lastName email role specialty');
      return res.json({ partners });
    }

    res.json({ partners: [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load chat partners' });
  }
};

/** REST send — works on Vercel serverless (Socket.io optional locally). */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ message: 'receiverId and content are required' });
    }

    const allowed = await canCommunicate(req.user, receiverId);
    if (!allowed) {
      return res.status(403).json({ message: 'Not allowed to message this user' });
    }

    const msg = await Message.createEncrypted({
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
    });

    res.status(201).json({ message: msg.toClient() });
  } catch (error) {
    console.error('sendMessage:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
