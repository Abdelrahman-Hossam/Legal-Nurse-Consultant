import { useEffect, useState } from 'react';
import caseService from '../../../services/case.service';
import caseAnalysisService from '../../../services/caseAnalysis.service';
import medicalRecordService from '../../../services/medicalRecord.service';

const CaseAnalysis = () => {
    const [selectedCase, setSelectedCase] = useState('');
    const [activeTab, setActiveTab] = useState('standards');
    const [cases, setCases] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [findingType, setFindingType] = useState('standard'); // 'standard', 'deviation', 'high-severity', or 'standards-met'
    const [formData, setFormData] = useState({
        category: '',
        standard: '',
        assessment: '',
        evidence: '',
        description: '',
        severity: 'medium',
        impact: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [submitting, setSubmitting] = useState(false);
    const [showDocumentPicker, setShowDocumentPicker] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (selectedCase) {
            fetchAnalysis();
            fetchDocuments();
        }
    }, [selectedCase]);

    const fetchDocuments = async () => {
        if (!selectedCase) return;
        try {
            const response = await medicalRecordService.getRecordsByCase(selectedCase);
            setDocuments(response.data?.records || response.records || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
            setDocuments([]);
        }
    };

    const handleDocumentSelect = (doc) => {
        const isSelected = selectedDocuments.some(d => d._id === doc._id);
        if (isSelected) {
            setSelectedDocuments(selectedDocuments.filter(d => d._id !== doc._id));
        } else {
            setSelectedDocuments([...selectedDocuments, doc]);
        }
    };

    const handleAttachDocuments = () => {
        const docNames = selectedDocuments.map(d => d.fileName).join(', ');
        setFormData({ ...formData, evidence: docNames });
        setShowDocumentPicker(false);
    };

    const fetchCases = async () => {
        try {
            const response = await caseService.getAllCases();
            const casesList = response.data?.cases || [];
            setCases(casesList);
            if (casesList.length > 0) {
                setSelectedCase(casesList[0]._id);
            }
        } catch (error) {
            console.error('Failed to load cases:', error);
        }
    };

    const fetchAnalysis = async () => {
        try {
            setLoading(true);
            const response = await caseAnalysisService.getAnalysisByCase(selectedCase);
            // Backend returns { success: true, data: analysis }
            setAnalysis(response.data || response);
        } catch (error) {
            console.error('Failed to load analysis:', error);
            setAnalysis(null);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'high': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'Low': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'low': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'None': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'none': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        };
        return colors[severity] || colors['None'];
    };

    const handleSubmitFinding = async (e) => {
        e.preventDefault();
        if (!selectedCase) {
            alert('Please select a case first');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                caseId: selectedCase,
                ...(findingType === 'standard' || findingType === 'standards-met' ? {
                    standardsOfCare: [{
                        category: formData.category,
                        standard: formData.standard,
                        assessment: formData.assessment,
                        evidence: formData.evidence
                    }]
                } : {
                    breaches: [{
                        description: formData.description,
                        severity: findingType === 'high-severity' ? 'high' : formData.severity,
                        impact: formData.impact,
                        date: formData.date
                    }]
                })
            };

            await caseAnalysisService.createAnalysis(payload);
            setShowAddModal(false);
            setFormData({
                category: '',
                standard: '',
                assessment: '',
                evidence: '',
                description: '',
                severity: 'medium',
                impact: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchAnalysis();
            alert('Finding added successfully');
        } catch (error) {
            console.error('Error adding finding:', error);
            alert('Failed to add finding. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Case Analysis</h1>
                    <p className="text-slate-500 mt-1">Analyze standards of care and identify deviations</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#0891b2] hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all transform active:scale-95"
                >
                    <span className="material-icons text-sm">add</span>
                    Add Finding
                </button>
            </div>

            {/* Case Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Select Case:</label>
                    <select
                        className="flex-1 max-w-md px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none"
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                    >
                        {cases.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.caseNumber} - {c.caseName || c.title || 'Unnamed Case'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                        <p className="mt-4 text-slate-500">Loading analysis...</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {!loading && analysis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="material-icons text-blue-600">rule</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{analysis.standardsOfCare?.length || 0}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Standards Reviewed</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-icons text-red-600">warning</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{analysis.breaches?.length || 0}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Deviations Found</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <span className="material-icons text-yellow-600">priority_high</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{analysis.breaches?.filter(b => b.severity === 'high').length || 0}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">High Severity</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="material-icons text-green-600">check_circle</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{(analysis.standardsOfCare?.length || 0) - (analysis.breaches?.length || 0)}</p>
                                <p className="text-xs text-slate-500 uppercase font-bold">Standards Met</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md mb-6">
                <div className="border-b border-slate-200 dark:border-slate-800 px-6">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('standards')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'standards'
                                ? 'border-[#0891b2] text-[#0891b2]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Standards of Care
                        </button>
                        <button
                            onClick={() => setActiveTab('deviations')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'deviations'
                                ? 'border-[#0891b2] text-[#0891b2]'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Identified Deviations
                        </button>
                    </div>
                </div>

                {/* Standards Tab */}
                {activeTab === 'standards' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 text-left">Category</th>
                                    <th className="px-6 py-3 text-left">Standard</th>
                                    <th className="px-6 py-3 text-left">Assessment</th>
                                    <th className="px-6 py-3 text-left">Evidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {analysis && analysis.standardsOfCare && analysis.standardsOfCare.length > 0 ? analysis.standardsOfCare.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.category}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.standard}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.assessment}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.evidence}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                            No standards of care documented yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Deviations Tab */}
                {activeTab === 'deviations' && !loading && (
                    <div className="p-6 space-y-4">
                        {analysis && analysis.breaches && analysis.breaches.length > 0 ? (
                            analysis.breaches.map((breach, idx) => (
                                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{breach.description}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-icons text-xs">calendar_today</span>
                                                    {new Date(breach.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityColor(breach.severity || 'Medium')}`}>
                                            {breach.severity || 'Medium'} Impact
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{breach.impact}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No deviations identified yet
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Finding Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Finding</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Document standards of care or deviations</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmitFinding} className="p-6 space-y-5">
                            {/* Case Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Case *
                                </label>
                                <select
                                    required
                                    value={selectedCase}
                                    onChange={(e) => setSelectedCase(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">Select a case</option>
                                    {cases.map((caseItem) => (
                                        <option key={caseItem._id} value={caseItem._id}>
                                            {caseItem.caseNumber} - {caseItem.caseName || caseItem.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Finding Type Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Finding Type *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFindingType('standard')}
                                        className={`p-4 rounded-lg border-2 transition-all shadow-sm bg-white dark:bg-slate-900 ${findingType === 'standard'
                                            ? 'border-[#0891b2] ring-2 ring-[#0891b2]/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-[#0891b2] hover:shadow-md'
                                            }`}
                                    >
                                        <span className="material-icons text-2xl mb-2 text-[#0891b2]">check_circle</span>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Standard of Care</p>
                                        <p className="text-xs text-slate-500 mt-1">Document expected standards</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFindingType('deviation')}
                                        className={`p-4 rounded-lg border-2 transition-all shadow-sm bg-white dark:bg-slate-900 ${findingType === 'deviation'
                                            ? 'border-red-500 ring-2 ring-red-500/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-red-500 hover:shadow-md'
                                            }`}
                                    >
                                        <span className="material-icons text-2xl mb-2 text-red-500">warning</span>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Deviation</p>
                                        <p className="text-xs text-slate-500 mt-1">Document breaches found</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFindingType('high-severity')}
                                        className={`p-4 rounded-lg border-2 transition-all shadow-sm bg-white dark:bg-slate-900 ${findingType === 'high-severity'
                                            ? 'border-yellow-500 ring-2 ring-yellow-500/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-yellow-500 hover:shadow-md'
                                            }`}
                                    >
                                        <span className="material-icons text-2xl mb-2 text-yellow-500">priority_high</span>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">High Severity</p>
                                        <p className="text-xs text-slate-500 mt-1">Critical deviations</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFindingType('standards-met')}
                                        className={`p-4 rounded-lg border-2 transition-all shadow-sm bg-white dark:bg-slate-900 ${findingType === 'standards-met'
                                            ? 'border-green-500 ring-2 ring-green-500/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-green-500 hover:shadow-md'
                                            }`}
                                    >
                                        <span className="material-icons text-2xl mb-2 text-green-500">verified</span>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Standards Met</p>
                                        <p className="text-xs text-slate-500 mt-1">Compliant findings</p>
                                    </button>
                                </div>
                            </div>

                            {/* Standard of Care Form */}
                            {(findingType === 'standard' || findingType === 'standards-met') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Category *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            placeholder="e.g., Medication Administration, Patient Monitoring"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Standard Description *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.standard}
                                            onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            rows="3"
                                            placeholder="Describe the expected standard of care..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Assessment *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.assessment}
                                            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            rows="3"
                                            placeholder="Your assessment of compliance..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Evidence
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.evidence}
                                                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                                                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                                placeholder="Reference to supporting documentation..."
                                                readOnly
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowDocumentPicker(true)}
                                                className="px-4 py-2.5 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-icons text-sm">attach_file</span>
                                                Select Documents
                                            </button>
                                        </div>
                                        {selectedDocuments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedDocuments.map(doc => (
                                                    <span key={doc._id} className="inline-flex items-center gap-1 px-2 py-1 bg-[#0891b2]/10 text-[#0891b2] rounded text-xs">
                                                        <span className="material-icons text-xs">description</span>
                                                        {doc.fileName}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDocumentSelect(doc)}
                                                            className="ml-1 hover:text-red-500"
                                                        >
                                                            <span className="material-icons text-xs">close</span>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Deviation Form */}
                            {(findingType === 'deviation' || findingType === 'high-severity') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Deviation Description *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            rows="3"
                                            placeholder="Describe the deviation from standard of care..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Severity *
                                            </label>
                                            <select
                                                required
                                                value={formData.severity}
                                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Impact *
                                        </label>
                                        <textarea
                                            required
                                            value={formData.impact}
                                            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                            rows="3"
                                            placeholder="Describe the impact of this deviation..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
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
                                            Add Finding
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Picker Modal */}
            {showDocumentPicker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Medical Documents</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Choose documents to attach as evidence ({selectedDocuments.length} selected)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDocumentPicker(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {documents.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <span className="material-icons text-6xl text-slate-300 mb-4">folder_open</span>
                                    <p>No medical documents found for this case</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => {
                                        const isSelected = selectedDocuments.some(d => d._id === doc._id);
                                        return (
                                            <div
                                                key={doc._id}
                                                onClick={() => handleDocumentSelect(doc)}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                    ? 'border-[#0891b2] bg-[#0891b2]/10'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#0891b2] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                        }`}>
                                                        {isSelected ? (
                                                            <span className="material-icons text-sm">check</span>
                                                        ) : (
                                                            <span className="material-icons text-sm">description</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                            {doc.fileName}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                            <span>{doc.documentType || 'Medical Record'}</span>
                                                            {doc.uploadDate && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                            {doc.fileSize && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDocuments([]);
                                    setShowDocumentPicker(false);
                                }}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAttachDocuments}
                                disabled={selectedDocuments.length === 0}
                                className="px-6 py-2 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons text-sm">attach_file</span>
                                Attach {selectedDocuments.length > 0 ? `(${selectedDocuments.length})` : 'Documents'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseAnalysis;
