import { useEffect, useState } from 'react';
import billingService from '../../../services/billing.service';
import caseService from '../../../services/case.service';
import PagesTopBar, {
    pagesListPageCanvasClass,
    pagesListPageHeaderBandClass,
    pagesListPageMaxInnerClass,
    pagesTopBarFlushOnCreamClass,
    pagesTopBarPrimaryClass,
    pagesTopBarSecondaryClass,
    pagesTopBarSplitTitle,
    pagesTopBarUiSansClass,
    pagesTopBarWatermarkWord
} from '../../../shared/components/PagesTopBar';
import ManualTimeEntryModal from '../components/ManualTimeEntryModal';

const BillingPage = () => {
    const [activeTab, setActiveTab] = useState('time');
    const [timeEntries, setTimeEntries] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        unbilledAmount: 0,
        billableHours: 0,
        averageRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [timerRunning, setTimerRunning] = useState(false);
    const [activeCase, setActiveCase] = useState('');
    const [taskCategory, setTaskCategory] = useState('Medical Record Review');
    const [runningTime, setRunningTime] = useState('00:00:00');
    const [cases, setCases] = useState([]);
    const [showManualEntryModal, setShowManualEntryModal] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    useEffect(() => {
        fetchData();
        fetchCases();
    }, [activeTab]);

    useEffect(() => {
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [timerInterval]);

    const fetchCases = async () => {
        try {
            const response = await caseService.getAllCases();
            const casesData = response.data?.cases || response.cases || [];
            setCases(casesData);
            if (casesData.length > 0 && !activeCase) {
                setActiveCase(casesData[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch cases:', error);
            setCases([]);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [entriesData, invoiceData, statsData] = await Promise.all([
                billingService.getAllTimeEntries({ limit: 50 }),
                billingService.getAllInvoices({ limit: 20 }),
                billingService.getBillingStats()
            ]);
            setTimeEntries(entriesData.entries || []);
            setInvoices(invoiceData.invoices || []);
            setStats({
                unbilledAmount: statsData.unbilledAmount || 0,
                billableHours: statsData.billableHours || 0,
                averageRate: statsData.averageRate || 0
            });
        } catch (error) {
            console.error('Failed to load billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTimer = async () => {
        if (!activeCase) {
            alert('Please select a case first');
            return;
        }

        try {
            setTimerRunning(true);
            const startTime = Date.now();

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                setRunningTime(
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                );
            }, 1000);

            setTimerInterval(interval);
        } catch (error) {
            console.error('Failed to start timer:', error);
            setTimerRunning(false);
        }
    };

    const handleStopTimer = async () => {
        try {
            if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
            }

            const timeParts = runningTime.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const seconds = parseInt(timeParts[2]);

            // Convert to decimal hours
            const totalHours = hours + (minutes / 60) + (seconds / 3600);
            const rate = 150;

            await billingService.createTimeEntry({
                case: activeCase,
                description: taskCategory,
                hours: Math.floor(totalHours),
                minutes: Math.round((totalHours % 1) * 60),
                billableRate: rate,
                totalAmount: totalHours * rate,
                isBillable: true,
                date: new Date().toISOString(),
                activityType: 'other'
            });

            setTimerRunning(false);
            setRunningTime('00:00:00');
            alert('Time entry saved successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to stop timer:', error);
            console.error('Error details:', error.response?.data);

            let errorMessage = 'Failed to save time entry: ';
            if (error.response?.data?.errors) {
                errorMessage += error.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ');
            } else {
                errorMessage += error.response?.data?.message || error.message;
            }

            alert(errorMessage);
        }
    };

    const handleExportCSV = async () => {
        try {
            const data = await billingService.exportTimeEntries();
            const blob = new Blob([data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export CSV:', error);
            alert('Failed to export data');
        }
    };

    const handleToggleBillable = async (entryId, currentStatus) => {
        try {
            await billingService.updateTimeEntry(entryId, { isBillable: !currentStatus });
            fetchData();
        } catch (error) {
            console.error('Failed to update billable status:', error);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm('Are you sure you want to delete this time entry?')) return;

        try {
            await billingService.deleteTimeEntry(entryId);
            alert('Time entry deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert('Failed to delete time entry');
        }
    };

    // Mock data for UI display
    const mockTimeEntries = [];

    const mockInvoices = [];

    const displayTimeEntries = timeEntries.length > 0 ? timeEntries : mockTimeEntries;
    const displayInvoices = invoices.length > 0 ? invoices : mockInvoices;

    return (
        <>
            <div className={pagesListPageCanvasClass}>
                <div className={pagesListPageMaxInnerClass}>
                    <div className="relative z-[1]">
                        <div className={pagesListPageHeaderBandClass}>
                            <PagesTopBar
                                eyebrow="Billing & invoicing"
                                title={pagesTopBarSplitTitle('Billing', 'Invoices')}
                                titleClassName="!m-0 !p-0"
                                subtitle="Track billable hours and manage client invoices securely."
                                className={pagesTopBarFlushOnCreamClass}
                                watermark={pagesTopBarWatermarkWord('Billing')}
                            >
                                <div className={`flex flex-wrap items-center gap-3 ${pagesTopBarUiSansClass}`}>
                                    <button type="button" onClick={handleExportCSV} className={pagesTopBarSecondaryClass}>
                                        <span className="material-icons text-sm">download</span>
                                        Export CSV
                                    </button>
                                    <button type="button" onClick={() => setShowManualEntryModal(true)} className={pagesTopBarPrimaryClass}>
                                        <span className="material-icons text-sm">add</span>
                                        Manual Entry
                                    </button>
                                </div>
                            </PagesTopBar>
                        </div>

            {/* Active Timer Widget */}
            <div className="mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Active Project / Case
                            </label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-[#1f3b61] focus:border-[#1f3b61]"
                                    value={activeCase}
                                    onChange={(e) => setActiveCase(e.target.value)}
                                >
                                    <option value="">Select a case</option>
                                    {cases.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.caseNumber} - {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Task Category
                            </label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-[#1f3b61] focus:border-[#1f3b61]"
                                value={taskCategory}
                                onChange={(e) => setTaskCategory(e.target.value)}
                            >
                                <option>Medical Record Review</option>
                                <option>Deposition Preparation</option>
                                <option>Expert Testimony</option>
                                <option>Correspondence</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex flex-col items-center justify-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Running Time</span>
                            <div className="text-3xl font-mono font-bold text-[#1f3b61] dark:text-white tabular-nums">
                                {runningTime}
                            </div>
                        </div>
                        <div className="md:col-span-3 flex items-center gap-3">
                            {timerRunning ? (
                                <button
                                    onClick={handleStopTimer}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <span className="material-icons">stop</span> Stop Timer
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartTimer}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <span className="material-icons">play_arrow</span> Start Timer
                                </button>
                            )}
                            <button className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition">
                                <span className="material-icons">more_vert</span>
                            </button>
                        </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Entries Table */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-white">Recent Time Entries</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        search
                                    </span>
                                    <input
                                        className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-[#1f3b61] focus:border-[#1f3b61]"
                                        placeholder="Search entries..."
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                                        <th className="px-6 py-4">Date & Consultant</th>
                                        <th className="px-6 py-4">Matter / Description</th>
                                        <th className="px-6 py-4 text-center">Duration</th>
                                        <th className="px-6 py-4 text-center">Billable</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b61]"></div>
                                                    <span className="ml-3">Loading entries...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : displayTimeEntries.length > 0 ? (
                                        displayTimeEntries.map((entry) => (
                                            <tr key={entry._id || entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium">{new Date(entry.date || entry.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs text-slate-400">{entry.user?.name || entry.consultant || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold truncate max-w-[200px]">{entry.case?.caseNumber || entry.matter || 'N/A'}</div>
                                                    <div className="text-xs text-slate-500">{entry.description}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-mono font-medium">{entry.hours || entry.duration}h</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <div
                                                            onClick={() => handleToggleBillable(entry._id, entry.isBillable || entry.billable)}
                                                            className={`w-10 h-5 rounded-full relative cursor-pointer ${(entry.isBillable || entry.billable) ? 'bg-[#1f3b61]/20' : 'bg-slate-200 dark:bg-slate-600'
                                                                }`}
                                                        >
                                                            <div
                                                                className={`absolute top-0.5 w-4 h-4 rounded-full shadow-sm ${(entry.isBillable || entry.billable)
                                                                    ? 'right-0.5 bg-[#1f3b61]'
                                                                    : 'left-0.5 bg-white'
                                                                    }`}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteEntry(entry._id)}
                                                        className="text-slate-400 hover:text-red-500 transition"
                                                    >
                                                        <span className="material-icons text-xl">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                No time entries found. Start the timer or add a manual entry.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                            <button className="text-sm font-semibold text-[#1f3b61] dark:text-slate-300 hover:underline">
                                Load More Entries
                            </button>
                        </div>
                    </div>
                </div>

                {/* Financial Summary & Invoices */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-[#1f3b61] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-white/70 text-sm font-medium mb-1 uppercase tracking-wider">Unbilled Amount</h4>
                            <div className="text-3xl font-bold mb-4">${stats.unbilledAmount?.toFixed(2) || '0.00'}</div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-xs text-white/60 mb-1">Billable Hours</div>
                                    <div className="text-lg font-semibold">{stats.billableHours?.toFixed(1) || '0.0'}h</div>
                                </div>
                                <div className="w-px h-8 bg-white/20"></div>
                                <div>
                                    <div className="text-xs text-white/60 mb-1">Current Rate (Avg)</div>
                                    <div className="text-lg font-semibold">${stats.averageRate?.toFixed(0) || '0'}/hr</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <span className="material-icons text-8xl">account_balance_wallet</span>
                        </div>
                    </div>

                    {/* Invoice Management */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-white">Recent Invoices</h3>
                            <button className="text-[#1f3b61] dark:text-slate-300">
                                <span className="material-icons">add_circle_outline</span>
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {displayInvoices.length > 0 ? (
                                displayInvoices.map((invoice) => {
                                    const getStatusColor = (status) => {
                                        const colors = {
                                            paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                                            overdue: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                                            draft: 'bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300',
                                            pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        };
                                        return colors[status] || colors.draft;
                                    };

                                    return (
                                        <div key={invoice._id || invoice.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-sm font-bold">{invoice.invoiceNumber || invoice.id}</div>
                                                    <div className="text-xs text-slate-500">{invoice.client?.name || invoice.client}</div>
                                                </div>
                                                <div className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="text-xs italic text-slate-400">
                                                    {invoice.dueDate ? `Due: ${new Date(invoice.dueDate).toLocaleDateString()}` : 'No due date'}
                                                </div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-white">
                                                    ${invoice.totalAmount?.toFixed(2) || invoice.amount}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    No invoices found
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-center">
                            <a
                                className="text-xs font-bold text-[#1f3b61] dark:text-slate-400 uppercase tracking-wide hover:underline"
                                href="#"
                            >
                                View All Invoices
                            </a>
                        </div>
                    </div>

                    {/* HIPAA Notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 flex gap-3">
                        <span className="material-icons text-amber-600 dark:text-amber-400">gpp_good</span>
                        <div>
                            <h5 className="text-sm font-bold text-amber-800 dark:text-amber-200">HIPAA Protected Environment</h5>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                                Ensure all PHI is entered only in designated secure fields. Activity descriptions are encrypted at rest.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
                    </div>
                </div>
            </div>

            {/* Floating Action for Mobile */}
            <div className="lg:hidden fixed bottom-6 right-6">
                <button className="w-14 h-14 bg-[#1f3b61] text-white rounded-full shadow-xl flex items-center justify-center">
                    <span className="material-icons">timer</span>
                </button>
            </div>

            {/* Manual Time Entry Modal */}
            <ManualTimeEntryModal
                isOpen={showManualEntryModal}
                onClose={() => setShowManualEntryModal(false)}
                onEntryCreated={fetchData}
            />
        </>
    );
};

export default BillingPage;
