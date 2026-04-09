import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import caseService from '../../../services/case.service';

const CasesList = () => {
    const { pathname } = useLocation();
    const isStaff = pathname.startsWith('/staff');
    const casesBase = isStaff ? '/staff/cases' : '/cases';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        fetchCases();
    }, [statusFilter, searchTerm]);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const params = {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchTerm || undefined
            };
            const response = await caseService.getAllCases(params);
            setCases(response.data.cases || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClasses = (status) => {
        const colors = {
            active: 'bg-emerald-100 text-emerald-800',
            review: 'bg-amber-100 text-amber-800',
            intake: 'bg-blue-100 text-blue-800',
            closed: 'bg-slate-100 text-slate-800'
        };
        return colors[status] || colors.intake;
    };

    return (
        <div>
            <header className="bg-white dark:bg-slate-900 border-b -mx-8 -mt-8 mb-8 px-8 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-[#1f3b61] dark:text-white flex items-center gap-2">
                            <span className="material-icons">folder_shared</span>
                            Active Cases
                        </h1>
                    </div>
                    <Link to={`${casesBase}/new`} className="bg-[#1f3b61] hover:bg-[#1f3b61]/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <span className="material-icons text-sm">add</span>
                        New Case
                    </Link>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow min-w-[300px]">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                        <input
                            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1f3b61]/20 outline-none"
                            placeholder="Search case #, client or attorney..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#1f3b61]/20 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="review">In Review</option>
                        <option value="intake">Pending Intake</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#1f3b61]/5 border-b">
                            <th className="px-6 py-4 text-xs font-semibold text-[#1f3b61]/70 uppercase text-left">Case Number</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#1f3b61]/70 uppercase text-left">Client / Firm</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#1f3b61]/70 uppercase text-left">Case Type</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#1f3b61]/70 uppercase text-left">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#1f3b61]/70 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <span className="material-icons animate-spin text-4xl">refresh</span>
                                    <p className="mt-2 text-slate-500">Loading...</p>
                                </td>
                            </tr>
                        ) : cases.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No cases found</td>
                            </tr>
                        ) : (
                            cases.map((caseItem) => (
                                <tr key={caseItem._id} className="hover:bg-[#1f3b61]/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link to={`${casesBase}/${caseItem._id}`} className="font-mono font-medium text-[#1f3b61] hover:underline">
                                            {caseItem.caseNumber}
                                        </Link>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(caseItem.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{caseItem.lawFirm?.firmName || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{caseItem.client?.fullName || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{caseItem.caseType}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(caseItem.status)}`}>
                                            {caseItem.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === caseItem._id ? null : caseItem._id)}
                                                className="text-[#1f3b61]/40 hover:text-[#1f3b61] p-1"
                                            >
                                                <span className="material-icons">more_vert</span>
                                            </button>

                                            {openMenuId === caseItem._id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />
                                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                                        <Link
                                                            to={`${casesBase}/${caseItem._id}`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        >
                                                            <span className="material-icons text-sm">visibility</span>
                                                            View Details
                                                        </Link>
                                                        <Link
                                                            to={`${casesBase}/${caseItem._id}/edit`}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                            Edit Case
                                                        </Link>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CasesList;
