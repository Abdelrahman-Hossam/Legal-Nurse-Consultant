import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import caseService from '../../../services/case.service';
import clientService from '../../../services/client.service';
import lawFirmService from '../../../services/lawFirm.service';

const CreateCase = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const casesListAfterCreate = pathname.startsWith('/staff') ? '/staff/cases' : '/cases';
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [lawFirms, setLawFirms] = useState([]);
    const [formData, setFormData] = useState({
        caseName: '',
        caseType: 'medical-malpractice',
        client: '',
        lawFirm: '',
        description: '',
        incidentDate: '',
        priority: 'medium'
    });

    useEffect(() => {
        fetchClients();
        fetchLawFirms();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await clientService.getAllClients({ limit: 100 });
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchLawFirms = async () => {
        try {
            const response = await lawFirmService.getAllLawFirms({ limit: 100 });
            setLawFirms(response.data.lawFirms || []);
        } catch (error) {
            console.error('Error fetching law firms:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { ...formData };
            if (!payload.lawFirm || String(payload.lawFirm).trim() === '') {
                delete payload.lawFirm;
            }
            if (!payload.incidentDate || String(payload.incidentDate).trim() === '') {
                delete payload.incidentDate;
            }
            await caseService.createCase(payload);
            alert('Case created successfully!');
            navigate(casesListAfterCreate);
        } catch (error) {
            alert('Failed to create case');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Case</h1>
                <p className="text-sm text-slate-500 mt-1">Enter case details to begin intake process</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border p-6 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Case Name *</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                        value={formData.caseName}
                        onChange={(e) => setFormData({ ...formData, caseName: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Case Type *</label>
                        <select
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={formData.caseType}
                            onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                        >
                            <option value="medical-malpractice">Medical Malpractice</option>
                            <option value="personal-injury">Personal Injury</option>
                            <option value="workers-compensation">Workers Compensation</option>
                            <option value="product-liability">Product Liability</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Client *</label>
                        <select
                            required
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={formData.client}
                            onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        >
                            <option value="">Select Client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Law Firm</label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                            value={formData.lawFirm}
                            onChange={(e) => setFormData({ ...formData, lawFirm: e.target.value })}
                        >
                            <option value="">Select Law Firm</option>
                            {lawFirms.map(firm => (
                                <option key={firm._id} value={firm._id}>{firm.firmName}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Incident Date</label>
                    <input
                        type="date"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                        value={formData.incidentDate}
                        onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea
                        rows="4"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#0891b2] hover:bg-teal-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Case'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/cases')}
                        className="px-6 py-3 border rounded-lg font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateCase;
