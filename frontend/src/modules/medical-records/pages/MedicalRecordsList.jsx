import { useEffect, useState } from 'react';
import caseService from '../../../services/case.service';
import medicalRecordService from '../../../services/medicalRecord.service';
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

const MedicalRecordsList = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, ocrPending: 0 });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [cases, setCases] = useState([]);
    const [loadingCases, setLoadingCases] = useState(false);
    const [uploadData, setUploadData] = useState({
        file: null,
        fileName: '',
        case: '',
        documentType: 'medical-record',
        provider: '',
        recordDate: '',
        notes: ''
    });
    const [uploading, setUploading] = useState(false);
    const [viewOCRModal, setViewOCRModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [ocrText, setOcrText] = useState('');

    useEffect(() => {
        fetchRecords();
        fetchStats();
    }, [filterType, searchQuery, pagination.page]);

    useEffect(() => {
        if (showUploadModal) {
            fetchCases();
        }
    }, [showUploadModal]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const params = {
                documentType: filterType !== 'all' ? filterType : undefined,
                search: searchQuery || undefined,
                page: pagination.page,
                limit: 20
            };
            const response = await medicalRecordService.getAllRecords(params);
            setRecords(response.data.records || []);
            setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await medicalRecordService.getStats();
            setStats(response.data || { total: 0, ocrPending: 0 });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchCases = async () => {
        try {
            setLoadingCases(true);
            const response = await caseService.getAllCases({ limit: 100 });
            setCases(response.data.cases || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoadingCases(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await medicalRecordService.deleteRecord(id);
                alert('Record deleted successfully');
                fetchRecords();
                fetchStats();
            } catch (error) {
                alert('Failed to delete record');
            }
        }
    };

    const handleView = async (record) => {
        try {
            // Fetch the full record with OCR text
            const response = await medicalRecordService.getRecordById(record._id);
            setSelectedRecord(response.data.record);
            setOcrText(response.data.record.ocrText || 'No OCR text available');
            setViewOCRModal(true);
        } catch (error) {
            console.error('Error viewing record:', error);
            alert('Failed to view record');
        }
    };

    const handleDownload = async (record) => {
        try {
            const response = await medicalRecordService.downloadRecord(record._id);
            if (response.data.fileData) {
                // Convert base64 to blob and download
                const byteCharacters = atob(response.data.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: response.data.mimeType || 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = record.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                alert('File data not available');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download file');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadData({
                ...uploadData,
                file,
                fileName: file.name
            });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) {
            alert('Please select a file to upload');
            return;
        }
        if (!uploadData.case) {
            alert('Please select a case');
            return;
        }

        // Check file size limit (1MB for OCR processing)
        if (uploadData.file.size > 1024 * 1024) {
            alert('File size must be under 1MB for OCR processing. Please use a smaller file.');
            return;
        }

        let fileToUpload = uploadData.file;

        try {
            setUploading(true);

            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = event.target.result.split(',')[1]; // Remove data:mime;base64, prefix

                const recordData = {
                    case: uploadData.case,
                    fileName: uploadData.file.name, // Keep original filename
                    fileType: uploadData.file.type.includes('pdf') ? 'pdf' :
                        (uploadData.file.type.includes('image') || uploadData.file.type.includes('jpeg') || uploadData.file.type.includes('png')) ? 'image' :
                            uploadData.file.type.includes('doc') ? 'doc' : 'other',
                    fileSize: fileToUpload.size, // Use compressed file size
                    documentType: uploadData.documentType,
                    provider: uploadData.provider ? { name: uploadData.provider } : undefined,
                    recordDate: uploadData.recordDate || undefined,
                    notes: uploadData.notes || undefined,
                    pageCount: 1,
                    fileData: base64Data,
                    mimeType: uploadData.file.type
                };

                try {
                    await medicalRecordService.uploadRecord(recordData);
                    setShowUploadModal(false);
                    setUploadData({
                        file: null,
                        fileName: '',
                        case: '',
                        documentType: 'medical-record',
                        provider: '',
                        recordDate: '',
                        notes: ''
                    });
                    fetchRecords();
                    fetchStats();
                    alert('Record uploaded successfully');
                } catch (error) {
                    console.error('Error uploading record:', error);
                    alert('Failed to upload record. Please try again.');
                } finally {
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                alert('Failed to read file');
                setUploading(false);
            };

            reader.readAsDataURL(fileToUpload); // Use compressed file
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Failed to process file. Please try again.');
            setUploading(false);
        }
    };

    return (
        <>
            <div className={pagesListPageCanvasClass}>
                <div className={pagesListPageMaxInnerClass}>
                    <div className="relative z-[1]">
                        <div className={pagesListPageHeaderBandClass}>
                            <PagesTopBar
                                eyebrow="Records management"
                                title={pagesTopBarSplitTitle('Medical', 'Records')}
                                titleClassName="!m-0 !p-0"
                                subtitle="Manage and search medical documentation with OCR capabilities"
                                className={pagesTopBarFlushOnCreamClass}
                                watermark={pagesTopBarWatermarkWord('Records')}
                            >
                                <div className={`flex flex-wrap items-center gap-3 ${pagesTopBarUiSansClass}`}>
                                    <button type="button" className={pagesTopBarSecondaryClass}>
                                        <span className="material-icons text-sm">filter_list</span>
                                        Filters
                                    </button>
                                    <button type="button" onClick={() => setShowUploadModal(true)} className={pagesTopBarPrimaryClass}>
                                        <span className="material-icons text-sm">upload_file</span>
                                        Upload Records
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
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0891b2]/50 outline-none text-sm"
                        placeholder="Search by filename, case, or provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0891b2]/50 outline-none"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">All Types</option>
                    <option value="medical-record">Medical Records</option>
                    <option value="lab-report">Lab Reports</option>
                    <option value="imaging">Imaging</option>
                    <option value="prescription">Prescriptions</option>
                    <option value="consultation">Consultations</option>
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#0891b2]/10 rounded-lg text-[#0891b2] mr-4">
                            <span className="material-icons">folder</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Records</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10">
                    <div className="flex items-center">
                        <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 mr-4">
                            <span className="material-icons">pending</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">OCR Pending</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.ocrPending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-[#0891b2]/10">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500 mr-4">
                            <span className="material-icons">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Processed</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total - stats.ocrPending}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Records Table */}
            <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0891b2]/5 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Document</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Case</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Provider</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-icons animate-spin text-4xl">refresh</span>
                                        <p className="mt-2">Loading records...</p>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record._id} className="hover:bg-slate-50 dark:hover:bg-[#0891b2]/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="material-icons text-red-500 mr-3">picture_as_pdf</span>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{record.fileName}</div>
                                                    <div className="text-xs text-slate-500">{(record.fileSize / 1024).toFixed(1)} KB • {record.pageCount} pages</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{record.case?.caseNumber || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{record.case?.caseName || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            {record.provider?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            {record.recordDate ? formatDate(record.recordDate) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${record.ocrStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                                record.ocrStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                    record.ocrStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                }`}>
                                                {record.ocrStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleView(record)}
                                                    className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                    title="View document"
                                                >
                                                    <span className="material-icons text-lg">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(record)}
                                                    className="p-2 text-slate-400 hover:text-[#0891b2] transition-colors"
                                                    title="Download document"
                                                >
                                                    <span className="material-icons text-lg">download</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record._id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                    title="Delete document"
                                                >
                                                    <span className="material-icons text-lg">delete</span>
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
                    <p className="text-xs text-slate-500">
                        Showing {records.length > 0 ? 1 : 0} to {records.length} of {pagination.total} records
                    </p>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50">
                            <span className="material-icons text-sm">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0891b2] text-white text-xs font-bold">
                            {pagination.page}
                        </button>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page >= pagination.pages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50">
                            <span className="material-icons text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Medical Record</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload and process medical documentation with OCR</p>
                                </div>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-5">
                            {/* Case Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Case *
                                </label>
                                <select
                                    required
                                    value={uploadData.case}
                                    onChange={(e) => setUploadData({ ...uploadData, case: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    disabled={loadingCases}
                                >
                                    <option value="">
                                        {loadingCases ? 'Loading cases...' : 'Select a case'}
                                    </option>
                                    {cases.map((caseItem) => (
                                        <option key={caseItem._id} value={caseItem._id}>
                                            {caseItem.caseNumber} - {caseItem.caseName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Upload Area */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Document File *
                                </label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-[#0891b2] transition-colors">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        required
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <span className="material-icons text-5xl text-[#0891b2] mb-3">cloud_upload</span>
                                            {uploadData.fileName ? (
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{uploadData.fileName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                                                    <p className="text-xs text-slate-500 mt-1">PDF, JPG, JPEG, PNG (Max 15MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Document Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Document Type *
                                    </label>
                                    <select
                                        required
                                        value={uploadData.documentType}
                                        onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="medical-record">Medical Record</option>
                                        <option value="lab-report">Lab Report</option>
                                        <option value="imaging">Imaging</option>
                                        <option value="prescription">Prescription</option>
                                        <option value="consultation">Consultation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Record Date */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Record Date
                                    </label>
                                    <input
                                        type="date"
                                        value={uploadData.recordDate}
                                        onChange={(e) => setUploadData({ ...uploadData, recordDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Provider */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Healthcare Provider
                                </label>
                                <input
                                    type="text"
                                    value={uploadData.provider}
                                    onChange={(e) => setUploadData({ ...uploadData, provider: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="Dr. Smith, City Hospital, etc."
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={uploadData.notes}
                                    onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] focus:border-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="3"
                                    placeholder="Add any additional notes or context..."
                                />
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start">
                                    <span className="material-icons text-blue-600 dark:text-blue-400 text-lg mr-3">info</span>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <p className="font-medium mb-1">OCR Processing</p>
                                        <p className="text-xs">Uploaded documents will be automatically processed with OCR technology to extract text and make them searchable.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !uploadData.file || !uploadData.case}
                                    className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="material-icons animate-spin text-sm">refresh</span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm">upload</span>
                                            Upload Record
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View OCR Modal */}
            {viewOCRModal && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    OCR Extracted Text
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {selectedRecord.fileName}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setViewOCRModal(false);
                                    setSelectedRecord(null);
                                    setOcrText('');
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${selectedRecord.ocrStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                        selectedRecord.ocrStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
                                            selectedRecord.ocrStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {selectedRecord.ocrStatus?.toUpperCase() || 'PENDING'}
                                    </span>
                                    {selectedRecord.ocrProcessedAt && (
                                        <span className="text-xs text-slate-500">
                                            Processed: {formatDate(selectedRecord.ocrProcessedAt)}
                                        </span>
                                    )}
                                </div>
                                <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                                    {ocrText}
                                </pre>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => handleDownload(selectedRecord)}
                                className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-sm">download</span>
                                Download Original File
                            </button>
                            <button
                                onClick={() => {
                                    setViewOCRModal(false);
                                    setSelectedRecord(null);
                                    setOcrText('');
                                }}
                                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MedicalRecordsList;
