import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caseService from '../../../services/case.service';
import timelineService from '../../../services/timeline.service';
import PagesTopBar from '../../../shared/components/PagesTopBar';

const TimelineWork = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Days Remaining');
    const [workItems, setWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChronologyModal, setShowNewChronologyModal] = useState(false);
    const [cases, setCases] = useState([]);
    const [newChronology, setNewChronology] = useState({
        case: '',
        title: '',
        description: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkQueue();
    }, []);

    const fetchWorkQueue = async () => {
        try {
            setLoading(true);
            const response = await timelineService.getWorkQueue();
            // Extract timelines from nested response structure
            const timelines = response.data?.timelines || response.timelines || [];
            setWorkItems(timelines);
        } catch (error) {
            console.error('Failed to load work queue:', error);
            setWorkItems([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            const response = await caseService.getAllCases();
            setCases(response.data?.cases || response.cases || []);
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setCases([]);
        }
    };

    const handleCreateChronology = async (e) => {
        e.preventDefault();
        if (!newChronology.case) {
            alert('Please select a case');
            return;
        }

        try {
            await timelineService.createTimeline({
                case: newChronology.case,
                title: newChronology.title || 'Medical Chronology',
                description: newChronology.description,
                events: []
            });

            alert('Chronology created successfully');
            setShowNewChronologyModal(false);
            setNewChronology({ case: '', title: '', description: '' });
            fetchWorkQueue();
        } catch (error) {
            alert('Failed to create chronology: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOpenModal = () => {
        setShowNewChronologyModal(true);
        fetchCases();
    };

    const handleOpenTimeline = (caseId) => {
        if (!caseId) {
            alert('Case ID is missing');
            return;
        }
        navigate(`/staff/timeline/${caseId}`);
    };

    const stats = [
        { label: 'Active Chronologies', value: (workItems?.length || 0).toString(), badge: '+2 this week', badgeColor: 'emerald' },
        { label: 'Average Progress', value: '64%', progress: 64 },
        { label: 'Next Deadline', value: '2 Days', valueColor: 'amber', badge: 'Case #8921' },
        { label: 'Pending Review', value: '4', icon: 'rate_review' }
    ];

    const getStatusColor = (color) => {
        const colors = {
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
        return colors[color] || colors.slate;
    };

    const getDueColor = (color) => {
        const colors = {
            amber: 'text-amber-500',
            rose: 'text-rose-500',
            slate: 'text-slate-900 dark:text-white'
        };
        return colors[color] || colors.slate;
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="shrink-0">
                    <PagesTopBar
                        title="Timeline Work Queue"
                        subtitle="Chronologies and deadlines across cases"
                        marginBottom={false}
                        className="mb-6"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                <input
                                    className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 max-w-full transition-all"
                                    placeholder="Search Case ID or Initials..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="material-icons text-lg">notifications</span>
                                <div className="w-2 h-2 bg-primary rounded-full -ml-3 -mt-2"></div>
                            </div>
                        </div>
                    </PagesTopBar>
                </div>

                {/* Stats & Controls */}
                <section className="p-8 pb-4">
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="bg-[#e4dace] dark:bg-neutral-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                                <div className="flex items-end justify-between mt-1">
                                    <span className={`text-2xl font-bold ${stat.valueColor === 'amber' ? 'text-amber-500' : ''}`}>{stat.value}</span>
                                    {stat.badge && (
                                        <span className={`${stat.badgeColor === 'emerald' ? 'text-emerald-500' : 'text-slate-400'} text-xs font-medium`}>
                                            {stat.badge}
                                        </span>
                                    )}
                                    {stat.progress !== undefined && (
                                        <div className="w-16 bg-slate-200 dark:bg-border-dark h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full" style={{ width: `${stat.progress}%` }}></div>
                                        </div>
                                    )}
                                    {stat.icon && (
                                        <span className="material-icons text-slate-500">{stat.icon}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenModal}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <span className="material-icons text-sm">add</span>
                                New Chronology
                            </button>
                            <button className="px-4 py-2 bg-slate-100 dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-border-dark transition-colors flex items-center gap-2">
                                <span className="material-icons text-sm">filter_list</span>
                                Filters
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 uppercase font-medium">Sort by:</span>
                            <select
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 pr-6 text-primary cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option>Days Remaining</option>
                                <option>Completion %</option>
                                <option>Date Assigned</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Work List */}
                <section className="flex-1 overflow-y-auto px-8 pb-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-slate-500">Loading work queue...</p>
                            </div>
                        </div>
                    ) : workItems.length > 0 ? (
                        <div className="flex-1 space-y-3">
                            {workItems.map((item, idx) => {
                                const caseNumber = item.case?.caseNumber || 'N/A';
                                const patientName = item.case?.client?.fullName || item.case?.client?.firstName + ' ' + item.case?.client?.lastName || 'N/A';
                                const firmName = item.case?.lawFirm?.name || 'N/A';
                                const caseType = item.case?.caseType || 'medical-malpractice';
                                const eventCount = item.events?.length || 0;
                                const progress = eventCount > 0 ? Math.min(100, eventCount * 10) : 0;
                                const statusColor = item.status === 'completed' ? 'emerald' : item.status === 'review' ? 'amber' : item.status === 'in-progress' ? 'blue' : 'slate';

                                return (
                                    <div
                                        key={item._id || idx}
                                        className="group bg-[#e4dace] dark:bg-neutral-dark border border-slate-200 dark:border-border-dark p-4 rounded-xl hover:border-primary/50 transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                    <span className="material-icons">timeline</span>
                                                </div>
                                                <div className="min-w-[200px]">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">Case ID: {caseNumber}</h3>
                                                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                                        <span className="font-semibold text-slate-500">Patient: {patientName}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{caseType.replace('-', ' ')}</span>
                                                    </p>
                                                </div>
                                                <div className="hidden xl:block min-w-[150px]">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Attorney Firm</p>
                                                    <p className="text-sm font-medium">{firmName}</p>
                                                </div>
                                                <div className="flex-1 max-w-xs mx-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chronology Progress</span>
                                                        <span className="text-xs font-bold text-primary">{progress}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-border-dark rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full rounded-full"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <div className="px-6 text-center">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Events</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{eventCount}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(statusColor)}`}>
                                                    {item.status}
                                                </span>
                                                <button onClick={() => handleOpenTimeline(item.case?._id)} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-transform active:scale-95">
                                                    <span className="material-icons text-sm">construction</span>
                                                    Open Timeline Builder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            No timeline work items in queue
                        </div>
                    )}
                </section>

                {/* Footer / Workspace Info */}
                <footer className="h-10 bg-white/5 border-t border-slate-200 dark:border-border-dark flex items-center justify-between px-8">
                    <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                        <span>© 2024 LegalNurse OS</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                        <span>Active Workspace: General Medical Queue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-slate-400 font-medium">Secure Server Connection: Active</span>
                    </div>
                </footer>
            </main>

            {/* New Chronology Modal */}
            {showNewChronologyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-icons text-[#0891b2]">add_circle</span>
                                New Chronology
                            </h2>
                            <button
                                onClick={() => setShowNewChronologyModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateChronology} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Select Case <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newChronology.case}
                                    onChange={(e) => setNewChronology({ ...newChronology, case: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none"
                                >
                                    <option value="">Select a case</option>
                                    {cases.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.caseNumber} - {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                                <input
                                    type="text"
                                    value={newChronology.title}
                                    onChange={(e) => setNewChronology({ ...newChronology, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none"
                                    placeholder="Medical Chronology"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                <textarea
                                    value={newChronology.description}
                                    onChange={(e) => setNewChronology({ ...newChronology, description: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none resize-none"
                                    placeholder="Add notes about this chronology..."
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewChronologyModal(false)}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-icons text-sm">add</span>
                                    Create Chronology
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineWork;
