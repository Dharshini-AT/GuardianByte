const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../config/auth');

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('zone')
    .isIn(['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'])
    .withMessage('Please select a valid zone'),
  body('vehicleType')
    .isIn(['bike', 'scooter'])
    .withMessage('Vehicle type must be bike or scooter'),
  body('dailyEarningsExpectation')
    .isInt({ min: 500, max: 3000 })
    .withMessage('Daily earnings must be between ₹500 and ₹3000')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('zone')
    .optional()
    .isIn(['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)'])
    .withMessage('Please select a valid zone'),
  body('vehicleType')
    .optional()
    .isIn(['bike', 'scooter'])
    .withMessage('Vehicle type must be bike or scooter'),
  body('dailyEarningsExpectation')
    .optional()
    .isInt({ min: 500, max: 3000 })
    .withMessage('Daily earnings must be between ₹500 and ₹3000')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const createAdminValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

// Admin routes
router.post('/admin/create', createAdminValidation, authController.createAdmin);

module.exports = router;
