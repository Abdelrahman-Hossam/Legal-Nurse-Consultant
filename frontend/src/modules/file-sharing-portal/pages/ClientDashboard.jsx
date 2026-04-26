import { useEffect, useState } from 'react';
import clientPortalService from '../../../services/clientPortal.service';

const ClientDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await clientPortalService.getClientDashboard();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const activeCases = dashboardData?.cases || [];
    const recentDocuments = dashboardData?.documents || [];
    const stats = dashboardData?.stats || {};
    const recentActivity = dashboardData?.recentActivity || [];

    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'In Progress': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'Under Review': 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'Closed': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'On Hold': 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        };
        return colors[status] || colors['Open'];
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:flex-none">
                        <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                        <input
                            className="w-full md:w-80 pl-10 pr-4 py-2 border border-[#0891b2]/20 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none transition-all"
                            placeholder="Search cases or documents..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="relative p-2 text-slate-500 hover:text-[#0891b2] transition-colors">
                        <span className="material-icons">notifications</span>
                        {stats.unreadMessages > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#e4dace] dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Active Cases</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.activeCases || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-[#0891b2]/10 rounded-lg flex items-center justify-center">
                            <span className="material-icons text-[#0891b2]">folder_open</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Documents</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalDocuments || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <span className="material-icons text-blue-500">description</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Unread Messages</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.unreadMessages || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <span className="material-icons text-green-500">chat</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Pending Invoices</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.pendingInvoices || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                            <span className="material-icons text-amber-500">receipt_long</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area: Case Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-[#0891b2]">folder_open</span>
                                Active Cases
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeCases.length > 0 ? activeCases.map((caseItem) => (
                                <div key={caseItem._id} className="bg-[#e4dace] dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Case: {caseItem.caseNumber}</span>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#0891b2] transition-colors">{caseItem.title}</h3>
                                        </div>
                                        <span className={`${getStatusColor(caseItem.status)} text-[10px] font-bold px-2 py-1 rounded uppercase`}>
                                            {caseItem.status}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div className="text-xs text-slate-500">
                                                {caseItem.assignedTo?.firstName} {caseItem.assignedTo?.lastName}
                                            </div>
                                            <button className="bg-[#0891b2]/10 hover:bg-[#0891b2]/20 text-[#0891b2] text-xs font-bold py-1.5 px-4 rounded transition-colors">
                                                View Case
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center py-12 text-slate-500">
                                    No active cases found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Documents */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons text-[#0891b2]">description</span>
                                Recent Documents
                            </h2>
                        </div>
                        <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {recentDocuments.length > 0 ? (
                                <>
                                    <table className="w-full text-left">
                                        <thead className="bg-[#e4dace] dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-3">File Name</th>
                                                <th className="px-6 py-3">Case</th>
                                                <th className="px-6 py-3">Date</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[#f3efe5] dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                            {recentDocuments.map((doc) => (
                                                <tr key={doc._id} className="hover:bg-[#f3efe5] dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-icons text-blue-500">description</span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.fileName}</p>
                                                                <p className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{doc.case?.caseNumber}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(doc.uploadedAt)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-[#0891b2] hover:bg-[#0891b2]/10 p-1.5 rounded-lg transition-colors">
                                                            <span className="material-icons">download</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-4 bg-[#f3efe5] dark:bg-slate-800/20 text-center">
                                        <button className="text-xs font-bold text-[#0891b2] hover:underline">See All Documents</button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-slate-500">
                                    No documents available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Recent Activity */}
                <div className="space-y-6">
                    <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="material-icons text-[#0891b2]">notifications</span>
                            Recent Activity
                        </h3>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.slice(0, 5).map((activity) => (
                                <div key={activity._id} className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-[#0891b2]/10 flex items-center justify-center flex-shrink-0">
                                        <span className="material-icons text-[#0891b2] text-sm">circle</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                                        <p className="text-xs text-slate-500 mt-1">{formatDate(activity.timestamp)}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
