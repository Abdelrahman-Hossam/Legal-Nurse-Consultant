const User = require('../../../models/User.model');
const AuditLog = require('../../../models/AuditLog.model');
const LawFirm = require('../../../models/LawFirm.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;

        // Build query
        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const users = await User.find(query)
            .select('-password -refreshToken')
            .populate('lawFirm', 'firmName')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        // Get total count
        const count = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalUsers: count,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -refreshToken')
            .populate('lawFirm', 'firmName')
            .populate('casesAssigned', 'caseNumber clientName status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
    try {
        const { fullName, email, password, phone, role, lawFirm } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        let normalizedLawFirm = undefined;
        if (role === 'attorney') {
            if (!lawFirm) {
                return res.status(400).json({
                    success: false,
                    message: 'Law firm is required for attorney users'
                });
            }
            const firm = await LawFirm.findById(lawFirm).select('_id').lean();
            if (!firm) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected law firm does not exist'
                });
            }
            normalizedLawFirm = firm._id;
        }

        // Create user
        const user = await User.create({
            fullName,
            email,
            password,
            phone,
            role,
            lawFirm: normalizedLawFirm
        });

        // Log action
        await AuditLog.create({
            user: req.user._id,
            action: 'CREATE',
            resource: `/api/users/${user._id}`,
            method: 'POST',
            ipAddress: req.ip,
            statusCode: 201
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    lawFirm: user.lawFirm
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { fullName, email, phone, role, status, lawFirm } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (status) user.status = status;
        const nextRole = role || user.role;
        if (nextRole === 'attorney') {
            const targetLawFirm = lawFirm || user.lawFirm;
            if (!targetLawFirm) {
                return res.status(400).json({
                    success: false,
                    message: 'Law firm is required for attorney users'
                });
            }
            const firm = await LawFirm.findById(targetLawFirm).select('_id').lean();
            if (!firm) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected law firm does not exist'
                });
            }
            user.lawFirm = firm._id;
        } else if (lawFirm !== undefined) {
            user.lawFirm = undefined;
        }

        await user.save();

        // Log action
        await AuditLog.create({
            user: req.user._id,
            action: 'UPDATE',
            resource: `/api/users/${user._id}`,
            method: 'PUT',
            ipAddress: req.ip,
            statusCode: 200
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    lawFirm: user.lawFirm
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting own account
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        // Log action
        await AuditLog.create({
            user: req.user._id,
            action: 'DELETE',
            resource: `/api/users/${req.params.id}`,
            method: 'DELETE',
            ipAddress: req.ip,
            statusCode: 200
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = status;
        await user.save();

        // Log action
        await AuditLog.create({
            user: req.user._id,
            action: 'UPDATE',
            resource: `/api/users/${user._id}/status`,
            method: 'PATCH',
            ipAddress: req.ip,
            statusCode: 200
        });

        res.status(200).json({
            success: true,
            message: 'User status updated successfully',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        const consultantCount = await User.countDocuments({ role: 'consultant' });
        const attorneyCount = await User.countDocuments({ role: 'attorney' });
        const clientCount = await User.countDocuments({ role: 'client' });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeUsers,
                    inactiveUsers: totalUsers - activeUsers,
                    adminCount,
                    attorneyCount,
                    consultantCount,
                    clientCount
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
