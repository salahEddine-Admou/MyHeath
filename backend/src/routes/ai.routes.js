const express = require('express');
const aiController = require('../controllers/ai.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('patient', 'doctor', 'admin'));

router.post('/chat', aiController.chat);
router.post('/explain-insights', authorize('patient'), aiController.explainInsights);
router.post('/parse-symptoms', authorize('patient'), aiController.parseSymptoms);
router.post('/doctor-brief', authorize('patient'), aiController.doctorBrief);
router.post('/wellness-plan', authorize('patient'), aiController.wellnessPlan);
router.post('/ask-doctor', authorize('patient'), aiController.askDoctor);

module.exports = router;
