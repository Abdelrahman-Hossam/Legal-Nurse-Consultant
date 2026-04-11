import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import taskService from '../../../services/task.service';
import PagesTopBar, { pagesTopBarPrimaryClass } from '../../../shared/components/PagesTopBar';
import CreateTaskModal from '../components/CreateTaskModal';

const TasksPage = () => {
    const location = useLocation();
    const [filter, setFilter] = useState('all');
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Check if we're on the staff route
    const isStaffRoute = location.pathname.startsWith('/staff');

    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, [filter]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = {};

            if (filter === 'overdue') {
                params.status = 'pending,in-progress';
            }

            // Fetch all tasks instead of just my tasks so we can see all created tasks
            const response = await taskService.getAllTasks(params);
            console.log('Fetched tasks:', response);
            // Backend returns { tasks, totalPages, currentPage, total }
            setTasks(response.tasks || []);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await taskService.getTaskStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateTaskStatus(taskId, newStatus);
            alert('Task status updated successfully');
            fetchTasks();
            fetchStats();
        } catch (error) {
            alert('Failed to update task status: ' + error.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await taskService.deleteTask(taskId);
            alert('Task deleted successfully');
            fetchTasks();
            fetchStats();
        } catch (error) {
            alert('Failed to delete task: ' + error.message);
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    const formatDueDate = (dueDate) => {
        const date = new Date(dueDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else if (date < today) {
            const daysOverdue = Math.ceil((today - date) / (1000 * 60 * 60 * 24));
            return `Overdue (${daysOverdue}d)`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400',
            high: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400',
            medium: 'bg-blue-100 dark:bg-[#0891b2]/10 text-[#0891b2]',
            low: 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        };
        return colors[priority] || colors.low;
    };

    const handleCreateTask = async (taskData) => {
        try {
            await taskService.createTask(taskData);
            alert('Task created successfully');
            fetchTasks();
            fetchStats();
        } catch (error) {
            throw error;
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return task.title.toLowerCase().includes(query) ||
                task.description?.toLowerCase().includes(query) ||
                task.case?.caseNumber?.toLowerCase().includes(query);
        }
        if (filter === 'today') {
            const today = new Date().toDateString();
            return new Date(task.dueDate).toDateString() === today;
        }
        if (filter === 'overdue') {
            return isOverdue(task.dueDate) && task.status !== 'completed';
        }
        return true;
    });

    return (
        <div className="max-w-[1600px] mx-auto">
            <PagesTopBar
                title="Task Manager"
                subtitle="Track deadlines, priorities, and work across cases."
            />

            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Active Tasks</p>
                    <p className="text-2xl font-bold">{(stats.pendingTasks || 0) + (stats.inProgressTasks || 0)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl border-l-4 border-l-red-500">
                    <p className="text-xs text-red-500 uppercase font-bold tracking-wider mb-1">Overdue</p>
                    <p className="text-2xl font-bold">{stats.overdueTasks || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Completed</p>
                    <p className="text-2xl font-bold text-[#0891b2]">{stats.completedTasks || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.totalTasks || 0}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className={pagesTopBarPrimaryClass}
                    >
                        <span className="material-icons text-sm">add</span>
                        New Task
                    </button>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'today' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setFilter('overdue')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium ${filter === 'overdue' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Overdue
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-grow lg:w-72">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-[#0891b2]/50 focus:border-[#0891b2] outline-none transition-all"
                            placeholder="Search tasks or case IDs..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-icons">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Task Table */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                                <th className="py-4 px-6 w-12">
                                    <input
                                        className="rounded border-slate-300 dark:border-slate-700 text-[#0891b2] focus:ring-[#0891b2] bg-transparent"
                                        type="checkbox"
                                    />
                                </th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Task Details</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Case Reference</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                {!isStaffRoute && (
                                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={isStaffRoute ? "6" : "7"} className="py-12 text-center text-slate-500">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                                            <span className="ml-3">Loading tasks...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => (
                                    <tr
                                        key={task._id}
                                        className={`group hover:bg-slate-50 dark:hover:bg-[#0891b2]/5 transition-colors cursor-pointer ${task.status === 'in-progress' ? 'bg-[#0891b2]/5 hover:bg-[#0891b2]/10 border-l-4 border-l-[#0891b2]' : ''}`}
                                    >
                                        <td className="py-5 px-6">
                                            <input
                                                className="rounded border-slate-300 dark:border-slate-700 text-[#0891b2] focus:ring-[#0891b2] bg-transparent"
                                                type="checkbox"
                                                onChange={() => handleStatusChange(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                                                checked={task.status === 'completed'}
                                            />
                                        </td>
                                        <td className="py-5 px-4">
                                            <p className={`text-sm font-semibold group-hover:text-[#0891b2] transition-colors ${task.status === 'in-progress' ? 'text-[#0891b2]' : ''}`}>
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">{task.description || 'No description'}</p>
                                        </td>
                                        <td className="py-5 px-4">
                                            <a className="inline-flex items-center gap-1.5 text-[#0891b2] text-xs font-medium hover:underline" href={`/cases/${task.case?._id}`}>
                                                <span className="material-icons text-xs">folder_open</span>
                                                {task.case?.title || task.case?.caseNumber || 'N/A'}
                                            </a>
                                        </td>
                                        <td className="py-5 px-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-tight ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-icons text-sm ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500' : task.status === 'in-progress' ? 'text-[#0891b2]' : 'text-slate-400'}`}>
                                                    {isOverdue(task.dueDate) && task.status !== 'completed' ? 'event_busy' : 'event'}
                                                </span>
                                                <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-500 font-medium' : task.status === 'in-progress' ? 'font-medium' : ''}`}>
                                                    {formatDueDate(task.dueDate)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                    task.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-right">
                                            {!isStaffRoute && (
                                                <button
                                                    onClick={() => handleDeleteTask(task._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500"
                                                    title="Delete task"
                                                >
                                                    <span className="material-icons text-lg">delete</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isStaffRoute ? "6" : "7"} className="py-12 text-center text-slate-500">
                                        No tasks found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Showing {filteredTasks.length} of {tasks.length} tasks</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30" disabled>
                            <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button className="p-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-white dark:hover:bg-slate-800">
                            <span className="material-icons text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={handleCreateTask}
            />
        </div>
    );
};

export default TasksPage;
