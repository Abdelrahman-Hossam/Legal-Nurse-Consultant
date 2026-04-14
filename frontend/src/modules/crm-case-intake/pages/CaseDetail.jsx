import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import caseService from '../../../services/case.service';
import caseAnalysisService from '../../../services/caseAnalysis.service';
import medicalRecordService from '../../../services/medicalRecord.service';
import noteService from '../../../services/note.service';
import taskService from '../../../services/task.service';
import timelineService from '../../../services/timeline.service';
import damagesService from '../../damages-tracking/services/damages.service';
import CreateTaskModal from '../../task-workflow/components/CreateTaskModal';

const CaseDetail = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const isStaff = pathname.startsWith('/staff');
    const dashboardPath = isStaff ? '/staff-dashboard' : '/dashboard';
    const casesListPath = isStaff ? '/staff/cases' : '/cases';
    const [activeTab, setActiveTab] = useState('overview');
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Tab data states
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [damages, setDamages] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    // Timeline Modal
    const [showAddTimelineEvent, setShowAddTimelineEvent] = useState(false);

    // OCR View Modal
    const [viewOCRModal, setViewOCRModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [ocrText, setOcrText] = useState('');

    // Medical Records Modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({
        file: null,
        fileName: '',
        documentType: 'medical-record',
        provider: '',
        recordDate: '',
        notes: ''
    });
    const [uploading, setUploading] = useState(false);

    // Task Modal
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Note Modal
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteData, setNoteData] = useState({
        title: '',
        content: '',
        tags: []
    });

    // Damages Modal
    const [showDamagesModal, setShowDamagesModal] = useState(false);
    const [damagesData, setDamagesData] = useState({
        category: 'economic',
        type: '',
        description: '',
        amount: '',
        dateIncurred: new Date().toISOString().split('T')[0],
        status: 'estimated',
        notes: ''
    });

    // Analysis Modal
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [analysisData, setAnalysisData] = useState({
        finding: '',
        category: 'deviation',
        severity: 'medium',
        evidence: ''
    });

    useEffect(() => {
        fetchCaseDetails();
    }, [id]);

    useEffect(() => {
        if (caseData && activeTab !== 'overview') {
            fetchTabData();
        }
    }, [activeTab, caseData]);

    const fetchTabData = async () => {
        if (!id) return;

        setTabLoading(true);
        try {
            switch (activeTab) {
                case 'records':
                    await fetchMedicalRecords();
                    break;
                case 'timeline':
                    await fetchTimeline();
                    break;
                case 'tasks':
                    await fetchTasks();
                    break;
                case 'notes':
                    await fetchNotes();
                    break;
                case 'damages':
                    await fetchDamages();
                    break;
                case 'analysis':
                    await fetchAnalysis();
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error fetching tab data:', error);
        } finally {
            setTabLoading(false);
        }
    };

    const fetchMedicalRecords = async () => {
        try {
            const response = await medicalRecordService.getRecordsByCase(id);
            setMedicalRecords(response.data?.records || response.records || []);
        } catch (error) {
            console.error('Failed to load medical records:', error);
            setMedicalRecords([]);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await taskService.getTasksByCase(id);
            // Backend returns array directly
            setTasks(Array.isArray(response) ? response : (response.data?.tasks || response.tasks || []));
        } catch (error) {
            console.error('Failed to load tasks:', error);
            setTasks([]);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await noteService.getByCase(id);
            // Backend returns { notes, stats }
            setNotes(response.data?.notes || response.notes || []);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setNotes([]);
        }
    };

    const fetchDamages = async () => {
        try {
            const response = await damagesService.getDamagesByCase(id);
            setDamages(response.data?.damages || response.damages || []);
        } catch (error) {
            console.error('Failed to load damages:', error);
            setDamages([]);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const response = await caseAnalysisService.getAnalysisByCase(id);
            setAnalysis(response.data || response);
        } catch (error) {
            console.error('Failed to load analysis:', error);
            setAnalysis(null);
        }
    };

    const fetchTimeline = async () => {
        try {
            const response = await timelineService.getTimelinesByCase(id);
            const timelines = response.data?.timelines || response.timelines || [];
            if (timelines.length > 0) {
                const tl = timelines[0];
                setTimeline(tl);
                setTimelineEvents(tl.events || []);
            } else {
                setTimeline(null);
                setTimelineEvents([]);
            }
        } catch (error) {
            console.error('Failed to load timeline:', error);
            setTimeline(null);
            setTimelineEvents([]);
        }
    };

    const fetchCaseDetails = async () => {
        try {
            setLoading(true);
            const response = await caseService.getCaseById(id);
            console.log('Case response:', response);
            // Backend returns { success: true, data: { case: caseData } }
            const data = response.data?.case || response.case || response.data || response;
            console.log('Extracted case data:', data);
            setCaseData(data);
        } catch (error) {
            console.error('Failed to load case:', error);
            alert('Failed to load case details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async () => {
        try {
            // Generate a comprehensive case report
            const reportData = {
                caseNumber: caseData.caseNumber,
                caseName: caseData.caseName,
                caseType: caseData.caseType,
                status: caseData.status,
                priority: caseData.priority,
                client: caseData.client?.fullName || 'N/A',
                lawFirm: caseData.lawFirm?.firmName || 'N/A',
                assignedConsultant: caseData.assignedConsultant?.fullName || 'N/A',
                incidentDate: caseData.incidentDate ? new Date(caseData.incidentDate).toLocaleDateString() : 'N/A',
                filingDate: caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString() : 'N/A',
                description: caseData.description || 'N/A',
                allegations: caseData.allegations || [],
                damages: caseData.damages || {},
                timeline: caseData.timeline || [],
                documents: caseData.documents || [],
                notes: caseData.notes || 'N/A',
                createdAt: new Date(caseData.createdAt).toLocaleDateString(),
                updatedAt: new Date(caseData.updatedAt).toLocaleDateString()
            };

            // Create a formatted text report
            let reportText = `CASE REPORT\n`;
            reportText += `${'='.repeat(80)}\n\n`;
            reportText += `Case Number: ${reportData.caseNumber}\n`;
            reportText += `Case Name: ${reportData.caseName}\n`;
            reportText += `Case Type: ${reportData.caseType}\n`;
            reportText += `Status: ${reportData.status}\n`;
            reportText += `Priority: ${reportData.priority}\n\n`;
            reportText += `CLIENT INFORMATION\n`;
            reportText += `${'-'.repeat(80)}\n`;
            reportText += `Client: ${reportData.client}\n`;
            reportText += `Law Firm: ${reportData.lawFirm}\n`;
            reportText += `Assigned Consultant: ${reportData.assignedConsultant}\n\n`;
            reportText += `CASE DETAILS\n`;
            reportText += `${'-'.repeat(80)}\n`;
            reportText += `Incident Date: ${reportData.incidentDate}\n`;
            reportText += `Filing Date: ${reportData.filingDate}\n`;
            reportText += `Description: ${reportData.description}\n\n`;

            if (reportData.allegations.length > 0) {
                reportText += `ALLEGATIONS\n`;
                reportText += `${'-'.repeat(80)}\n`;
                reportData.allegations.forEach((allegation, index) => {
                    reportText += `${index + 1}. ${allegation}\n`;
                });
                reportText += `\n`;
            }

            if (reportData.damages.economic || reportData.damages.nonEconomic || reportData.damages.punitive) {
                reportText += `DAMAGES\n`;
                reportText += `${'-'.repeat(80)}\n`;
                reportText += `Economic: $${reportData.damages.economic || 0}\n`;
                reportText += `Non-Economic: $${reportData.damages.nonEconomic || 0}\n`;
                reportText += `Punitive: $${reportData.damages.punitive || 0}\n\n`;
            }

            if (reportData.timeline.length > 0) {
                reportText += `TIMELINE\n`;
                reportText += `${'-'.repeat(80)}\n`;
                reportData.timeline.forEach((event, index) => {
                    reportText += `${index + 1}. ${new Date(event.date).toLocaleDateString()} - ${event.event}\n`;
                    if (event.description) reportText += `   ${event.description}\n`;
                });
                reportText += `\n`;
            }

            if (reportData.documents.length > 0) {
                reportText += `DOCUMENTS\n`;
                reportText += `${'-'.repeat(80)}\n`;
                reportData.documents.forEach((doc, index) => {
                    reportText += `${index + 1}. ${doc.name} (${doc.type})\n`;
                });
                reportText += `\n`;
            }

            reportText += `NOTES\n`;
            reportText += `${'-'.repeat(80)}\n`;
            reportText += `${reportData.notes}\n\n`;
            reportText += `Report Generated: ${new Date().toLocaleString()}\n`;

            // Create and download the file
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportData.caseNumber}_Report_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            alert('Report exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report: ' + error.message);
        }
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
                    case: id, // Use current case ID
                    fileName: uploadData.file.name,
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
                        documentType: 'medical-record',
                        provider: '',
                        recordDate: '',
                        notes: ''
                    });
                    alert('Record uploaded successfully! OCR processing has been initiated.');
                    // Refresh medical records
                    fetchMedicalRecords();
                    fetchCaseDetails();
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

    // Task handlers
    const handleCreateTask = async (taskData) => {
        try {
            await taskService.createTask({ ...taskData, case: id });
            alert('Task created successfully!');
            fetchTasks();
            fetchCaseDetails();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    // Note handlers
    const handleCreateNote = async (e) => {
        e.preventDefault();
        if (!noteData.title.trim() || !noteData.content.trim()) {
            alert('Please fill in title and content');
            return;
        }

        try {
            await noteService.create({
                case: id,
                title: noteData.title,
                content: noteData.content,
                tags: noteData.tags,
                type: 'general',
                priority: 'medium'
            });
            setShowNoteModal(false);
            setNoteData({ title: '', content: '', tags: [] });
            alert('Note created successfully!');
            fetchNotes();
            fetchCaseDetails();
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to create note. Please try again.');
        }
    };

    // Damages handlers
    const handleCreateDamage = async (e) => {
        e.preventDefault();
        if (!damagesData.description.trim() || !damagesData.amount) {
            alert('Please fill in description and amount');
            return;
        }

        try {
            await damagesService.createDamage({
                case: id,
                category: damagesData.category,
                type: damagesData.type,
                description: damagesData.description,
                amount: parseFloat(damagesData.amount) || 0,
                dateIncurred: damagesData.dateIncurred,
                status: damagesData.status,
                notes: damagesData.notes
            });
            setShowDamagesModal(false);
            setDamagesData({
                category: 'economic',
                type: '',
                description: '',
                amount: '',
                dateIncurred: new Date().toISOString().split('T')[0],
                status: 'estimated',
                notes: ''
            });
            alert('Damage entry created successfully!');
            fetchDamages();
            fetchCaseDetails();
        } catch (error) {
            console.error('Error creating damage:', error);
            alert('Failed to create damage entry. Please try again.');
        }
    };

    // Analysis handlers
    const handleCreateAnalysis = async (e) => {
        e.preventDefault();
        if (!analysisData.finding.trim()) {
            alert('Please enter a finding');
            return;
        }

        try {
            await caseAnalysisService.createAnalysis({
                caseId: id,
                breaches: [{
                    description: analysisData.finding,
                    severity: analysisData.severity,
                    impact: analysisData.evidence,
                    date: new Date().toISOString()
                }]
            });
            setShowAnalysisModal(false);
            setAnalysisData({ finding: '', category: 'deviation', severity: 'medium', evidence: '' });
            alert('Analysis finding created successfully!');
            fetchAnalysis();
            fetchCaseDetails();
        } catch (error) {
            console.error('Error creating analysis:', error);
            alert('Failed to create analysis. Please try again.');
        }
    };

    // Timeline handlers
    const handleAddTimelineEvent = async (eventData) => {
        try {
            if (!timeline) {
                // Create timeline first
                const tlResponse = await timelineService.createTimeline({
                    case: id,
                    title: 'Medical Timeline',
                    status: 'in-progress'
                });
                setTimeline(tlResponse.data.timeline);

                // Then add event
                await timelineService.addEvent(tlResponse.data.timeline._id, eventData);
            } else {
                await timelineService.addEvent(timeline._id, eventData);
            }

            fetchTimeline();
            setShowAddTimelineEvent(false);
            alert('Event added successfully');
        } catch (error) {
            console.error('Error adding timeline event:', error);
            alert('Failed to add event. Please try again.');
        }
    };

    // Medical Record handlers
    const handleViewRecord = async (record) => {
        try {
            // Fetch full record with OCR text
            const response = await medicalRecordService.getRecordById(record._id);
            const fullRecord = response.data?.record || response.record || response.data || response;

            setSelectedRecord(fullRecord);
            setOcrText(fullRecord.ocrText || 'No OCR text available');
            setViewOCRModal(true);
        } catch (error) {
            console.error('Error viewing record:', error);
            alert('Failed to view record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDownloadRecord = async (record) => {
        try {
            const response = await medicalRecordService.downloadRecord(record._id);

            if (response.data?.fileData) {
                // Convert base64 to blob and download
                let base64Data = response.data.fileData;

                // Remove data URL prefix if present
                if (base64Data.includes(',')) {
                    base64Data = base64Data.split(',')[1];
                }

                const mimeType = response.data.fileType || record.mimeType || 'application/octet-stream';
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = response.data.fileName || record.fileName || 'download';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (response.data?.fileUrl) {
                window.open(response.data.fileUrl, '_blank');
            } else {
                alert('File not available for download');
            }
        } catch (error) {
            console.error('Error downloading record:', error);
            alert('Failed to download record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleGenerateTimeline = async () => {
        try {
            if (!caseData.timeline || caseData.timeline.length === 0) {
                alert('No timeline events found for this case. Add timeline events first.');
                return;
            }

            // Sort timeline events by date
            const sortedTimeline = [...caseData.timeline].sort((a, b) =>
                new Date(a.date) - new Date(b.date)
            );

            // Create timeline document
            let timelineText = `MEDICAL CHRONOLOGY TIMELINE\n`;
            timelineText += `${'='.repeat(80)}\n\n`;
            timelineText += `Case: ${caseData.caseNumber} - ${caseData.caseName}\n`;
            timelineText += `Client: ${caseData.client?.fullName || 'N/A'}\n`;
            timelineText += `Generated: ${new Date().toLocaleString()}\n\n`;
            timelineText += `TIMELINE OF EVENTS\n`;
            timelineText += `${'-'.repeat(80)}\n\n`;

            sortedTimeline.forEach((event, index) => {
                const eventDate = new Date(event.date);
                timelineText += `${index + 1}. ${eventDate.toLocaleDateString()} - ${eventDate.toLocaleTimeString()}\n`;
                timelineText += `   Event: ${event.event}\n`;
                if (event.description) {
                    timelineText += `   Description: ${event.description}\n`;
                }
                if (event.createdBy?.fullName) {
                    timelineText += `   Documented by: ${event.createdBy.fullName}\n`;
                }
                timelineText += `\n`;
            });

            timelineText += `${'-'.repeat(80)}\n`;
            timelineText += `Total Events: ${sortedTimeline.length}\n`;
            timelineText += `Date Range: ${new Date(sortedTimeline[0].date).toLocaleDateString()} to ${new Date(sortedTimeline[sortedTimeline.length - 1].date).toLocaleDateString()}\n`;

            // Create and download the file
            const blob = new Blob([timelineText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${caseData.caseNumber}_Timeline_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            alert('Timeline generated successfully!');
        } catch (error) {
            console.error('Timeline generation error:', error);
            alert('Failed to generate timeline: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0891b2] mx-auto"></div>
                    <p className="mt-4 text-slate-500">Loading case details...</p>
                </div>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Case not found</p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'records', label: 'Medical Records', icon: 'folder' },
        { id: 'timeline', label: 'Timeline', icon: 'timeline' },
        { id: 'analysis', label: 'Analysis', icon: 'analytics' },
        { id: 'damages', label: 'Damages', icon: 'assessment' },
        { id: 'tasks', label: 'Tasks', icon: 'assignment' },
        { id: 'notes', label: 'Notes', icon: 'note' },
    ];

    return (
        <div>
            <header className="bg-white dark:bg-slate-900 border-b border-[#1f3b61]/10 -mx-8 -mt-8 mb-8 px-8 py-4">
                <nav className="flex text-xs text-[#1f3b61]/60 mb-2">
                    <Link to={dashboardPath}>Dashboard</Link>
                    <span className="material-icons text-xs mx-1">chevron_right</span>
                    <Link to={casesListPath}>Cases</Link>
                    <span className="material-icons text-xs mx-1">chevron_right</span>
                    <span className="font-medium text-[#1f3b61]">{id}</span>
                </nav>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1f3b61] dark:text-white">{caseData.title}</h1>
                        <p className="text-sm text-slate-500 mt-1">{caseData.caseType} • Created {new Date(caseData.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportReport}
                            className="px-4 py-2 border-2 border-[#1f3b61] text-[#1f3b61] rounded-lg font-medium hover:bg-[#1f3b61]/5 transition-colors"
                        >
                            Export Report
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-[#1f3b61] text-[#1f3b61]'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <span className="material-icons text-sm">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="py-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold mb-4">Case Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Case Number</p>
                                        <p className="text-sm font-semibold mt-1">{caseData.caseNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${caseData.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                            caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                caseData.status === 'closed' ? 'bg-slate-100 text-slate-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>{caseData.status}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Client</p>
                                        <p className="text-sm font-semibold mt-1">{caseData.client?.fullName || caseData.client?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Law Firm</p>
                                        <p className="text-sm font-semibold mt-1">{caseData.lawFirm?.firmName || caseData.lawFirm?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold mb-4">Assigned Team</h3>
                                <div className="space-y-3">
                                    {caseData.assignedTo && caseData.assignedTo.length > 0 ? (
                                        caseData.assignedTo.map((member, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#1f3b61]/10 flex items-center justify-center">
                                                    <span className="material-icons text-[#1f3b61]">person</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{member.name || member.email || 'Team Member'}</p>
                                                    <p className="text-xs text-slate-500">{member.role || 'Staff'}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No team members assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'records' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Medical Records</h3>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">upload_file</span>
                                Upload Record
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : medicalRecords.length > 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">File Name</th>
                                                <th className="px-6 py-3 text-left">Type</th>
                                                <th className="px-6 py-3 text-left">Provider</th>
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {medicalRecords.map((record) => (
                                                <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-icons text-slate-400 text-sm">description</span>
                                                            <span className="text-sm font-medium">{record.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm capitalize">{record.documentType || record.fileType}</td>
                                                    <td className="px-6 py-4 text-sm">{record.provider?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : new Date(record.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${record.ocrStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                            record.ocrStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                                                record.ocrStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {record.ocrStatus || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewRecord(record)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                                title="View"
                                                            >
                                                                <span className="material-icons text-slate-400 hover:text-[#0891b2] text-lg">visibility</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadRecord(record)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                                title="Download"
                                                            >
                                                                <span className="material-icons text-slate-400 hover:text-[#0891b2] text-lg">download</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No medical records found. Upload a record to get started.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'timeline' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Timeline</h3>
                            <button
                                onClick={() => setShowAddTimelineEvent(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Event
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : timelineEvents.length > 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6">
                                <div className="relative space-y-4">
                                    {timelineEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map((event, idx) => (
                                        <div key={event._id || idx} className="relative pl-8 pb-8 border-l-4 border-[#0891b2] last:pb-0">
                                            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#0891b2] border-4 border-white dark:border-slate-900"></div>
                                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 ml-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${event.category === 'treatment' ? 'bg-blue-100 text-blue-800' :
                                                                event.category === 'medication' ? 'bg-purple-100 text-purple-800' :
                                                                    event.category === 'lab' ? 'bg-green-100 text-green-800' :
                                                                        event.category === 'imaging' ? 'bg-yellow-100 text-yellow-800' :
                                                                            event.category === 'consultation' ? 'bg-pink-100 text-pink-800' :
                                                                                event.category === 'procedure' ? 'bg-red-100 text-red-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {event.category}
                                                            </span>
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {new Date(event.date).toLocaleDateString()}
                                                                {event.time && ` at ${event.time}`}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                        {event.description && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.description}</p>
                                                        )}
                                                        {(event.provider?.name || event.provider?.facility) && (
                                                            <div className="mt-2 text-xs text-slate-500">
                                                                {event.provider.name && <span>Provider: {event.provider.name}</span>}
                                                                {event.provider.facility && <span> • Facility: {event.provider.facility}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-12">
                                <div className="text-center text-slate-500">
                                    <span className="material-icons text-6xl text-slate-300 mb-4">timeline</span>
                                    <p>No timeline events yet. Add an event to get started.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'analysis' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Case Analysis</h3>
                            <button
                                onClick={() => setShowAnalysisModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Finding
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : analysis && (analysis.standardsOfCare?.length > 0 || analysis.breaches?.length > 0) ? (
                            <div className="space-y-6">
                                {analysis.breaches && analysis.breaches.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-bold mb-4">Identified Deviations</h4>
                                        <div className="space-y-3">
                                            {analysis.breaches.map((breach, idx) => (
                                                <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{breach.description}</h5>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${breach.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                            breach.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {breach.severity} Impact
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{breach.impact}</p>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        {new Date(breach.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {analysis.standardsOfCare && analysis.standardsOfCare.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-bold mb-4">Standards of Care</h4>
                                        <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left">Category</th>
                                                            <th className="px-6 py-3 text-left">Standard</th>
                                                            <th className="px-6 py-3 text-left">Assessment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {analysis.standardsOfCare.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-semibold">{item.category}</td>
                                                                <td className="px-6 py-4 text-sm">{item.standard}</td>
                                                                <td className="px-6 py-4 text-sm">{item.assessment}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No analysis findings yet. Add a finding to get started.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'damages' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Damages Tracking</h3>
                            <button
                                onClick={() => setShowDamagesModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Damage
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : damages.length > 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Category</th>
                                                <th className="px-6 py-3 text-left">Description</th>
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Amount</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {damages.map((item) => (
                                                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-semibold capitalize">{item.category}</span>
                                                        {item.type && <p className="text-xs text-slate-500">{item.type}</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{item.description}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {item.dateIncurred ? new Date(item.dateIncurred).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold">${(item.amount || 0).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${item.status === 'verified' ? 'bg-green-100 text-green-700' :
                                                            item.status === 'documented' ? 'bg-blue-100 text-blue-700' :
                                                                item.status === 'estimated' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No damages recorded yet. Add a damage entry to get started.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'tasks' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks</h3>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Create Task
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : tasks.length > 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Task</th>
                                                <th className="px-6 py-3 text-left">Assigned To</th>
                                                <th className="px-6 py-3 text-left">Due Date</th>
                                                <th className="px-6 py-3 text-left">Priority</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {tasks.map((task) => (
                                                <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold">{task.title}</div>
                                                        <div className="text-xs text-slate-500">{task.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{task.assignedTo?.name || task.assignedTo?.email || 'Unassigned'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No tasks found. Create a task to get started.
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'notes' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h3>
                            <button
                                onClick={() => setShowNoteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Note
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                            </div>
                        ) : notes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {notes.map((note) => (
                                    <div key={note._id} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span>{note.createdBy?.name || note.createdBy?.email || 'Unknown'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {note.tags && note.tags.length > 0 && (
                                                <div className="flex gap-1">
                                                    {note.tags.map((tag, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-[#0891b2]/10 text-[#0891b2] rounded text-xs font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No notes found. Add a note to get started.
                            </div>
                        )}
                    </div>
                )}
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
                                    disabled={uploading || !uploadData.file}
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

            {/* Task Modal */}
            <CreateTaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onTaskCreated={handleCreateTask}
            />

            {/* Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Note</h2>
                                <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateNote} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={noteData.title}
                                    onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="Note title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Content *</label>
                                <textarea
                                    required
                                    value={noteData.content}
                                    onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="4"
                                    placeholder="Write your note here..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors">
                                    Add Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Damages Modal */}
            {showDamagesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Damage Entry</h2>
                                <button onClick={() => setShowDamagesModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateDamage} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category *</label>
                                    <select
                                        required
                                        value={damagesData.category}
                                        onChange={(e) => setDamagesData({ ...damagesData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="economic">Economic</option>
                                        <option value="non-economic">Non-Economic</option>
                                        <option value="punitive">Punitive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Type *</label>
                                    <input
                                        type="text"
                                        required
                                        value={damagesData.type}
                                        onChange={(e) => setDamagesData({ ...damagesData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                        placeholder="e.g., Medical Bills, Lost Wages"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    required
                                    value={damagesData.description}
                                    onChange={(e) => setDamagesData({ ...damagesData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="3"
                                    placeholder="Describe the damage or injury..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Amount ($) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={damagesData.amount}
                                        onChange={(e) => setDamagesData({ ...damagesData, amount: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date Incurred *</label>
                                    <input
                                        type="date"
                                        required
                                        value={damagesData.dateIncurred}
                                        onChange={(e) => setDamagesData({ ...damagesData, dateIncurred: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Status *</label>
                                <select
                                    required
                                    value={damagesData.status}
                                    onChange={(e) => setDamagesData({ ...damagesData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="estimated">Estimated</option>
                                    <option value="documented">Documented</option>
                                    <option value="verified">Verified</option>
                                    <option value="disputed">Disputed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notes</label>
                                <textarea
                                    value={damagesData.notes}
                                    onChange={(e) => setDamagesData({ ...damagesData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="2"
                                    placeholder="Additional notes or documentation references..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowDamagesModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors">
                                    Add Damage
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Analysis Modal */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Analysis Finding</h2>
                                <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCreateAnalysis} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Finding *</label>
                                <textarea
                                    required
                                    value={analysisData.finding}
                                    onChange={(e) => setAnalysisData({ ...analysisData, finding: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="3"
                                    placeholder="Describe the finding..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Category *</label>
                                    <select
                                        required
                                        value={analysisData.category}
                                        onChange={(e) => setAnalysisData({ ...analysisData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="deviation">Deviation from Standard</option>
                                        <option value="causation">Causation</option>
                                        <option value="documentation">Documentation Issue</option>
                                        <option value="timeline">Timeline Discrepancy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Severity *</label>
                                    <select
                                        required
                                        value={analysisData.severity}
                                        onChange={(e) => setAnalysisData({ ...analysisData, severity: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Evidence</label>
                                <textarea
                                    value={analysisData.evidence}
                                    onChange={(e) => setAnalysisData({ ...analysisData, evidence: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="2"
                                    placeholder="Supporting evidence..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAnalysisModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors">
                                    Add Finding
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Add Timeline Event Modal */}
            {showAddTimelineEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Timeline Event</h2>
                                <button onClick={() => setShowAddTimelineEvent(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleAddTimelineEvent({
                                date: formData.get('date'),
                                time: formData.get('time'),
                                category: formData.get('category'),
                                title: formData.get('title'),
                                description: formData.get('description'),
                                provider: {
                                    name: formData.get('providerName'),
                                    facility: formData.get('facility')
                                }
                            });
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date *</label>
                                    <input type="date" name="date" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Time</label>
                                    <input type="time" name="time" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category *</label>
                                <select name="category" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white">
                                    <option value="">Select Category</option>
                                    <option value="treatment">Treatment</option>
                                    <option value="medication">Medication</option>
                                    <option value="lab">Lab</option>
                                    <option value="imaging">Imaging</option>
                                    <option value="consultation">Consultation</option>
                                    <option value="procedure">Procedure</option>
                                    <option value="symptom">Symptom</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Title *</label>
                                <input type="text" name="title" required placeholder="Event Title" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea name="description" placeholder="Description" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" rows="3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Provider Name</label>
                                <input type="text" name="providerName" placeholder="Provider Name" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Facility</label>
                                <input type="text" name="facility" placeholder="Facility" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0891b2] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddTimelineEvent(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700 transition-colors">
                                    Add Event
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
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="material-icons text-slate-500">close</span>
                            </button>
                        </div>
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
                                            Processed: {new Date(selectedRecord.ocrProcessedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                                    {ocrText}
                                </pre>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => handleDownloadRecord(selectedRecord)}
                                className="flex-1 px-4 py-2.5 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                                <span className="material-icons text-sm">download</span>
                                Download File
                            </button>
                            <button
                                onClick={() => {
                                    setViewOCRModal(false);
                                    setSelectedRecord(null);
                                    setOcrText('');
                                }}
                                className="flex-1 px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseDetail;
