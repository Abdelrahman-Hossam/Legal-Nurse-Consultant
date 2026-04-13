import { useEffect, useState } from 'react';
import caseService from '../services/case.service';
import deadlineService from '../services/deadline.service';
import taskService from '../services/task.service';
import PagesTopBar from '../shared/components/PagesTopBar';

const StaffDashboard = () => {
    const [userName, setUserName] = useState('User');
    const [tasks, setTasks] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [cases, setCases] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user name from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            setUserName(user.name);
        }

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [tasksData, statsData, deadlinesData, casesData] = await Promise.all([
                taskService.getMyTasks({ limit: 5 }),
                taskService.getTaskStats(),
                deadlineService.getUpcomingDeadlines(7),
                caseService.getAllCases()
            ]);
            setTasks(tasksData || []);
            setStats(statsData || {});
            setDeadlines(deadlinesData || []);
            setCases(casesData.data?.cases || casesData.cases || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateTaskStatus(taskId, newStatus);
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const handleAssignmentRequest = () => {
        setShowAssignmentModal(true);
    };

    return (
        <div className="max-w-[1600px] mx-auto">
            <PagesTopBar
                title={`Good Morning, ${userName}`}
                subtitle={`You have ${stats.pendingTasks || 0} tasks pending for this week.`}
            />

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Assigned Cases */}
                <section className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-icons text-[#1152d4]">assignment</span>
                            My Assigned Cases
                        </h2>
                        <button className="text-[#1152d4] text-sm font-semibold hover:underline">View All Cases</button>
                    </div>

                    {/* Case Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-2 text-center py-8 text-slate-500">Loading cases...</div>
                        ) : cases.length > 0 ? (
                            cases.slice(0, 3).map((caseItem) => {
                                const getStatusColor = (status) => {
                                    switch (status) {
                                        case 'active': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
                                        case 'closed': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                                        case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
                                        default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
                                    }
                                };

                                const getStatusDot = (status) => {
                                    switch (status) {
                                        case 'active': return 'bg-blue-500';
                                        case 'closed': return 'bg-emerald-500';
                                        case 'pending': return 'bg-amber-500';
                                        default: return 'bg-slate-300';
                                    }
                                };

                                return (
                                    <div key={caseItem._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${getStatusColor(caseItem.status)}`}>
                                                    {caseItem.caseNumber}
                                                </span>
                                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#1152d4] transition-colors">
                                                    {caseItem.title}
                                                </h3>
                                            </div>
                                            <span className="material-icons text-slate-300 group-hover:text-[#1152d4] transition-colors cursor-pointer">
                                                more_horiz
                                            </span>
                                        </div>
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="material-icons text-xs">gavel</span>
                                                <span>{caseItem.lawFirm?.name || 'No law firm'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="material-icons text-xs">event</span>
                                                <span>Opened: {new Date(caseItem.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${getStatusDot(caseItem.status)}`}></span>
                                                <span className="text-xs font-medium text-slate-500 capitalize">{caseItem.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-2 text-center py-8 text-slate-500">No cases assigned</div>
                        )}

                        {/* Add New Case Placeholder */}
                        {!loading && (
                            <div
                                onClick={handleAssignmentRequest}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-[#1152d4] hover:text-[#1152d4] transition-all cursor-pointer"
                            >
                                <span className="material-icons text-3xl mb-2">add_circle_outline</span>
                                <span className="text-sm font-semibold">New Assignment Request</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Column: Task List & Activity */}
                <aside className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Personal Task List Widget */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold flex items-center gap-2">
                                <span className="material-icons text-[#1152d4]">task_alt</span>
                                Task List
                            </h2>
                            <span className="bg-[#1152d4]/10 text-[#1152d4] text-[10px] font-bold px-2 py-1 rounded">
                                {(stats.pendingTasks || 0) + (stats.inProgressTasks || 0)} Remaining
                            </span>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-4 text-slate-500">Loading tasks...</div>
                            ) : tasks.length > 0 ? (
                                tasks.slice(0, 5).map((task) => (
                                    <div key={task._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'completed'}
                                            onChange={() => handleTaskStatusChange(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                                            className="mt-1 rounded border-slate-300 text-[#1152d4] focus:ring-[#1152d4]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {task.case?.caseNumber || 'No case'} • {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                            task.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-slate-500">No tasks assigned</div>
                            )}
                        </div>
                        <button className="w-full mt-6 py-2 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            + Add New Task
                        </button>
                    </section>

                    {/* Upcoming Deadlines Widget */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold flex items-center gap-2">
                                <span className="material-icons text-red-500">event_busy</span>
                                Upcoming Deadlines
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-4 text-slate-500">Loading deadlines...</div>
                            ) : deadlines.length > 0 ? (
                                deadlines.slice(0, 5).map((deadline) => (
                                    <div key={deadline._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-l-2 border-red-500">
                                        <span className="material-icons text-red-500 text-sm mt-0.5">event</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{deadline.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {deadline.case?.caseNumber || 'No case'} • {new Date(deadline.deadlineDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${deadline.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                            deadline.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {deadline.type}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-slate-500">No upcoming deadlines</div>
                            )}
                        </div>
                    </section>

                </aside>
            </div>

            {/* Assignment Request Modal */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Case Assignment</h3>
                            <button
                                onClick={() => setShowAssignmentModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            // Handle form submission
                            alert('Assignment request submitted! This feature will be connected to the backend.');
                            setShowAssignmentModal(false);
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Request Type
                                    </label>
                                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1152d4] dark:bg-slate-800">
                                        <option>New Case Assignment</option>
                                        <option>Additional Case Support</option>
                                        <option>Case Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Message to Admin
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1152d4] dark:bg-slate-800"
                                        rows="4"
                                        placeholder="Describe your request or availability..."
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#1152d4] text-white rounded-lg hover:bg-[#0d3fa0] transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;
