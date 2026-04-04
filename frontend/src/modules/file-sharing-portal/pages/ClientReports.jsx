import { useEffect, useState } from 'react';
import clientPortalService from '../../../services/clientPortal.service';

const ClientReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await clientPortalService.getClientReports();
            setReports(data);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (report) => {
        try {
            alert(`Report Details:\n\nTitle: ${report.title}\nType: ${report.type}\nCase: ${report.case?.caseNumber}\nGenerated: ${formatDate(report.createdAt)}\nStatus: ${report.status || 'Ready'}`);
        } catch (error) {
            console.error('Error viewing report:', error);
            alert('Failed to view report details');
        }
    };

    const handleDownload = async (reportId) => {
        try {
            const report = reports.find(r => r._id === reportId);
            if (!report) {
                alert('Report not found');
                return;
            }

            // Create a simple text representation
            const reportText = `
${report.title}
${'='.repeat(report.title.length)}

Type: ${report.type}
Case: ${report.case?.caseNumber}
Generated: ${formatDate(report.createdAt)}
Status: ${report.status || 'Ready'}

This is a placeholder for the actual report content.
In production, this would download the full PDF report.
            `;

            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${report.title.replace(/\s+/g, '-')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    const handleShareReport = async (reportId) => {
        try {
            const report = reports.find(r => r._id === reportId);
            if (!report) {
                alert('Report not found');
                return;
            }

            // In production, this would open a share modal or generate a share link
            alert(`Share Report\n\nReport: ${report.title}\n\nThis would allow you to:\n- Email the report\n- Generate a secure share link\n- Share with team members`);
        } catch (error) {
            console.error('Error sharing report:', error);
            alert('Failed to share report');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getReportIcon = (type) => {
        const icons = {
            'Medical Chronology': 'timeline',
            'Case Summary': 'summarize',
            'Expert Analysis': 'science',
            'Liability Assessment': 'gavel',
            'Damages Report': 'assessment'
        };
        return icons[type] || 'description';
    };

    if (loading) {
        return (
            <div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reports & Documents</h1>
                <p className="text-slate-600 dark:text-slate-400">Access all generated reports for your cases</p>
            </div>

            {/* Reports Grid */}
            {reports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map((report) => (
                        <div key={report._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-[#0891b2]/10 rounded-lg flex items-center justify-center">
                                    <span className="material-icons text-[#0891b2]">{getReportIcon(report.type)}</span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                                    {report.status || 'Ready'}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-[#0891b2] transition-colors">
                                {report.title}
                            </h3>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {report.type}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">folder</span>
                                    <span>{report.case?.caseNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">calendar_today</span>
                                    <span>Generated: {formatDate(report.createdAt)}</span>
                                </div>
                                {report.generatedBy && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="material-icons text-sm">person</span>
                                        <span>{report.generatedBy.firstName} {report.generatedBy.lastName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(report._id)}
                                    className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg font-medium text-sm hover:bg-[#0891b2]/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-sm">download</span>
                                    Download
                                </button>
                                <button
                                    onClick={() => handleViewReport(report)}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    title="View Report"
                                >
                                    <span className="material-icons text-sm">visibility</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons text-slate-400 text-3xl">description</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reports Available</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Reports will appear here once they are generated for your cases
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClientReports;
