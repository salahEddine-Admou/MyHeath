const express = require('express');
const { protect, authorize } = require('../middlewares/auth.middleware');
const admin = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', admin.getOverview);

router.get('/users', admin.listUsers);
router.post('/users', admin.createUser);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

router.get('/plans', admin.listPlans);
router.post('/plans', admin.createPlan);
router.put('/plans/:id', admin.updatePlan);
router.delete('/plans/:id', admin.deletePlan);

router.get('/subscriptions', admin.listSubscriptions);
router.post('/subscriptions', admin.assignSubscription);
router.put('/subscriptions/:id', admin.updateSubscription);
router.post('/subscriptions/:id/cancel', admin.cancelSubscription);

module.exports = router;
