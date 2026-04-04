import { useEffect, useState } from 'react';
import clientPortalService from '../../../services/clientPortal.service';

const ClientBilling = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await clientPortalService.getClientInvoices();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Paid': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            'Pending': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
            'Overdue': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            'Draft': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
        };
        return colors[status] || colors['Pending'];
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'all') return true;
        return inv.status.toLowerCase() === filter;
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const handleViewInvoice = async (invoice) => {
        try {
            alert(`Invoice Details:\n\nInvoice: ${invoice.invoiceNumber}\nCase: ${invoice.case?.caseNumber}\nAmount: ${formatCurrency(invoice.amount)}\nStatus: ${invoice.status}\nDue Date: ${formatDate(invoice.dueDate)}`);
        } catch (error) {
            console.error('Error viewing invoice:', error);
            alert('Failed to view invoice details');
        }
    };

    const handleDownloadInvoice = async (invoice) => {
        try {
            const invoiceText = `
INVOICE
-----------------
Invoice Number: ${invoice.invoiceNumber}
Case: ${invoice.case?.caseNumber}
Date: ${formatDate(invoice.createdAt)}
Due Date: ${formatDate(invoice.dueDate)}
Amount: ${formatCurrency(invoice.amount)}
Status: ${invoice.status}
            `;

            const blob = new Blob([invoiceText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice.invoiceNumber}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice');
        }
    };

    const handlePayNow = async (invoice) => {
        try {
            alert(`Payment Gateway\n\nInvoice: ${invoice.invoiceNumber}\nAmount Due: ${formatCurrency(invoice.amount)}\n\nThis would redirect to a secure payment processor.`);
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Failed to process payment');
        }
    };

    if (loading) {
        return (
            <div>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading billing information...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Billing & Invoices</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage your invoices and payment history</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Total Billed</span>
                        <span className="material-icons text-slate-400">receipt_long</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Paid</span>
                        <span className="material-icons text-green-500">check_circle</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">Pending</span>
                        <span className="material-icons text-amber-500">schedule</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 mb-6 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'all' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    All Invoices
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'pending' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'paid' ? 'bg-[#0891b2] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    Paid
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {filteredInvoices.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Case</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{invoice.case?.caseNumber}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.createdAt)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.dueDate)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900 dark:text-white">{formatCurrency(invoice.amount)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleViewInvoice(invoice)}
                                                className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                title="View Invoice"
                                            >
                                                <span className="material-icons text-sm">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => handleDownloadInvoice(invoice)}
                                                className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                title="Download Invoice"
                                            >
                                                <span className="material-icons text-sm">download</span>
                                            </button>
                                            {invoice.status === 'Pending' && (
                                                <button
                                                    onClick={() => handlePayNow(invoice)}
                                                    className="px-3 py-1 bg-[#0891b2] text-white rounded text-xs font-bold hover:bg-[#0891b2]/90 transition-colors"
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        No invoices found
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientBilling;
