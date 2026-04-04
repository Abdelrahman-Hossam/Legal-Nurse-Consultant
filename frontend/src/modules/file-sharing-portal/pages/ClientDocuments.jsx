import { useEffect, useState } from 'react';
import apiClient from '../../../services/api.service';
import clientPortalService from '../../../services/clientPortal.service';
import medicalRecordService from '../../../services/medicalRecord.service';

const ClientDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [cases, setCases] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedCase, setSelectedCase] = useState('all');
    const [uploadCase, setUploadCase] = useState('');
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [selectedCase]);

    const fetchCases = async () => {
        try {
            const casesData = await clientPortalService.getClientCases();
            setCases(casesData || []);
            if (casesData && casesData.length > 0) {
                setUploadCase(casesData[0]._id);
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
            setCases([]);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const filters = selectedCase !== 'all' ? { caseId: selectedCase } : {};
            const docs = await clientPortalService.getClientDocuments(filters);
            setDocuments(docs || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        if (!uploadCase && cases.length > 0) {
            alert('Please select a case first');
            return;
        }

        // If no cases available, show error
        if (cases.length === 0) {
            alert('No cases available. Please create a case first.');
            return;
        }

        setUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Check file size limit (1MB for OCR processing)
                if (file.size > 1024 * 1024) {
                    alert(`File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 1MB for OCR processing. Skipping this file.`);
                    continue;
                }

                // Convert file to base64
                const base64Data = await convertFileToBase64(file);

                // Determine file type
                const fileExtension = file.name.split('.').pop().toLowerCase();
                let fileType = 'other';
                if (fileExtension === 'pdf') fileType = 'pdf';
                else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) fileType = 'image';
                else if (['doc', 'docx'].includes(fileExtension)) fileType = 'doc';

                // Upload to backend
                const recordData = {
                    case: uploadCase,
                    fileName: file.name, // Keep original filename
                    fileType: fileType,
                    fileSize: file.size, // Use original size
                    fileUrl: `/uploads/${file.name}`, // Placeholder
                    fileData: base64Data, // Base64 encoded file
                    documentType: 'medical-record'
                };

                await medicalRecordService.uploadRecord(recordData);
            }

            alert('Files uploaded successfully!');
            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload files: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            // Get the file reference from the document
            const fileId = doc._id;

            // Call download endpoint
            const response = await apiClient.get(`/medical-records/${fileId}/download`);

            if (response.data.success && response.data.data.fileData) {
                // Create a download link from base64 data
                const link = document.createElement('a');
                link.href = response.data.data.fileData;
                link.download = response.data.data.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('File data not available for download');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download file: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (docId) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            // TODO: Implement delete functionality
            alert('Delete functionality requires backend implementation');
        }
    };

    const getFileIcon = (fileType) => {
        const icons = {
            'pdf': 'picture_as_pdf',
            'doc': 'description',
            'docx': 'description',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'default': 'insert_drive_file'
        };
        const ext = fileType?.toLowerCase() || 'default';
        return icons[ext] || icons.default;
    };

    if (loading && documents.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-icons animate-spin text-4xl text-[#0891b2]">refresh</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Documents</h1>
                <p className="text-slate-600 dark:text-slate-400">Upload and manage your medical records and case documents</p>
            </div>

            {/* Upload Section */}
            <div className="bg-gradient-to-br from-[#0891b2] to-[#0891b2]/80 rounded-xl p-8 mb-8 text-white">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2">Upload Medical Records</h2>
                        <p className="text-white/80 mb-4">Securely upload your medical documents for review</p>
                        <div className="flex items-center gap-2 text-sm mb-4">
                            <span className="material-icons text-lg">check_circle</span>
                            <span>256-bit AES Encryption</span>
                            <span className="mx-2">•</span>
                            <span className="material-icons text-lg">check_circle</span>
                            <span>HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {cases.length > 0 ? (
                                <select
                                    value={uploadCase}
                                    onChange={(e) => setUploadCase(e.target.value)}
                                    className="px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-white/50 focus:border-transparent"
                                >
                                    {cases.map((caseItem) => (
                                        <option key={caseItem._id} value={caseItem._id} className="text-slate-900">
                                            {caseItem.caseNumber} - {caseItem.caseName || caseItem.title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-white/80">Loading cases...</p>
                            )}
                        </div>
                    </div>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            disabled={uploading}
                        />
                        <div className={`bg-white text-[#0891b2] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-lg ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="material-icons">{uploading ? 'hourglass_empty' : 'cloud_upload'}</span>
                            {uploading ? 'Uploading...' : 'Select Files'}
                        </div>
                    </label>
                </div>
                {uploading && (
                    <div className="mt-4">
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                            <div className="bg-white h-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                        <p className="text-sm text-white/80 mt-2">Uploading files... Please wait.</p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0891b2] focus:border-transparent"
                    >
                        <option value="all">All Cases</option>
                        {cases.map((caseItem) => (
                            <option key={caseItem._id} value={caseItem._id}>
                                {caseItem.caseNumber} - {caseItem.caseName || caseItem.title}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        {documents.length} documents
                    </span>
                </div>
            </div>

            {/* Documents Grid */}
            {documents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <span className="material-icons text-6xl text-slate-300 mb-4">folder_open</span>
                    <p className="text-slate-500">No documents available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div key={doc._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-[#0891b2]/10 rounded-lg flex items-center justify-center group-hover:bg-[#0891b2] group-hover:text-white transition-colors">
                                    <span className="material-icons text-[#0891b2] group-hover:text-white">{getFileIcon(doc.fileType)}</span>
                                </div>
                                <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                    Shared
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-900 dark:text-white mb-2 truncate" title={doc.fileName}>
                                {doc.fileName}
                            </h3>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">folder</span>
                                    <span>{doc.case?.caseNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">person</span>
                                    <span>Shared by: {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">calendar_today</span>
                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="material-icons text-sm">storage</span>
                                    <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="flex-1 bg-[#0891b2]/10 text-[#0891b2] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#0891b2]/20 transition-colors flex items-center justify-center gap-1"
                                >
                                    <span className="material-icons text-sm">download</span>
                                    Download
                                </button>
                                <button
                                    onClick={() => handleDelete(doc._id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <span className="material-icons text-sm">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Guidelines */}
            <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-icons text-[#0891b2]">info</span>
                    Upload Guidelines
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
                        <span>Accepted formats: PDF, DOC, DOCX, JPG, PNG</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
                        <span>Files larger than 1MB are automatically compressed for OCR processing</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
                        <span>All uploads are encrypted and HIPAA compliant</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-icons text-green-500 text-sm mt-0.5">check_circle</span>
                        <span>Documents are automatically indexed and searchable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDocuments;
