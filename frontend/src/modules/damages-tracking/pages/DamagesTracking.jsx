import { useEffect, useState } from 'react';
import caseService from '../../../services/case.service';
import damagesService from '../services/damages.service';
import PagesTopBar, { pagesTopBarPrimaryClass } from '../../../shared/components/PagesTopBar';

const DamagesTracking = () => {
    const [selectedCase, setSelectedCase] = useState('');
    const [cases, setCases] = useState([]);
    const [damages, setDamages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        category: 'economic',
        type: '',
        description: '',
        amount: '',
        dateIncurred: new Date().toISOString().split('T')[0],
        status: 'estimated',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (selectedCase) {
            fetchDamages();
        }
    }, [selectedCase]);

    const fetchCases = async () => {
        try {
            const data = await caseService.getAllCases();
            setCases(data.data?.cases || data.cases || []);
            if ((data.data?.cases || data.cases || []).length > 0) {
                setSelectedCase((data.data?.cases || data.cases)[0]._id);
            }
        } catch (error) {
            console.error('Failed to load cases:', error);
        }
    };

    const fetchDamages = async () => {
        try {
            setLoading(true);
            const response = await damagesService.getDamagesByCase(selectedCase);
            // Backend returns { success: true, data: { damages, summary } }
            setDamages(response.data?.damages || []);
        } catch (error) {
            console.error('Failed to load damages:', error);
            setDamages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCase) {
            alert('Please select a case first');
            return;
        }

        try {
            setSubmitting(true);
            await damagesService.createDamage({
                case: selectedCase,
                ...formData,
                amount: parseFloat(formData.amount) || 0
            });
            setShowAddModal(false);
            setFormData({
                category: 'economic',
                type: '',
                description: '',
                amount: '',
                dateIncurred: new Date().toISOString().split('T')[0],
                status: 'estimated',
                notes: ''
            });
            fetchDamages();
            alert('Damage item added successfully');
        } catch (error) {
            console.error('Error adding damage:', error);
            alert('Failed to add damage item. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this damage item?')) return;

        try {
            await damagesService.deleteDamage(id);
            alert('Damage item deleted successfully');
            fetchDamages();
        } catch (error) {
            alert('Failed to delete damage item: ' + error.message);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'verified': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'documented': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'estimated': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'disputed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[status?.toLowerCase()] || colors['estimated'];
    };

    const totalDamages = damages.reduce((sum, item) => sum + (item.amount || 0), 0);
    const verifiedDamages = damages.filter(d => d.status === 'verified').reduce((sum, item) => sum + (item.amount || 0), 0);
    const estimatedDamages = damages.filter(d => d.status === 'estimated').reduce((sum, item) => sum + (item.amount || 0), 0);

    return (
        <div className="max-w-7xl mx-auto">
            <PagesTopBar
                title="Damages Tracking"
                subtitle="Document injuries and calculate damages"
            >
                <button type="button" onClick={() => setShowAddModal(true)} className={pagesTopBarPrimaryClass}>
                    <span className="material-icons text-sm">add</span>
                    Add Damage Item
                </button>
            </PagesTopBar>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Select Case:</label>
                    <select
                        className="flex-1 max-w-md px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                    >
                        {cases.map(c => (
                            <option key={c._id} value={c._id}>{c.title} ({c.caseNumber})</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                        <p className="mt-4 text-slate-500">Loading damages...</p>
                    </div>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="material-icons text-purple-600">attach_money</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">${totalDamages.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Damages</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="material-icons text-green-600">verified</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">${verifiedDamages.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Verified</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="material-icons text-blue-600">calculate</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">${estimatedDamages.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Estimated</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <span className="material-icons text-orange-600">description</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{damages.length}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Line Items</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white">Damage Items</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400">
                            <tr>
                                <th className="px-6 py-3 text-left">Category</th>
                                <th className="px-6 py-3 text-left">Description</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Amount</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-left">Documentation</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {!loading && damages.length > 0 ? damages.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{item.category}</span>
                                        <p className="text-xs text-slate-500">{item.type}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {item.dateIncurred ? new Date(item.dateIncurred).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            ${(item.amount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.notes || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Edit">
                                                <span className="material-icons text-slate-400 hover:text-[#0891b2] text-lg">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Delete">
                                                <span className="material-icons text-slate-400 hover:text-red-500 text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : !loading && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        No damage items found for this case
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Damage Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Damage Item</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Document injuries and calculate damages</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="economic">Economic</option>
                                        <option value="non-economic">Non-Economic</option>
                                        <option value="punitive">Punitive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Type *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                        placeholder="e.g., Medical Bills, Lost Wages"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="3"
                                    placeholder="Describe the damage or injury..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Amount ($) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Date Incurred *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dateIncurred}
                                        onChange={(e) => setFormData({ ...formData, dateIncurred: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Status *
                                </label>
                                <select
                                    required
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="estimated">Estimated</option>
                                    <option value="documented">Documented</option>
                                    <option value="verified">Verified</option>
                                    <option value="disputed">Disputed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="2"
                                    placeholder="Additional notes or documentation references..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="material-icons animate-spin text-sm">refresh</span>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">add</span>
                                            Add Damage
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DamagesTracking;
