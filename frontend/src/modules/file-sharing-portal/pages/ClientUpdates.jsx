import { useEffect, useState } from 'react';
import clientPortalService from '../../../services/clientPortal.service';

const ClientUpdates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const data = await clientPortalService.getClientUpdates(50);
            setUpdates(data);
        } catch (error) {
            console.error('Failed to load updates:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (action) => {
        const colors = {
            document_uploaded: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            message_sent: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            case_status_updated: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
            report_generated: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
            invoice_created: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        };
        return colors[action] || colors.document_uploaded;
    };

    const getIcon = (action) => {
        const icons = {
            document_uploaded: 'description',
            message_sent: 'chat',
            case_status_updated: 'update',
            report_generated: 'summarize',
            invoice_created: 'receipt_long'
        };
        return icons[action] || 'circle';
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return time.toLocaleDateString();
    };

    const formatAction = (action) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) {
        return (
            <div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading updates...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Case Updates</h1>
                <p className="text-slate-600 dark:text-slate-400">Stay informed about all activities on your cases</p>
            </div>

            {/* Filter Tabs */}
            <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 mb-6 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'all' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    All Updates
                </button>
                <button
                    onClick={() => setFilter('documents')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'documents' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    Documents
                </button>
                <button
                    onClick={() => setFilter('messages')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'messages' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    Messages
                </button>
                <button
                    onClick={() => setFilter('status')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'status' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    Status
                </button>
            </div>

            {/* Updates Timeline */}
            <div className="space-y-4">
                {updates.length > 0 ? updates
                    .filter(update => filter === 'all' || update.action.includes(filter.slice(0, -1)))
                    .map((update) => (
                        <div key={update._id} className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorClasses(update.action)}`}>
                                    <span className="material-icons">{getIcon(update.action)}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{formatAction(update.action)}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{update.details || 'Activity recorded'}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                                            {getTimeAgo(update.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        {update.caseId && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="material-icons text-sm">folder</span>
                                                <span>{update.caseId.caseNumber}</span>
                                            </div>
                                        )}
                                        {update.userId && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="material-icons text-sm">person</span>
                                                <span>{update.userId.firstName} {update.userId.lastName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                    <div className="text-center py-12 text-slate-500">
                        No updates available
                    </div>
                )}
            </div>

            {/* Notification Settings */}
            <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Notification Preferences</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Manage how you receive updates about your cases
                        </p>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" defaultChecked className="rounded text-[#0891b2] focus:ring-[#0891b2]" />
                                <span className="text-slate-700 dark:text-slate-300">Email notifications</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" defaultChecked className="rounded text-[#0891b2] focus:ring-[#0891b2]" />
                                <span className="text-slate-700 dark:text-slate-300">SMS notifications</span>
                            </label>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-[#0891b2] text-white rounded-lg font-medium text-sm hover:bg-[#0891b2]/90 transition-colors">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientUpdates;
