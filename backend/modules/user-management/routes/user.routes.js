const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../../../shared/middleware/validation.middleware');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// Validation rules
const createUserValidation = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'attorney', 'consultant', 'client']).withMessage('Invalid role')
];

const updateUserValidation = [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['admin', 'attorney', 'consultant', 'client']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
];

// All routes require authentication and admin or attorney role
router.use(protect);
router.use(authorize('admin', 'attorney'));

// Routes
router.get('/stats', userController.getUserStats);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', createUserValidation, validate, userController.createUser);
router.put('/:id', updateUserValidation, validate, userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/status', userController.updateUserStatus);

module.exports = router;
