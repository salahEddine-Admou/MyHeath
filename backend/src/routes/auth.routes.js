const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  authController.register
);

router.post('/login', authController.login);
router.get('/me', protect, authController.me);
router.get('/doctors', protect, authController.listDoctors);
router.get('/users', protect, authorize('admin'), authController.listUsers);
router.post('/assign-doctor', protect, authorize('patient'), authController.assignDoctor);

module.exports = router;
