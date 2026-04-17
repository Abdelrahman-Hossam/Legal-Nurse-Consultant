import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clientService from '../../../services/client.service';
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

const ClientsList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [referralFilter, setReferralFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('active');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0 });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingClient, setViewingClient] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        status: 'active'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchClients();
        fetchStats();
    }, [statusFilter, searchTerm, pagination.page]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const params = {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchTerm || undefined,
                page: pagination.page,
                limit: 10
            };
            const response = await clientService.getAllClients(params);
            setClients(response.data.clients || []);
            setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await clientService.getClientStats();
            setStats(response.data || { total: 0 });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getColorClass = (index) => {
        const colors = [
            'bg-[#0891b2]/20 text-[#0891b2]',
            'bg-amber-500/20 text-amber-600',
            'bg-indigo-500/20 text-indigo-600',
            'bg-emerald-500/20 text-emerald-600',
            'bg-rose-500/20 text-rose-600'
        ];
        return colors[index % colors.length];
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            if (editingClient) {
                await clientService.updateClient(editingClient._id, formData);
            } else {
                await clientService.createClient(formData);
            }
            setShowCreateModal(false);
            setEditingClient(null);
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                address: '',
                status: 'active'
            });
            fetchClients();
            fetchStats();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Failed to save client. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewClient = (client) => {
        setViewingClient(client);
        setShowViewModal(true);
    };

    const handleEditClient = (client) => {
        setEditingClient(client);
        setFormData({
            fullName: client.fullName,
            email: client.email,
            phone: client.phone || '',
            address: client.address || '',
            status: client.status
        });
        setShowCreateModal(true);
    };

    const handleExportCSV = () => {
        // Create CSV content
        const headers = ['Name', 'Email', 'Phone', 'Law Firm', 'Status'];
        const rows = clients.map(client => [
            client.fullName,
            client.email,
            client.phone || '',
            client.lawFirm?.firmName || 'N/A',
            client.status
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className={pagesListPageCanvasClass}>
                <div className={pagesListPageMaxInnerClass}>
                    <div className="relative z-[1]">
                        <div className={pagesListPageHeaderBandClass}>
                            <PagesTopBar
                                eyebrow="Client management"
                                title={pagesTopBarSplitTitle('Client', 'Directory')}
                                titleClassName="!m-0 !p-0"
                                subtitle="Manage HIPAA-compliant attorney relationships and firm records."
                                className={pagesTopBarFlushOnCreamClass}
                                watermark={pagesTopBarWatermarkWord('Clients')}
                            >
                                <div className={`flex flex-wrap items-center gap-3 ${pagesTopBarUiSansClass}`}>
                                    <button type="button" onClick={handleExportCSV} className={pagesTopBarSecondaryClass}>
                                        <span className="material-icons text-sm">file_download</span>
                                        Export CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingClient(null);
                                            setFormData({
                                                fullName: '',
                                                email: '',
                                                phone: '',
                                                address: '',
                                                status: 'active'
                                            });
                                            setShowCreateModal(true);
                                        }}
                                        className={pagesTopBarPrimaryClass}
                                    >
                                        <span className="material-icons text-sm">person_add</span>
                                        New Client
                                    </button>
                                </div>
                            </PagesTopBar>
                        </div>

            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0891b2]/50 focus:border-[#0891b2] outline-none text-sm transition-all text-slate-700 dark:text-slate-200"
                        placeholder="Search by name, firm, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-[#0891b2]/50 outline-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Status: All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0891b2]/5 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Client & Firm
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Contact Details
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-icons animate-spin text-4xl">refresh</span>
                                        <p className="mt-2">Loading clients...</p>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No clients found
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client, index) => (
                                    <tr key={client._id} className="hover:bg-slate-50 dark:hover:bg-[#0891b2]/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 rounded-full ${getColorClass(index)} flex items-center justify-center font-bold text-sm`}>
                                                    {getInitials(client.fullName)}
                                                </div>
                                                <div className="ml-4">
                                                    <button
                                                        onClick={() => handleViewClient(client)}
                                                        className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#0891b2] dark:hover:text-[#0891b2] transition-colors text-left"
                                                    >
                                                        {client.fullName}
                                                    </button>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{client.lawFirm?.firmName || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-700 dark:text-slate-300">{client.email}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{client.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${client.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                                                    {client.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewClient(client)}
                                                    className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                    title="View Client"
                                                >
                                                    <span className="material-icons text-lg">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEditClient(client)}
                                                    className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                    title="Edit Client"
                                                >
                                                    <span className="material-icons text-lg">edit</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-[#0891b2]/5 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing <span className="font-bold text-slate-700 dark:text-slate-200">{clients.length > 0 ? 1 : 0}</span> to{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-200">{clients.length}</span> of{' '}
                        <span className="font-bold text-slate-700 dark:text-slate-200">{pagination.total}</span> clients
                    </p>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-50">
                            <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0891b2] text-white text-xs font-bold shadow-sm shadow-[#0891b2]/20">
                            {pagination.page}
                        </button>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.pages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-50">
                            <span className="material-icons text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* System Stats Footer */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 flex items-center">
                    <div className="p-3 bg-[#0891b2]/10 rounded-lg text-[#0891b2] mr-4">
                        <span className="material-icons">handshake</span>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Active Clients</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total || 0}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 flex items-center">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500 mr-4">
                        <span className="material-icons">trending_up</span>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">New Leads (30d)</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">+12.4%</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 flex items-center">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 mr-4">
                        <span className="material-icons">verified</span>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Compliance Status</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">HIPAA Secure</p>
                    </div>
                </div>
            </div>
                    </div>
                </div>
            </div>

            {/* Create Client Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingClient ? 'Edit Client' : 'Create New Client'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingClient(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="Enter client full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="client@lawfirm.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="3"
                                    placeholder="123 Main St, City, State ZIP"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingClient(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (editingClient ? 'Updating...' : 'Creating...') : (editingClient ? 'Update Client' : 'Create Client')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Client Modal */}
            {showViewModal && viewingClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Client Details</h2>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setViewingClient(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Client Avatar and Name */}
                            <div className="flex items-center space-x-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 rounded-full bg-[#0891b2]/20 text-[#0891b2] flex items-center justify-center font-bold text-xl">
                                    {getInitials(viewingClient.fullName)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingClient.fullName}</h3>
                                    <div className="flex items-center mt-1">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${viewingClient.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                        <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{viewingClient.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <span className="material-icons text-[#0891b2] text-lg mr-3">email</span>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{viewingClient.email}</p>
                                        </div>
                                    </div>
                                    {viewingClient.phone && (
                                        <div className="flex items-center">
                                            <span className="material-icons text-[#0891b2] text-lg mr-3">phone</span>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{viewingClient.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {viewingClient.address && (
                                        <div className="flex items-start">
                                            <span className="material-icons text-[#0891b2] text-lg mr-3">location_on</span>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {typeof viewingClient.address === 'string'
                                                        ? viewingClient.address
                                                        : `${viewingClient.address.street || ''} ${viewingClient.address.city || ''}, ${viewingClient.address.state || ''} ${viewingClient.address.zipCode || ''}`.trim()
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Law Firm Information */}
                            {viewingClient.lawFirm && (
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Law Firm</h4>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                                        <div className="flex items-center">
                                            <span className="material-icons text-[#0891b2] text-lg mr-3">business</span>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{viewingClient.lawFirm.firmName}</p>
                                                {viewingClient.lawFirm.contactPerson && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Contact: {viewingClient.lawFirm.contactPerson}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Record Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {new Date(viewingClient.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {new Date(viewingClient.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleEditClient(viewingClient);
                                    }}
                                    className="flex-1 px-4 py-2 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-sm">edit</span>
                                    Edit Client
                                </button>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setViewingClient(null);
                                    }}
                                    className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ClientsList;
