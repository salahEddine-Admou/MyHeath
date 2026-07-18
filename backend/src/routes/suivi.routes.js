const express = require('express');
const suivi = require('../controllers/suivi.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(protect);
router.use(authorize('patient'));

router.post('/daily', suivi.upsertDaily);
router.get('/daily', suivi.getDailyHistory);
router.get('/daily/today', suivi.getToday);
router.get('/diabetes', suivi.getDiabetesOverview);
router.put('/diabetes/profile', suivi.updateDiabetesProfile);

module.exports = router;
