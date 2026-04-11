import { useEffect, useState } from 'react';
import lawFirmService from '../../../services/lawFirm.service';
import PagesTopBar, { pagesTopBarPrimaryClass } from '../../../shared/components/PagesTopBar';

const LawFirmsList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [firms, setFirms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedFirm, setSelectedFirm] = useState(null);
    const [formData, setFormData] = useState({
        firmName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
        },
        website: '',
        specializations: [],
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        fetchFirms();
    }, [searchTerm, pagination.page]);

    const fetchFirms = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm || undefined,
                page: pagination.page,
                limit: 12
            };
            const response = await lawFirmService.getAllLawFirms(params);
            setFirms(response.data.lawFirms || []);
            setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching firms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (firm) => {
        setSelectedFirm(firm);
        setShowViewModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this law firm?')) {
            try {
                await lawFirmService.deleteLawFirm(id);
                alert('Law firm deleted');
                fetchFirms();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await lawFirmService.createLawFirm(formData);
            alert('Law firm created successfully!');
            setShowCreateModal(false);
            setFormData({
                firmName: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'USA'
                },
                website: '',
                specializations: [],
                status: 'active',
                notes: ''
            });
            fetchFirms();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create law firm');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <PagesTopBar
                titleAs="h2"
                title="Partner Law Firms"
                subtitle={`Manage ${pagination.total} registered law firms`}
                titleSize="lg"
                align="end"
            >
                <button type="button" onClick={() => setShowCreateModal(true)} className={pagesTopBarPrimaryClass}>
                    <span className="material-icons text-[20px]">add</span>
                    Add Law Firm
                </button>
            </PagesTopBar>

            {/* Search */}
            <section className="mb-6">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-slate-400">search</span>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-[#1f3b61] rounded-lg text-sm"
                            placeholder="Search by firm name, partner, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Grid */}
            <main className="pb-20">
                {loading ? (
                    <div className="text-center py-12">
                        <span className="material-icons animate-spin text-4xl">refresh</span>
                        <p className="mt-2 text-slate-500">Loading...</p>
                    </div>
                ) : firms.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No law firms found</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {firms.map((firm) => (
                            <div key={firm._id} className="group bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="h-2 bg-[#1f3b61]"></div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <span className="material-icons text-[#1f3b61]">business</span>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${firm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {firm.status}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-[#1f3b61] transition-colors">
                                        {firm.firmName}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4 flex items-center">
                                        <span className="material-icons text-xs mr-1">location_on</span>
                                        {firm.address?.city || 'N/A'}, {firm.address?.state || ''}
                                    </p>
                                    <div className="space-y-3 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 uppercase font-semibold">Contact</span>
                                            <span className="text-sm font-medium">{firm.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 uppercase font-semibold">Email</span>
                                            <span className="text-xs text-slate-600">{firm.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleView(firm)}
                                            className="flex-1 py-2 bg-slate-50 text-slate-700 font-semibold rounded-lg hover:bg-[#1f3b61] hover:text-white transition-all text-sm">
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(firm._id)}
                                            className="px-3 py-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all">
                                            <span className="material-icons text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-12 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Showing {firms.length} of {pagination.total} firms
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-[#1f3b61] text-white rounded-lg text-sm font-medium">{pagination.page}</button>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.pages}
                            className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            </main>

            {/* View Law Firm Modal */}
            {showViewModal && selectedFirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#1f3b61]/10 rounded-lg flex items-center justify-center">
                                    <span className="material-icons text-[#1f3b61]">business</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedFirm.firmName}</h3>
                                    <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded-full mt-1 ${selectedFirm.status === 'active' ? 'bg-green-100 text-green-700' :
                                            selectedFirm.status === 'inactive' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {selectedFirm.status}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Contact Information */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-icons text-[#1f3b61]">contact_phone</span>
                                    Contact Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Person</label>
                                        <p className="text-slate-900 dark:text-white font-medium">{selectedFirm.contactPerson || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                        <p className="text-slate-900 dark:text-white font-medium">{selectedFirm.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                                        <p className="text-slate-900 dark:text-white font-medium">{selectedFirm.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Website</label>
                                        {selectedFirm.website ? (
                                            <a
                                                href={selectedFirm.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#1f3b61] hover:underline font-medium"
                                            >
                                                {selectedFirm.website}
                                            </a>
                                        ) : (
                                            <p className="text-slate-900 dark:text-white font-medium">N/A</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-icons text-[#1f3b61]">location_on</span>
                                    Address
                                </h4>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    {selectedFirm.address ? (
                                        <div className="space-y-2">
                                            {selectedFirm.address.street && (
                                                <p className="text-slate-900 dark:text-white">{selectedFirm.address.street}</p>
                                            )}
                                            <p className="text-slate-900 dark:text-white">
                                                {[
                                                    selectedFirm.address.city,
                                                    selectedFirm.address.state,
                                                    selectedFirm.address.zipCode
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                            {selectedFirm.address.country && (
                                                <p className="text-slate-900 dark:text-white">{selectedFirm.address.country}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500">No address provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Specializations */}
                            {selectedFirm.specializations && selectedFirm.specializations.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-icons text-[#1f3b61]">gavel</span>
                                        Specializations
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFirm.specializations.map((spec, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-[#1f3b61]/10 text-[#1f3b61] rounded-full text-sm font-medium"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedFirm.notes && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="material-icons text-[#1f3b61]">notes</span>
                                        Notes
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                        <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{selectedFirm.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-icons text-[#1f3b61]">info</span>
                                    Additional Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Created</label>
                                        <p className="text-slate-900 dark:text-white font-medium">
                                            {selectedFirm.createdAt ? new Date(selectedFirm.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Updated</label>
                                        <p className="text-slate-900 dark:text-white font-medium">
                                            {selectedFirm.updatedAt ? new Date(selectedFirm.updatedAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="w-full px-6 py-2.5 bg-[#1f3b61] text-white rounded-lg hover:bg-[#1f3b61]/90 transition-colors font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Law Firm Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Law Firm</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Basic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Firm Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firmName}
                                            onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="Smith & Associates"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Contact Person <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="John Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="contact@lawfirm.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Phone <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="https://www.lawfirm.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Address</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, street: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="123 Main Street"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">City</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, city: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="New York"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">State</label>
                                        <input
                                            type="text"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, state: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="NY"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={formData.address.zipCode}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, zipCode: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="10001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Country</label>
                                        <input
                                            type="text"
                                            value={formData.address.country}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: { ...formData.address, country: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="USA"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Information</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows="3"
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#1f3b61] outline-none"
                                            placeholder="Additional notes about this law firm..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-2.5 bg-[#1f3b61] text-white rounded-lg hover:bg-[#1f3b61]/90 transition-colors font-semibold"
                                >
                                    Create Law Firm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawFirmsList;
