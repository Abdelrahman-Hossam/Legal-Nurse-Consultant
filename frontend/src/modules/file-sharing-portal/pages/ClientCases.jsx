import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clientPortalService from '../../../services/clientPortal.service';

const ClientCases = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, [filterStatus]);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const status = filterStatus === 'all' ? null : filterStatus;
            const data = await clientPortalService.getClientCases(status);
            setCases(data || []);
        } catch (error) {
            console.error('Failed to load cases:', error);
            setCases([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'intake': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'review': 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'active': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'pending': 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'closed': 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
            'archived': 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
        };
        return colors[status] || colors['active'];
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading cases...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Cases</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage your legal cases</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {['all', 'active', 'pending', 'closed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${filterStatus === status
                                ? 'text-[#0891b2] border-b-2 border-[#0891b2]'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Cases Grid */}
            {cases.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-icons text-6xl text-slate-300 mb-4">folder_open</span>
                    <p className="text-slate-500">No cases found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map((caseItem) => (
                        <div
                            key={caseItem._id}
                            onClick={() => navigate(`/client/case/${caseItem._id}`)}
                            className="bg-[#e4dace] dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {caseItem.caseNumber}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#0891b2] transition-colors mt-1">
                                        {caseItem.caseName}
                                    </h3>
                                </div>
                                <span className={`${getStatusColor(caseItem.status)} text-xs font-bold px-2 py-1 rounded uppercase`}>
                                    {caseItem.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="material-icons text-sm">category</span>
                                    <span className="capitalize">{caseItem.caseType?.replace('-', ' ')}</span>
                                </div>

                                {caseItem.assignedConsultant && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <span className="material-icons text-sm">person</span>
                                        <span>{caseItem.assignedConsultant.fullName}</span>
                                    </div>
                                )}

                                {caseItem.lawFirm && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <span className="material-icons text-sm">business</span>
                                        <span>{caseItem.lawFirm.firmName}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="material-icons text-sm">calendar_today</span>
                                    <span>Created: {formatDate(caseItem.createdAt)}</span>
                                </div>
                            </div>

                            {caseItem.description && (
                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {caseItem.description}
                                </p>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <button className="text-[#0891b2] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                    View Details
                                    <span className="material-icons text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientCases;
