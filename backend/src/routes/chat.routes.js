const express = require('express');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/partners', chatController.getPartners);
router.get('/:partnerId', chatController.getConversation);

module.exports = router;
