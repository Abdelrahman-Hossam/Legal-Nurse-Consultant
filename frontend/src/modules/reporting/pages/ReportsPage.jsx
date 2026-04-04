import { useEffect, useState } from 'react';
import reportService from '../../../services/report.service';
import CustomReportBuilderModal from '../components/CustomReportBuilderModal';

const ReportsPage = () => {
    const [templates, setTemplates] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCustomReportModal, setShowCustomReportModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [templatesRes, reportsRes] = await Promise.all([
                reportService.getTemplates(),
                reportService.getAll({ page: 1, limit: 10 })
            ]);

            setTemplates(templatesRes.data || []);
            setRecentReports(reportsRes.data?.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (templateId) => {
        try {
            // This would open a modal to select case and parameters
            console.log('Generate report with template:', templateId);
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    const handleDownload = async (reportId) => {
        try {
            const response = await reportService.download(reportId);
            window.open(response.data.fileUrl, '_blank');
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    const handleShareReport = async (reportId) => {
        try {
            const report = recentReports.find(r => r._id === reportId);
            if (!report) {
                alert('Report not found');
                return;
            }

            // In production, this would open a share modal
            const shareMessage = `Share Report\n\nReport: ${report.title}\nCase: ${report.case?.caseNumber}\n\nShare options:\n- Email to team members\n- Generate secure link\n- Export to external systems`;
            alert(shareMessage);
        } catch (error) {
            console.error('Error sharing report:', error);
            alert('Failed to share report');
        }
    };

    const handleDelete = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await reportService.delete(reportId);
                fetchData();
            } catch (error) {
                console.error('Error deleting report:', error);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'generating':
                return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            case 'failed':
                return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            default:
                return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400';
        }
    };

    const templateIcons = {
        'attorney-summary': 'summarize',
        'chronology': 'history',
        'trial-brief': 'gavel',
        'custom': 'dashboard_customize'
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header & Main CTA */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Report Generation Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Select a standardized template to begin your medical-legal analysis or create a custom structured report.
                    </p>
                </div>
                <button
                    onClick={() => setShowCustomReportModal(true)}
                    className="inline-flex items-center justify-center gap-2 bg-[#0891b2] hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-[#0891b2]/20 hover:shadow-[#0891b2]/40 group"
                >
                    <span className="material-icons transition-transform group-hover:rotate-12">dashboard_customize</span>
                    Custom Report Builder
                </button>
            </div>

            {/* Report Templates Grid */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="material-icons text-[#0891b2]">description</span>
                        Standard Report Templates
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="group bg-white dark:bg-[#0891b2]/5 border border-slate-200 dark:border-[#0891b2]/10 rounded-xl p-5 hover:border-[#0891b2]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => handleGenerateReport(template.id)}
                        >
                            <div className="w-12 h-12 rounded-lg bg-[#0891b2]/10 text-[#0891b2] flex items-center justify-center mb-4 group-hover:bg-[#0891b2] group-hover:text-white transition-colors">
                                <span className="material-icons">{templateIcons[template.id] || 'description'}</span>
                            </div>
                            <h3 className="font-bold mb-2 group-hover:text-[#0891b2] transition-colors">{template.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{template.description}</p>
                            <button className="w-full py-2 text-sm font-medium border border-[#0891b2]/20 rounded-lg hover:bg-[#0891b2]/10 transition-colors flex items-center justify-center gap-1">
                                Start New <span className="material-icons text-sm">chevron_right</span>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Recently Generated Reports */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="material-icons text-[#0891b2]">history</span>
                        Recently Generated Reports
                    </h2>
                    <button className="text-[#0891b2] text-sm font-semibold hover:underline">View All Archive</button>
                </div>
                <div className="bg-white dark:bg-[#0891b2]/5 border border-slate-200 dark:border-[#0891b2]/10 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0891b2]/10 border-b border-slate-200 dark:border-[#0891b2]/10">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Report Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Case ID</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Generated Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#0891b2]/10">
                            {recentReports.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-icons text-4xl mb-2 opacity-30">description</span>
                                        <p>No reports generated yet</p>
                                    </td>
                                </tr>
                            ) : recentReports.map((report) => (
                                <tr key={report._id} className="hover:bg-slate-50/50 dark:hover:bg-[#0891b2]/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons text-[#0891b2]">picture_as_pdf</span>
                                            <div>
                                                <div className="font-semibold text-sm">{report.title}</div>
                                                <div className="text-[10px] text-slate-500 uppercase font-medium">{report.template || report.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                        {report.case?.caseNumber || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(report.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${report.status === 'completed' ? 'bg-green-500' :
                                                    report.status === 'generating' ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}></span>
                                                {report.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`flex items-center justify-end gap-2 ${report.status !== 'completed' ? 'opacity-50 pointer-events-none' : ''
                                            }`}>
                                            <button
                                                onClick={() => handleDownload(report._id)}
                                                className="p-2 hover:bg-[#0891b2]/10 rounded-lg text-[#0891b2] transition-colors"
                                                title="Download PDF"
                                                disabled={report.status !== 'completed'}
                                            >
                                                <span className="material-icons">download</span>
                                            </button>
                                            <button
                                                onClick={() => handleShareReport(report._id)}
                                                className="p-2 hover:bg-[#0891b2]/10 rounded-lg text-slate-400 transition-colors"
                                                title="Share Report"
                                            >
                                                <span className="material-icons">share</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(report._id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <span className="material-icons">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentReports.length > 0 && (
                        <div className="bg-slate-50 dark:bg-[#0891b2]/10 px-6 py-3 border-t border-slate-200 dark:border-[#0891b2]/10 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">Showing {recentReports.length} reports</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs border border-[#0891b2]/20 rounded hover:bg-[#0891b2]/10 transition-colors">
                                    Previous
                                </button>
                                <button className="px-3 py-1 text-xs border border-[#0891b2]/20 rounded hover:bg-[#0891b2]/10 transition-colors">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>



            {/* Custom Report Builder Modal */}
            <CustomReportBuilderModal
                isOpen={showCustomReportModal}
                onClose={() => setShowCustomReportModal(false)}
                onReportGenerated={fetchData}
            />
        </div>
    );
};

export default ReportsPage;
