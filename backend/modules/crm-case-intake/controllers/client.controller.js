const Client = require('../../../models/Client.model');
const AppError = require('../../../shared/errors/AppError');

// Get all clients
exports.getAllClients = async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (search) query.$text = { $search: search };

        const clients = await Client.find(query)
            .populate('assignedTo', 'fullName email')
            .populate('lawFirm', 'firmName')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Client.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                clients,
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

// Get client by ID
exports.getClientById = async (req, res, next) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('assignedTo', 'fullName email phone')
            .populate('lawFirm', 'firmName email phone')
            .populate('createdBy', 'fullName');

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        res.status(200).json({
            success: true,
            data: { client }
        });
    } catch (error) {
        next(error);
    }
};

// Create new client
exports.createClient = async (req, res, next) => {
    try {
        const clientData = {
            ...req.body,
            createdBy: req.user._id
        };

        const client = await Client.create(clientData);

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: { client }
        });
    } catch (error) {
        if (error.code === 11000) {
            return next(new AppError('Client with this email already exists', 400));
        }
        next(error);
    }
};

// Update client
exports.updateClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Client updated successfully',
            data: { client }
        });
    } catch (error) {
        next(error);
    }
};

// Delete client
exports.deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Client deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get client statistics
exports.getClientStats = async (req, res, next) => {
    try {
        const stats = await Client.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Client.countDocuments();
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newThisMonth = await Client.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        const recentClients = await Client.find({})
            .select('fullName createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                total,
                byStatus: stats,
                newThisMonth,
                recentClients
            }
        });
    } catch (error) {
        next(error);
    }
};
