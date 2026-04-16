const Task = require('../../../models/Task.model');
const Case = require('../../../models/Case.model');
const User = require('../../../models/User.model');
const notificationService = require('../../notifications/services/notification.service');

// Get all tasks with filters
exports.getAllTasks = async (req, res, next) => {
    try {
        const { status, priority, assignedTo, case: caseId, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (caseId) filter.case = caseId;

        const tasks = await Task.find(filter)
            .populate('case', 'title caseNumber')
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .sort({ dueDate: 1, priority: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Task.countDocuments(filter);

        res.json({
            tasks,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        next(error);
    }
};

// Get my tasks (assigned to current user)
exports.getMyTasks = async (req, res, next) => {
    try {
        const { status, priority } = req.query;

        const filter = { assignedTo: req.user._id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter)
            .populate('case', 'title caseNumber')
            .populate('assignedBy', 'name email')
            .sort({ dueDate: 1, priority: -1 });

        res.json(tasks);
    } catch (error) {
        next(error);
    }
};

// Get tasks by case
exports.getTasksByCase = async (req, res, next) => {
    try {
        const tasks = await Task.find({ case: req.params.caseId })
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .sort({ dueDate: 1 });

        res.json(tasks);
    } catch (error) {
        next(error);
    }
};

// Get task by ID
exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('case', 'title caseNumber')
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .populate('comments.user', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Create task
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, case: caseId, assignedTo, priority, status, type, dueDate, tags, isRecurring, recurringPattern } = req.body;

        // Verify case exists
        const caseExists = await Case.findById(caseId);
        if (!caseExists) {
            return res.status(404).json({ message: 'Case not found' });
        }

        // Verify assigned user exists
        const userExists = await User.findById(assignedTo);
        if (!userExists) {
            return res.status(404).json({ message: 'Assigned user not found' });
        }

        const task = new Task({
            title,
            description,
            case: caseId,
            assignedTo,
            assignedBy: req.user._id,
            priority,
            status,
            type,
            dueDate,
            tags,
            isRecurring,
            recurringPattern
        });

        await task.save();
        await task.populate('case', 'title caseNumber');
        await task.populate('assignedTo', 'name email');
        await task.populate('assignedBy', 'name email');

        if (assignedTo.toString() !== req.user._id.toString()) {
            const assignee = await User.findById(assignedTo).select('role').lean();
            const taskPath = assignee?.role === 'consultant' ? '/staff/tasks' : '/tasks';
            await notificationService.createNotification({
                user: assignedTo,
                title: 'New task assigned',
                message: `${title} — case ${caseExists.caseNumber || caseExists.caseName || ''}`,
                type: 'task',
                link: taskPath,
                priority: 'medium',
                metadata: { taskId: task._id.toString(), caseId: caseId }
            });
        }

        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
};

// Update task
exports.updateTask = async (req, res, next) => {
    try {
        const { title, description, assignedTo, priority, status, type, dueDate, tags, isRecurring, recurringPattern } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Update fields
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo) task.assignedTo = assignedTo;
        if (priority) task.priority = priority;
        if (status) {
            task.status = status;
            if (status === 'completed' && !task.completedAt) {
                task.completedAt = new Date();
            }
        }
        if (type) task.type = type;
        if (dueDate) task.dueDate = dueDate;
        if (tags) task.tags = tags;
        if (isRecurring !== undefined) task.isRecurring = isRecurring;
        if (recurringPattern) task.recurringPattern = recurringPattern;

        await task.save();
        await task.populate('case', 'title caseNumber');
        await task.populate('assignedTo', 'name email');
        await task.populate('assignedBy', 'name email');

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Update task status
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = status;
        if (status === 'completed' && !task.completedAt) {
            task.completedAt = new Date();
        }

        await task.save();
        await task.populate('case', 'title caseNumber');
        await task.populate('assignedTo', 'name email');

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Delete task
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Assign task
exports.assignTask = async (req, res, next) => {
    try {
        const { assignedTo } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify user exists
        const userExists = await User.findById(assignedTo);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        task.assignedTo = assignedTo;
        await task.save();
        await task.populate('assignedTo', 'name email');

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Add comment to task
exports.addComment = async (req, res, next) => {
    try {
        const { comment } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.comments.push({
            user: req.user._id,
            comment,
            createdAt: new Date()
        });

        await task.save();
        await task.populate('comments.user', 'name email');

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Get task statistics
exports.getTaskStats = async (req, res, next) => {
    try {
        const userId = req.query.userId;

        // If userId is provided, filter by that user, otherwise show all tasks
        const filter = userId ? { assignedTo: userId } : {};

        const totalTasks = await Task.countDocuments(filter);
        const completedTasks = await Task.countDocuments({ ...filter, status: 'completed' });
        const pendingTasks = await Task.countDocuments({ ...filter, status: 'pending' });
        const inProgressTasks = await Task.countDocuments({ ...filter, status: 'in-progress' });
        const overdueTasks = await Task.countDocuments({
            ...filter,
            status: { $nin: ['completed', 'cancelled'] },
            dueDate: { $lt: new Date() }
        });

        const tasksByPriority = await Task.aggregate([
            { $match: filter },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const tasksByType = await Task.aggregate([
            { $match: filter },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            overdueTasks,
            tasksByPriority,
            tasksByType
        });
    } catch (error) {
        next(error);
    }
};
