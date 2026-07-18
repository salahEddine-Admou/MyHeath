const express = require('express');
const healthController = require('../controllers/health.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/symptoms', authorize('patient'), healthController.logSymptom);
router.get('/symptoms', authorize('patient', 'doctor', 'admin'), healthController.getHistory);
router.put('/symptoms/:id', authorize('patient'), healthController.updateSymptom);
router.delete('/symptoms/:id', authorize('patient'), healthController.deleteSymptom);
router.get('/periods', authorize('patient'), healthController.getPeriods);
router.get('/insights', authorize('patient', 'doctor', 'admin'), healthController.getInsights);
router.get('/record', authorize('patient'), healthController.getHealthRecord);
router.put('/record', authorize('patient'), healthController.updateHealthRecord);

module.exports = router;
