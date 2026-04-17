const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case.controller');
const { protect, authorize } = require('../../../shared/middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../../../shared/middleware/validation.middleware');

// Validation rules
const caseValidation = [
    body('caseName').trim().notEmpty().withMessage('Case name is required'),
    body('caseType').isIn(['medical-malpractice', 'personal-injury', 'workers-compensation', 'product-liability', 'other'])
        .withMessage('Valid case type is required'),
    body('client').isMongoId().withMessage('Valid client id is required'),
    body('lawFirm').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid law firm id')
];

// Get all cases (requires authentication)
router.get('/', protect, caseController.getAllCases);

// Get case statistics (requires authentication)
router.get('/stats', protect, caseController.getCaseStats);

// Get case by ID (requires authentication)
router.get('/:id', protect, caseController.getCaseById);

// Create new case (admin, attorney, consultant)
router.post('/',
    protect,
    authorize('admin', 'attorney', 'consultant'),
    validate(caseValidation),
    caseController.createCase
);

// Update case (admin, attorney, consultant)
router.put('/:id',
    protect,
    authorize('admin', 'attorney', 'consultant'),
    caseController.updateCase
);

// Consultant acknowledges intake case → review
router.post('/:id/acknowledge',
    protect,
    authorize('consultant'),
    caseController.acknowledgeCase
);

// Delete case (admin only)
router.delete('/:id',
    protect,
    authorize('admin'),
    caseController.deleteCase
);

// Add timeline event
router.post('/:id/timeline',
    protect,
    authorize('admin', 'attorney', 'consultant'),
    body('event').notEmpty().withMessage('Event is required'),
    validate,
    caseController.addTimelineEvent
);

// Add document
router.post('/:id/documents',
    protect,
    authorize('admin', 'attorney', 'consultant'),
    body('name').notEmpty().withMessage('Document name is required'),
    body('url').notEmpty().withMessage('Document URL is required'),
    validate,
    caseController.addDocument
);

module.exports = router;
