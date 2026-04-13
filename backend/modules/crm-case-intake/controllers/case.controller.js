const Case = require('../../../models/Case.model');
const AppError = require('../../../shared/errors/AppError');
const caseService = require('../services/case.service');

/** Safe fragment for use inside MongoDB $regex (user-supplied search). */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all cases
exports.getAllCases = async (req, res, next) => {
    try {
        const { status, priority, caseType, search, page = 1, limit = 10 } = req.query;

        const conditions = [];
        if (status) conditions.push({ status });
        if (priority) conditions.push({ priority });
        if (caseType) conditions.push({ caseType });

        const trimmedSearch = typeof search === 'string' ? search.trim() : '';
        if (trimmedSearch) {
            const safe = escapeRegex(trimmedSearch);
            conditions.push({
                $or: [
                    { caseNumber: { $regex: safe, $options: 'i' } },
                    { caseName: { $regex: safe, $options: 'i' } },
                    { description: { $regex: safe, $options: 'i' } }
                ]
            });
        }

        const query =
            conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

        const cases = await Case.find(query)
            .populate('client', 'fullName email phone')
            .populate('lawFirm', 'firmName email')
            .populate('assignedConsultant', 'fullName email')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Case.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                cases,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get case by ID
exports.getCaseById = async (req, res, next) => {
    try {
        const caseData = await Case.findById(req.params.id)
            .populate('client', 'fullName email phone address medicalHistory')
            .populate('lawFirm', 'firmName contactPerson email phone')
            .populate('assignedConsultant', 'fullName email phone')
            .populate('createdBy', 'fullName email')
            .populate('timeline.createdBy', 'fullName')
            .populate('documents.uploadedBy', 'fullName');

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        res.status(200).json({
            success: true,
            data: { case: caseData }
        });
    } catch (error) {
        next(error);
    }
};

// Create new case
exports.createCase = async (req, res, next) => {
    try {
        const populatedCase = await caseService.createCase(req.body, req.user._id);

        res.status(201).json({
            success: true,
            message: 'Case created successfully',
            data: { case: populatedCase }
        });
    } catch (error) {
        console.error('Create case error:', error);
        next(error);
    }
};

// Update case
exports.updateCase = async (req, res, next) => {
    try {
        const updatePayload = caseService.sanitizeCaseUpdateBody(req.body);
        const caseData = await Case.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        ).populate('client lawFirm assignedConsultant');

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Case updated successfully',
            data: { case: caseData }
        });
    } catch (error) {
        next(error);
    }
};

// Delete case
exports.deleteCase = async (req, res, next) => {
    try {
        const caseData = await Case.findByIdAndDelete(req.params.id);

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Case deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Add timeline event
exports.addTimelineEvent = async (req, res, next) => {
    try {
        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        caseData.timeline.push({
            ...req.body,
            createdBy: req.user._id
        });

        await caseData.save();

        res.status(200).json({
            success: true,
            message: 'Timeline event added successfully',
            data: { case: caseData }
        });
    } catch (error) {
        next(error);
    }
};

// Add document
exports.addDocument = async (req, res, next) => {
    try {
        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        caseData.documents.push({
            ...req.body,
            uploadedBy: req.user._id
        });

        await caseData.save();

        res.status(200).json({
            success: true,
            message: 'Document added successfully',
            data: { case: caseData }
        });
    } catch (error) {
        next(error);
    }
};

// Get case statistics
exports.getCaseStats = async (req, res, next) => {
    try {
        const statusStats = await Case.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const priorityStats = await Case.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const total = await Case.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                total,
                byStatus: statusStats,
                byPriority: priorityStats
            }
        });
    } catch (error) {
        next(error);
    }
};
