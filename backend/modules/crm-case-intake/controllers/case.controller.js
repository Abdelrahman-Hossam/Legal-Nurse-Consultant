const Case = require('../../../models/Case.model');
const User = require('../../../models/User.model');
const AppError = require('../../../shared/errors/AppError');
const caseService = require('../services/case.service');
const notificationService = require('../../notifications/services/notification.service');

const CASE_STATUSES = ['intake', 'review', 'active', 'pending', 'closed', 'archived'];

function assertStatusAllowedForRole(role, status) {
    if (status === undefined) return;
    if (!CASE_STATUSES.includes(status)) {
        throw new AppError('Invalid case status', 400);
    }
    if (role === 'consultant') {
        if (status === 'archived' || status === 'intake') {
            throw new AppError('Not authorized to set this status', 403);
        }
    }
}

/** Safe fragment for use inside MongoDB $regex (user-supplied search). */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function assertConsultantAssignedToCase(caseDoc, user) {
    if (user.role !== 'consultant') return;
    const ac = caseDoc.assignedConsultant;
    const assignedId = ac
        ? typeof ac === 'object' && ac._id
            ? ac._id.toString()
            : ac.toString()
        : null;
    if (!assignedId || assignedId !== user._id.toString()) {
        throw new AppError('Not authorized to access this case', 403);
    }
}

// Get all cases
exports.getAllCases = async (req, res, next) => {
    try {
        const { status, priority, caseType, search, page = 1, limit = 10 } = req.query;

        const conditions = [];
        if (req.user.role === 'consultant') {
            conditions.push({ assignedConsultant: req.user._id });
        }
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

        assertConsultantAssignedToCase(caseData, req.user);

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
        const body = { ...req.body };
        if (req.user.role === 'consultant' && !body.assignedConsultant) {
            body.assignedConsultant = req.user._id;
        }
        if (['admin', 'attorney'].includes(req.user.role) && body.assignedConsultant) {
            body.assignedBy = req.user._id;
        }

        const populatedCase = await caseService.createCase(body, req.user._id);

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
        const existing = await Case.findById(req.params.id);
        if (!existing) {
            throw new AppError('Case not found', 404);
        }
        if (req.user.role === 'consultant') {
            const aid = existing.assignedConsultant?.toString();
            if (!aid || aid !== req.user._id.toString()) {
                throw new AppError('Not authorized to update this case', 403);
            }
        }

        const body = { ...req.body };
        if (req.user.role === 'consultant') {
            delete body.assignedConsultant;
        }

        assertStatusAllowedForRole(req.user.role, body.status);

        const prevAssigned = existing.assignedConsultant?.toString();
        const updatePayload = caseService.sanitizeCaseUpdateBody(body);
        let nextAssigned = prevAssigned;
        if (updatePayload.assignedConsultant !== undefined) {
            nextAssigned = updatePayload.assignedConsultant
                ? updatePayload.assignedConsultant.toString()
                : null;
        }
        if (
            ['admin', 'attorney'].includes(req.user.role) &&
            updatePayload.assignedConsultant !== undefined &&
            nextAssigned &&
            nextAssigned !== prevAssigned
        ) {
            updatePayload.assignedBy = req.user._id;
        }

        const caseData = await Case.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true, runValidators: true }
        ).populate('client lawFirm assignedConsultant createdBy');

        if (!caseData) {
            throw new AppError('Case not found', 404);
        }

        if (nextAssigned && nextAssigned !== prevAssigned) {
            const assignee = await User.findById(nextAssigned).select('role').lean();
            const casePath =
                assignee?.role === 'consultant'
                    ? `/staff/cases/${caseData._id}`
                    : `/cases/${caseData._id}`;
            await notificationService.createNotification({
                user: nextAssigned,
                title: 'Case assigned to you',
                message: `You were assigned to ${caseData.caseNumber || ''} — ${caseData.caseName || 'case'}.`,
                type: 'case',
                link: casePath,
                priority: 'high',
                metadata: { caseId: caseData._id.toString() }
            });
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

// Acknowledge case (consultant only: intake → review)
exports.acknowledgeCase = async (req, res, next) => {
    try {
        const caseDoc = await Case.findById(req.params.id);
        if (!caseDoc) {
            throw new AppError('Case not found', 404);
        }
        if (req.user.role !== 'consultant') {
            throw new AppError('Only consultants can acknowledge a case', 403);
        }
        const aid = caseDoc.assignedConsultant?.toString();
        if (!aid || aid !== req.user._id.toString()) {
            throw new AppError('You are not the assigned consultant for this case', 403);
        }
        if (caseDoc.status !== 'intake') {
            throw new AppError('Only cases in intake status can be acknowledged', 400);
        }

        caseDoc.status = 'review';
        await caseDoc.save();

        const populated = await Case.findById(caseDoc._id)
            .populate('client', 'fullName email phone')
            .populate('lawFirm', 'firmName contactPerson email phone')
            .populate('assignedConsultant', 'fullName email phone')
            .populate('createdBy', 'fullName email');

        const actorName = req.user.fullName || 'Consultant';
        const notifyUserId = caseDoc.assignedBy || caseDoc.createdBy;
        if (notifyUserId) {
            await notificationService.createNotification({
                user: notifyUserId,
                title: 'Case acknowledged',
                message: `${actorName} acknowledged ${caseDoc.caseNumber || ''} — ${caseDoc.caseName || 'case'} (now in review).`,
                type: 'case',
                link: `/cases/${caseDoc._id}`,
                priority: 'medium',
                metadata: { caseId: caseDoc._id.toString() }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Case acknowledged',
            data: { case: populated }
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

        assertConsultantAssignedToCase(caseData, req.user);

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

        assertConsultantAssignedToCase(caseData, req.user);

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
        const match =
            req.user.role === 'consultant' ? { assignedConsultant: req.user._id } : {};

        const statusStats = await Case.aggregate([
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const priorityStats = await Case.aggregate([
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const total = await Case.countDocuments(
            Object.keys(match).length ? match : {}
        );

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
