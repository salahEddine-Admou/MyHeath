const Message = require('../models/Message');
const User = require('../models/User');

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
    res.status(500).json({ message: 'Erreur chargement conversation' });
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

    res.json({ partners: [] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur partenaires chat' });
  }
};
