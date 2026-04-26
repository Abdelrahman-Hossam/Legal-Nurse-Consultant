import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import authService from '../../../services/auth.service';
import caseService from '../../../services/case.service';
import userService from '../../../services/user.service';
import caseAnalysisService from '../../../services/caseAnalysis.service';
import medicalRecordService from '../../../services/medicalRecord.service';
import noteService from '../../../services/note.service';
import taskService from '../../../services/task.service';
import timelineService from '../../../services/timeline.service';
import damagesService from '../../damages-tracking/services/damages.service';
import CreateTaskModal from '../../task-workflow/components/CreateTaskModal';

/** DD/MM/YYYY for case and medical chronology (avoids US-style M/D/YYYY from default locale). */
const formatDateDMY = (dateLike) => {
    if (dateLike == null || dateLike === '') return '';
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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
    const [extractedEvents, setExtractedEvents] = useState([]);
    const [timelineStats, setTimelineStats] = useState({
        total: 0, manual: 0, extracted: 0, verified: 0, dismissed: 0
    });
    const [timelineFilter, setTimelineFilter] = useState('all'); // all | manual | medical | verified | dismissed
    const [timelineActionKey, setTimelineActionKey] = useState(null);
    const [tabLoading, setTabLoading] = useState(false);

    // Scan Records (per-record extraction) modal
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanStep, setScanStep] = useState('pickRecord'); // pickRecord | reviewCandidates
    const [scanRecordInfo, setScanRecordInfo] = useState(null);
    const [scanCandidates, setScanCandidates] = useState([]);
    const [scanSelectedKeys, setScanSelectedKeys] = useState(new Set());
    const [scanLoading, setScanLoading] = useState(false);
    const [scanSaving, setScanSaving] = useState(false);
    const [scanError, setScanError] = useState('');
    const [editingCandidateKey, setEditingCandidateKey] = useState(null);
    const [editingForm, setEditingForm] = useState({ title: '', category: 'other', excerpt: '' });

    // Inline edit (in the unified timeline list, before clicking "Add to Timeline")
    const [editingExtractedKey, setEditingExtractedKey] = useState(null);
    const [editingExtractedForm, setEditingExtractedForm] = useState({ title: '', category: 'other', excerpt: '' });

    const TIMELINE_CATEGORY_OPTIONS = [
        'treatment', 'medication', 'lab', 'imaging', 'consultation',
        'procedure', 'symptom', 'other'
    ];

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

    // Assign consultant (admin / attorney)
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [consultantsList, setConsultantsList] = useState([]);
    const [loadingConsultants, setLoadingConsultants] = useState(false);
    const [assigningConsultantId, setAssigningConsultantId] = useState(null);
    const [statusSaving, setStatusSaving] = useState(false);
    const [ackLoading, setAckLoading] = useState(false);

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
            const response = await timelineService.getUnifiedCaseTimeline(id);
            const data = response.data || response;
            setTimeline(data.timeline || null);
            setTimelineEvents(data.events || []);
            setExtractedEvents(data.extractedEvents || []);
            setTimelineStats(data.stats || {
                total: 0, manual: 0, extracted: 0, verified: 0, dismissed: 0
            });
        } catch (error) {
            console.error('Failed to load timeline:', error);
            setTimeline(null);
            setTimelineEvents([]);
            setExtractedEvents([]);
            setTimelineStats({ total: 0, manual: 0, extracted: 0, verified: 0, dismissed: 0 });
        }
    };

    const applyUnifiedTimelineResponse = (response) => {
        const data = response?.data || response;
        if (!data) return;
        if (data.events) setTimelineEvents(data.events);
        if (data.extractedEvents) setExtractedEvents(data.extractedEvents);
        if (data.stats) setTimelineStats(data.stats);
    };

    const handleDismissExtracted = async (eventKey) => {
        if (!eventKey) return;
        try {
            setTimelineActionKey(eventKey);
            const response = await timelineService.dismissExtractedEvent(id, eventKey);
            applyUnifiedTimelineResponse(response);
        } catch (error) {
            console.error('Failed to dismiss extracted event:', error);
            alert('Failed to dismiss event: ' + (error.response?.data?.message || error.message));
        } finally {
            setTimelineActionKey(null);
        }
    };

    const handleRestoreExtracted = async (eventKey) => {
        if (!eventKey) return;
        try {
            setTimelineActionKey(eventKey);
            const response = await timelineService.restoreExtractedEvent(id, eventKey);
            applyUnifiedTimelineResponse(response);
        } catch (error) {
            console.error('Failed to restore extracted event:', error);
            alert('Failed to restore event: ' + (error.response?.data?.message || error.message));
        } finally {
            setTimelineActionKey(null);
        }
    };

    const handlePromoteExtracted = async (event) => {
        if (!event) return;
        try {
            setTimelineActionKey(event.key);
            const response = await timelineService.promoteExtractedEvent(
                id,
                { ...event, eventSource: 'medical_record' },
                true
            );
            applyUnifiedTimelineResponse(response);
        } catch (error) {
            console.error('Failed to add extracted event to timeline:', error);
            alert('Failed to add event: ' + (error.response?.data?.message || error.message));
        } finally {
            setTimelineActionKey(null);
        }
    };

    // ---- Inline edit on an extracted event in the unified timeline list ----
    const startEditExtracted = (event) => {
        if (!event) return;
        setEditingExtractedKey(event.key);
        setEditingExtractedForm({
            title: event.title || '',
            category: TIMELINE_CATEGORY_OPTIONS.includes(event.category) ? event.category : 'other',
            excerpt: event.excerpt || ''
        });
    };

    const cancelEditExtracted = () => {
        setEditingExtractedKey(null);
        setEditingExtractedForm({ title: '', category: 'other', excerpt: '' });
    };

    const saveAndAddExtracted = async (originalEvent) => {
        if (!originalEvent || !editingExtractedKey) return;
        const trimmedTitle = (editingExtractedForm.title || '').trim();
        if (!trimmedTitle) {
            alert('Title cannot be empty.');
            return;
        }
        const editedEvent = {
            ...originalEvent,
            title: trimmedTitle,
            category: editingExtractedForm.category || 'other',
            excerpt: (editingExtractedForm.excerpt || '').trim(),
            eventSource: 'medical_record_edited'
        };
        try {
            setTimelineActionKey(originalEvent.key);
            const response = await timelineService.promoteExtractedEvent(id, editedEvent, true);
            applyUnifiedTimelineResponse(response);
            cancelEditExtracted();
        } catch (error) {
            console.error('Failed to save edited extracted event:', error);
            alert('Failed to save: ' + (error.response?.data?.message || error.message));
        } finally {
            setTimelineActionKey(null);
        }
    };

    // ---- Scan Records flow (explicit per-record extraction) ----
    const openScanModal = async () => {
        setScanStep('pickRecord');
        setScanRecordInfo(null);
        setScanCandidates([]);
        setScanSelectedKeys(new Set());
        setScanError('');
        setShowScanModal(true);
        try {
            await fetchMedicalRecords();
        } catch (err) {
            console.warn('Could not refresh medical records before scan', err);
        }
    };

    const closeScanModal = () => {
        setShowScanModal(false);
        setScanStep('pickRecord');
        setScanRecordInfo(null);
        setScanCandidates([]);
        setScanSelectedKeys(new Set());
        setScanError('');
        setScanLoading(false);
        setScanSaving(false);
        setEditingCandidateKey(null);
        setEditingForm({ title: '', category: 'other', excerpt: '' });
    };

    const handlePickRecordToScan = async (recordId) => {
        if (!recordId) return;
        setScanLoading(true);
        setScanError('');
        try {
            const response = await timelineService.scanRecord(id, recordId);
            const data = response.data || response;
            setScanRecordInfo(data.record || null);
            const fresh = (data.candidates || []).filter((c) => !c.isDismissed);
            setScanCandidates(fresh);
            setScanSelectedKeys(new Set(fresh.map((c) => c.key)));
            setScanStep('reviewCandidates');
        } catch (error) {
            console.error('Failed to scan record:', error);
            setScanError(error.response?.data?.message || error.message || 'Failed to scan record');
        } finally {
            setScanLoading(false);
        }
    };

    const toggleScanSelection = (key) => {
        setScanSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const setAllScanSelections = (selectAll) => {
        if (selectAll) {
            setScanSelectedKeys(new Set(scanCandidates.map((c) => c.key)));
        } else {
            setScanSelectedKeys(new Set());
        }
    };

    const handleBackToRecordList = () => {
        setScanStep('pickRecord');
        setScanRecordInfo(null);
        setScanCandidates([]);
        setScanSelectedKeys(new Set());
        setScanError('');
        setEditingCandidateKey(null);
        setEditingForm({ title: '', category: 'other', excerpt: '' });
    };

    const handleSaveScannedEvents = async () => {
        const selected = scanCandidates.filter((c) => scanSelectedKeys.has(c.key));
        if (selected.length === 0) {
            setScanError('Pick at least one date to add to the timeline.');
            return;
        }
        setScanSaving(true);
        setScanError('');
        try {
            const payload = selected.map((c) => ({
                ...c,
                eventSource: c.scanEdited ? 'medical_record_edited' : 'medical_record'
            }));
            const response = await timelineService.promoteExtractedEventsBulk(id, payload, true);
            applyUnifiedTimelineResponse(response);
            await fetchTimeline();
            closeScanModal();
        } catch (error) {
            console.error('Failed to save scanned events:', error);
            setScanError(error.response?.data?.message || error.message || 'Failed to save events');
        } finally {
            setScanSaving(false);
        }
    };

    const startEditCandidate = (candidate) => {
        if (!candidate) return;
        setEditingCandidateKey(candidate.key);
        setEditingForm({
            title: candidate.title || '',
            category: TIMELINE_CATEGORY_OPTIONS.includes(candidate.category)
                ? candidate.category
                : 'other',
            excerpt: candidate.excerpt || ''
        });
    };

    const cancelEditCandidate = () => {
        setEditingCandidateKey(null);
        setEditingForm({ title: '', category: 'other', excerpt: '' });
    };

    const saveEditCandidate = () => {
        if (!editingCandidateKey) return;
        const trimmedTitle = (editingForm.title || '').trim();
        if (!trimmedTitle) {
            setScanError('Title cannot be empty.');
            return;
        }
        setScanCandidates((prev) => prev.map((c) =>
            c.key === editingCandidateKey
                ? {
                    ...c,
                    title: trimmedTitle,
                    category: editingForm.category || 'other',
                    excerpt: (editingForm.excerpt || '').trim()
                }
                : c
        ));
        setScanSelectedKeys((prev) => {
            const next = new Set(prev);
            next.add(editingCandidateKey);
            return next;
        });
        setScanError('');
        cancelEditCandidate();
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

    const currentUser = authService.getUser();
    const canAssignConsultant =
        currentUser && (currentUser.role === 'admin' || currentUser.role === 'attorney');

    const openAssignModal = async () => {
        setShowAssignModal(true);
        setLoadingConsultants(true);
        try {
            const res = await userService.getAllUsers({ role: 'consultant', limit: 200 });
            setConsultantsList(res.data?.users || []);
        } catch (e) {
            console.error(e);
            alert('Could not load consultants');
            setConsultantsList([]);
        } finally {
            setLoadingConsultants(false);
        }
    };

    const handleAssignConsultant = async (consultantUserId) => {
        if (!id) return;
        setAssigningConsultantId(consultantUserId);
        try {
            await caseService.updateCase(id, { assignedConsultant: consultantUserId });
            await fetchCaseDetails();
            setShowAssignModal(false);
            window.dispatchEvent(new Event('lnc:notifications'));
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || 'Failed to assign consultant');
        } finally {
            setAssigningConsultantId(null);
        }
    };

    const handleStatusChange = async (e) => {
        const v = e.target.value;
        if (!id || !caseData || v === caseData.status) return;
        try {
            setStatusSaving(true);
            await caseService.updateCase(id, { status: v });
            await fetchCaseDetails();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setStatusSaving(false);
        }
    };

    const handleAcknowledge = async () => {
        if (!id) return;
        try {
            setAckLoading(true);
            await caseService.acknowledgeCase(id);
            await fetchCaseDetails();
            window.dispatchEvent(new Event('lnc:notifications'));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to acknowledge case');
        } finally {
            setAckLoading(false);
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
                incidentDate: caseData.incidentDate ? formatDateDMY(caseData.incidentDate) : 'N/A',
                filingDate: caseData.filingDate ? formatDateDMY(caseData.filingDate) : 'N/A',
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
                    reportText += `${index + 1}. ${formatDateDMY(event.date)} - ${event.event}\n`;
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
            window.dispatchEvent(new Event('lnc:notifications'));
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
            let timelineId = timeline?._id;
            if (!timelineId) {
                const tlResponse = await timelineService.createTimeline({
                    case: id,
                    title: 'Case Timeline',
                    status: 'in-progress'
                });
                timelineId = tlResponse.data?.timeline?._id || tlResponse.timeline?._id;
            }

            await timelineService.addEvent(timelineId, eventData);

            await fetchTimeline();
            setShowAddTimelineEvent(false);
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
                timelineText += `${index + 1}. ${formatDateDMY(eventDate)} - ${eventDate.toLocaleTimeString()}\n`;
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
            timelineText += `Date Range: ${formatDateDMY(sortedTimeline[0].date)} to ${formatDateDMY(sortedTimeline[sortedTimeline.length - 1].date)}\n`;

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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#801829] mx-auto"></div>
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

    const userId = currentUser?._id ?? currentUser?.id;
    const assignedRaw = caseData.assignedConsultant;
    const assignedId = assignedRaw?._id ?? assignedRaw;
    const isAssignedConsultant =
        userId && assignedId && String(assignedId) === String(userId);

    const showAcknowledge =
        currentUser?.role === 'consultant' && isAssignedConsultant && caseData.status === 'intake';

    const canEditStatus =
        currentUser &&
        (['admin', 'attorney'].includes(currentUser.role) ||
            (currentUser.role === 'consultant' && isAssignedConsultant));

    const consultantIntakeOnly =
        currentUser?.role === 'consultant' && isAssignedConsultant && caseData.status === 'intake';

    const statusSelectOptions =
        currentUser?.role === 'consultant'
            ? ['review', 'active', 'pending', 'closed']
            : ['intake', 'review', 'active', 'pending', 'closed', 'archived'];

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
            <header className="bg-[#f3efe5] dark:bg-slate-900 border-b border-[#1f3b61]/10 -mx-8 -mt-8 mb-8 px-8 py-4">
                <nav className="flex text-xs text-[#1f3b61]/60 mb-2">
                    <Link to={dashboardPath}>Dashboard</Link>
                    <span className="material-icons text-xs mx-1">chevron_right</span>
                    <Link to={casesListPath}>Cases</Link>
                    <span className="material-icons text-xs mx-1">chevron_right</span>
                    <span className="font-medium text-[#1f3b61]">{id}</span>
                </nav>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1f3b61] dark:text-white">{caseData.caseName || caseData.title}</h1>
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
            <div className="border-b border-slate-200 dark:border-slate-800 mb-6 bg-[#e4dace] dark:bg-slate-900 rounded-xl px-4">
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
                            <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold mb-4">Case Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Case Number</p>
                                        <p className="text-sm font-semibold mt-1">{caseData.caseNumber}</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Status</p>
                                        {canEditStatus && !consultantIntakeOnly ? (
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                <select
                                                    value={caseData.status}
                                                    onChange={handleStatusChange}
                                                    disabled={statusSaving}
                                                    className="text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-w-[10rem]"
                                                >
                                                    {statusSelectOptions.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="material-icons text-[18px] text-slate-400" title="Edit status">
                                                    edit
                                                </span>
                                                {statusSaving && (
                                                    <span className="text-xs text-slate-500">Saving…</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${caseData.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                                    caseData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        caseData.status === 'closed' || caseData.status === 'archived'
                                                            ? 'bg-slate-100 text-slate-800'
                                                            : caseData.status === 'intake'
                                                              ? 'bg-slate-200 text-slate-700'
                                                              : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {caseData.status}
                                            </span>
                                        )}
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
                            <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <h3 className="text-lg font-bold">Assigned consultant</h3>
                                    {canAssignConsultant && (
                                        <button
                                            type="button"
                                            onClick={openAssignModal}
                                            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1f3b61] text-white hover:bg-[#152a47] transition-colors"
                                        >
                                            Assign to…
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {caseData.assignedConsultant ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#1f3b61]/10 flex items-center justify-center">
                                                <span className="material-icons text-[#1f3b61]">person</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    {caseData.assignedConsultant.fullName ||
                                                        caseData.assignedConsultant.name ||
                                                        'Consultant'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {caseData.assignedConsultant.email || 'Consultant'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No consultant assigned yet.
                                            {canAssignConsultant && ' Use Assign to… to choose a consultant.'}
                                        </p>
                                    )}
                                    {showAcknowledge && (
                                        <button
                                            type="button"
                                            onClick={handleAcknowledge}
                                            disabled={ackLoading}
                                            className="mt-4 w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                                        >
                                            {ackLoading ? 'Acknowledging…' : 'Acknowledge case'}
                                        </button>
                                    )}
                                    {showAcknowledge && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Confirms you have received this case. Status will move from intake to
                                            review.
                                        </p>
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
                                className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                            >
                                <span className="material-icons text-sm">upload_file</span>
                                Upload Record
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                            </div>
                        ) : medicalRecords.length > 0 ? (
                            <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#e4dace] dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-500 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">File Name</th>
                                                <th className="px-6 py-3 text-left">Type</th>
                                                <th className="px-6 py-3 text-left">Provider</th>
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[#f3efe5] dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                            {medicalRecords.map((record) => (
                                                <tr key={record._id} className="hover:bg-[#f3efe5] dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-icons text-slate-400 text-sm">description</span>
                                                            <span className="text-sm font-medium">{record.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm capitalize">{record.documentType || record.fileType}</td>
                                                    <td className="px-6 py-4 text-sm">{record.provider?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {record.recordDate ? formatDateDMY(record.recordDate) : formatDateDMY(record.createdAt)}
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
                                                                <span className="material-icons text-slate-400 hover:text-[#801829] text-lg">visibility</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadRecord(record)}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                                title="Download"
                                                            >
                                                                <span className="material-icons text-slate-400 hover:text-[#801829] text-lg">download</span>
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
                {activeTab === 'timeline' && (() => {
                    const filteredVisible = timelineEvents.filter((e) => {
                        if (timelineFilter === 'manual') return e.sourceType === 'manual';
                        if (timelineFilter === 'medical') return e.sourceType === 'medical_record';
                        if (timelineFilter === 'verified') return e.isVerified;
                        return true;
                    });
                    const dismissedList = extractedEvents.filter((e) => e.isDismissed);
                    const showDismissed = timelineFilter === 'dismissed';
                    const categoryBadgeColor = (cat) => ({
                        treatment: 'bg-blue-100 text-blue-800',
                        medication: 'bg-purple-100 text-purple-800',
                        lab: 'bg-green-100 text-green-800',
                        imaging: 'bg-yellow-100 text-yellow-800',
                        consultation: 'bg-pink-100 text-pink-800',
                        procedure: 'bg-red-100 text-red-800',
                        admission: 'bg-indigo-100 text-indigo-800',
                        discharge: 'bg-teal-100 text-teal-800',
                        symptom: 'bg-orange-100 text-orange-800'
                    })[cat] || 'bg-gray-100 text-gray-800';
                    const confidenceBadgeColor = (c) => ({
                        verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        medium: 'bg-amber-50 text-amber-700 border-amber-200',
                        low: 'bg-slate-100 text-slate-600 border-slate-200'
                    })[c] || 'bg-slate-100 text-slate-600 border-slate-200';
                    const filterTabs = [
                        { id: 'all', label: 'All', count: timelineStats.total },
                        { id: 'medical', label: 'Medical Records', count: timelineStats.extracted },
                        { id: 'manual', label: 'Manual', count: timelineStats.manual },
                        { id: 'verified', label: 'Verified', count: timelineStats.verified ?? timelineStats.manual },
                        { id: 'dismissed', label: 'Dismissed', count: timelineStats.dismissed }
                    ];

                    return (
                        <div>
                            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Case Timeline</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Unified chronology built from manually added events and dates extracted from uploaded medical records.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openScanModal}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        title="Pick a medical record to scan for dates"
                                    >
                                        <span className="material-icons text-sm">document_scanner</span>
                                        Scan Records
                                    </button>
                                    <button
                                        onClick={() => fetchTimeline()}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        title="Refresh the unified timeline"
                                    >
                                        <span className="material-icons text-sm">autorenew</span>
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => setShowAddTimelineEvent(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                                    >
                                        <span className="material-icons text-sm">add</span>
                                        Add Event
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {filterTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTimelineFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${timelineFilter === tab.id
                                            ? 'bg-[#801829] text-white border-[#801829]'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-[#801829]'
                                            }`}
                                    >
                                        {tab.label}
                                        <span className={`ml-2 inline-flex items-center justify-center min-w-[1.25rem] px-1 rounded-full text-[10px] ${timelineFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {tabLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                                </div>
                            ) : showDismissed ? (
                                dismissedList.length > 0 ? (
                                    <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6 space-y-3">
                                        {dismissedList.map((event) => (
                                            <div key={event.key} className="bg-[#f3efe5] dark:bg-slate-800 rounded-lg p-4 flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${categoryBadgeColor(event.category)}`}>
                                                            {event.category}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            {formatDateDMY(event.eventDate)}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                    {event.excerpt && (
                                                        <p className="text-xs text-slate-500 italic mt-1">"{event.excerpt}"</p>
                                                    )}
                                                </div>
                                                <button
                                                    disabled={timelineActionKey === event.key}
                                                    onClick={() => handleRestoreExtracted(event.key)}
                                                    className="text-xs font-semibold text-[#801829] hover:underline whitespace-nowrap disabled:opacity-60"
                                                >
                                                    {timelineActionKey === event.key ? 'Restoring…' : 'Restore'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-12 text-center text-slate-500">
                                        No dismissed events.
                                    </div>
                                )
                            ) : filteredVisible.length > 0 ? (
                                <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-6">
                                    <div className="relative space-y-4">
                                        {filteredVisible.map((event, idx) => {
                                            const isMedicalLineage = event.sourceType === 'medical_record';
                                            const isPureManual = event.sourceType === 'manual';
                                            const isPendingExtract = isMedicalLineage && !event.isVerified;
                                            const dotClass = isMedicalLineage ? 'bg-amber-500' : 'bg-[#801829]';
                                            const lineClass = isMedicalLineage ? 'border-amber-300' : 'border-[#801829]';
                                            const isInlineEditing = isPendingExtract && editingExtractedKey === event.key;
                                            const sourceBadgeText = isPureManual
                                                ? 'Manual'
                                                : (event.eventSource === 'medical_record_edited'
                                                    ? 'Medical Record (edited)'
                                                    : 'Medical Record');
                                            const showSourceLine = isMedicalLineage && Boolean(event.sourceLabel);
                                            return (
                                                <div key={event.key || event.id || idx} className={`relative pl-8 pb-8 border-l-4 ${lineClass} last:pb-0`}>
                                                    <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${dotClass} border-4 border-white dark:border-slate-900`}></div>
                                                    <div className={`bg-[#f3efe5] dark:bg-slate-800 rounded-lg p-4 ml-4 hover:shadow-md transition-shadow ${isInlineEditing ? 'ring-2 ring-[#801829]' : ''}`}>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${categoryBadgeColor(event.category)}`}>
                                                                {event.category}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide ${isMedicalLineage ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#801829]/10 text-[#801829] border-[#801829]/20'}`}>
                                                                {sourceBadgeText}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${confidenceBadgeColor(event.confidence)}`}>
                                                                {event.confidence === 'verified' ? 'Verified' : `${event.confidence} confidence`}
                                                            </span>
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {formatDateDMY(event.eventDate)}
                                                                {event.time && ` at ${event.time}`}
                                                            </span>
                                                        </div>

                                                        {isInlineEditing ? (
                                                            <div className="space-y-3 mt-2">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editingExtractedForm.title}
                                                                        onChange={(e) => setEditingExtractedForm((f) => ({ ...f, title: e.target.value }))}
                                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829]"
                                                                        placeholder="e.g., Surgery preparation"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                                                    <select
                                                                        value={editingExtractedForm.category}
                                                                        onChange={(e) => setEditingExtractedForm((f) => ({ ...f, category: e.target.value }))}
                                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829] capitalize"
                                                                    >
                                                                        {TIMELINE_CATEGORY_OPTIONS.map((cat) => (
                                                                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">OCR text / notes</label>
                                                                    <textarea
                                                                        rows={3}
                                                                        value={editingExtractedForm.excerpt}
                                                                        onChange={(e) => setEditingExtractedForm((f) => ({ ...f, excerpt: e.target.value }))}
                                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829] font-mono"
                                                                        placeholder="Rewrite the extracted text into a clearer version…"
                                                                    />
                                                                </div>
                                                                {showSourceLine && (
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                        <span className="material-icons text-sm">description</span>
                                                                        <span className="font-medium">Source:</span>
                                                                        <span>{event.sourceLabel}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                                {event.description && (
                                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.description}</p>
                                                                )}
                                                                {event.excerpt && (
                                                                    <p className="text-xs italic text-slate-500 mt-2 whitespace-pre-wrap">"{event.excerpt}"</p>
                                                                )}
                                                                {(event.provider?.name || event.provider?.facility) && (
                                                                    <div className="mt-2 text-xs text-slate-500">
                                                                        {event.provider.name && <span>Provider: {event.provider.name}</span>}
                                                                        {event.provider.facility && <span> • Facility: {event.provider.facility}</span>}
                                                                    </div>
                                                                )}
                                                                {showSourceLine && (
                                                                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                                                        <span className="material-icons text-sm">description</span>
                                                                        <span className="font-medium">Source:</span>
                                                                        <span>{event.sourceLabel}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {isPendingExtract && isInlineEditing && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    disabled={timelineActionKey === event.key}
                                                                    onClick={() => saveAndAddExtracted(event)}
                                                                    className="px-3 py-1.5 bg-[#801829] text-white rounded-md text-xs font-semibold hover:bg-[#60121f] transition-colors flex items-center gap-1 disabled:opacity-60"
                                                                >
                                                                    <span className="material-icons text-sm">check_circle</span>
                                                                    {timelineActionKey === event.key ? 'Saving…' : 'Save & Add to Timeline'}
                                                                </button>
                                                                <button
                                                                    disabled={timelineActionKey === event.key}
                                                                    onClick={cancelEditExtracted}
                                                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-60"
                                                                >
                                                                    <span className="material-icons text-sm">close</span>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}

                                                        {isPendingExtract && !isInlineEditing && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <button
                                                                    disabled={timelineActionKey === event.key || !!editingExtractedKey}
                                                                    onClick={() => handlePromoteExtracted(event)}
                                                                    className="px-3 py-1.5 bg-[#801829] text-white rounded-md text-xs font-semibold hover:bg-[#60121f] transition-colors flex items-center gap-1 disabled:opacity-60"
                                                                >
                                                                    <span className="material-icons text-sm">check_circle</span>
                                                                    {timelineActionKey === event.key ? 'Adding…' : 'Add to Timeline'}
                                                                </button>
                                                                <button
                                                                    disabled={timelineActionKey === event.key || !!editingExtractedKey}
                                                                    onClick={() => startEditExtracted(event)}
                                                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-60"
                                                                >
                                                                    <span className="material-icons text-sm">edit</span>
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    disabled={timelineActionKey === event.key || !!editingExtractedKey}
                                                                    onClick={() => handleDismissExtracted(event.key)}
                                                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 disabled:opacity-60"
                                                                >
                                                                    <span className="material-icons text-sm">close</span>
                                                                    Dismiss
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md p-12">
                                    <div className="text-center text-slate-500">
                                        <span className="material-icons text-6xl text-slate-300 mb-4">timeline</span>
                                        <p>No timeline events match this filter yet.</p>
                                        <p className="text-xs mt-2">
                                            Upload medical records or add manual events to start building the case chronology.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
                {activeTab === 'analysis' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Case Analysis</h3>
                            <button
                                onClick={() => setShowAnalysisModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Finding
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                            </div>
                        ) : analysis && (analysis.standardsOfCare?.length > 0 || analysis.breaches?.length > 0) ? (
                            <div className="space-y-6">
                                {analysis.breaches && analysis.breaches.length > 0 && (
                                    <div>
                                        <h4 className="text-md font-bold mb-4">Identified Deviations</h4>
                                        <div className="space-y-3">
                                            {analysis.breaches.map((breach, idx) => (
                                                <div key={idx} className="bg-[#e4dace] dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                        <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-[#e4dace] dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-500 border-b-2 border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left">Category</th>
                                                            <th className="px-6 py-3 text-left">Standard</th>
                                                            <th className="px-6 py-3 text-left">Assessment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-[#f3efe5] dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                                        {analysis.standardsOfCare.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-[#f3efe5] dark:hover:bg-slate-800/30 transition-colors">
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
                                className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Damage
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                            </div>
                        ) : damages.length > 0 ? (
                            <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#e4dace] dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-500 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Category</th>
                                                <th className="px-6 py-3 text-left">Description</th>
                                                <th className="px-6 py-3 text-left">Date</th>
                                                <th className="px-6 py-3 text-left">Amount</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[#f3efe5] dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                            {damages.map((item) => (
                                                <tr key={item._id} className="hover:bg-[#f3efe5] dark:hover:bg-slate-800/30 transition-colors">
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
                                className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Create Task
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                            </div>
                        ) : tasks.length > 0 ? (
                            <div className="bg-[#f3efe5] dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#e4dace] dark:bg-slate-800/50 text-[10px] font-bold uppercase text-slate-500 border-b-2 border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Task</th>
                                                <th className="px-6 py-3 text-left">Assigned To</th>
                                                <th className="px-6 py-3 text-left">Due Date</th>
                                                <th className="px-6 py-3 text-left">Priority</th>
                                                <th className="px-6 py-3 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[#f3efe5] dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                                            {tasks.map((task) => (
                                                <tr key={task._id} className="hover:bg-[#f3efe5] dark:hover:bg-slate-800/30 transition-colors">
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
                                className="flex items-center gap-2 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors"
                            >
                                <span className="material-icons text-sm">add</span>
                                Add Note
                            </button>
                        </div>
                        {tabLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#801829]"></div>
                            </div>
                        ) : notes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {notes.map((note) => (
                                    <div key={note._id} className="bg-[#e4dace] dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                                        <span key={idx} className="px-2 py-1 bg-[#801829]/10 text-[#801829] rounded text-xs font-medium">
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
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-[#801829] transition-colors">
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
                                            <span className="material-icons text-5xl text-[#801829] mb-3">cloud_upload</span>
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
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] focus:border-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] focus:border-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] focus:border-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] focus:border-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="flex-1 px-4 py-2.5 bg-[#801829] hover:bg-[#60121f] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
                                    placeholder="Note title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Content *</label>
                                <textarea
                                    required
                                    value={noteData.content}
                                    onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="4"
                                    placeholder="Write your note here..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowNoteModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors">
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Status *</label>
                                <select
                                    required
                                    value={damagesData.status}
                                    onChange={(e) => setDamagesData({ ...damagesData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="2"
                                    placeholder="Additional notes or documentation references..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowDamagesModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors">
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white"
                                    rows="2"
                                    placeholder="Supporting evidence..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAnalysisModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors">
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
                                    <input type="date" name="date" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Time</label>
                                    <input type="time" name="time" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category *</label>
                                <select name="category" required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white">
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
                                <input type="text" name="title" required placeholder="Event Title" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea name="description" placeholder="Description" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" rows="3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Provider Name</label>
                                <input type="text" name="providerName" placeholder="Provider Name" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Facility</label>
                                <input type="text" name="facility" placeholder="Facility" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#801829] outline-none dark:bg-slate-700 dark:text-white" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddTimelineEvent(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-[#801829] text-white rounded-lg hover:bg-[#60121f] transition-colors">
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
                                className="flex-1 px-4 py-2.5 bg-[#801829] hover:bg-[#60121f] text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
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

            {/* Assign consultant (admin / attorney) */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign consultant</h3>
                            <button
                                type="button"
                                onClick={() => setShowAssignModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <span className="material-icons text-slate-500">close</span>
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {loadingConsultants ? (
                                <div className="flex items-center justify-center py-10 text-slate-500">
                                    <span className="material-icons animate-spin mr-2">refresh</span>
                                    Loading consultants…
                                </div>
                            ) : consultantsList.length === 0 ? (
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    No consultant users found. Add users with role Consultant under Users first.
                                </p>
                            ) : (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {consultantsList.map((c) => (
                                        <li key={c._id} className="py-3 flex items-center justify-between gap-3 first:pt-0">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {c.fullName}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">{c.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={assigningConsultantId === c._id}
                                                onClick={() => handleAssignConsultant(c._id)}
                                                className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1f3b61] text-white hover:bg-[#152a47] disabled:opacity-60 transition-colors"
                                            >
                                                {assigningConsultantId === c._id ? 'Saving…' : 'Assign'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Records modal — explicit per-record extraction */}
            {showScanModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                {scanStep === 'reviewCandidates' && (
                                    <button
                                        type="button"
                                        onClick={handleBackToRecordList}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        aria-label="Back"
                                    >
                                        <span className="material-icons text-slate-500 text-xl">arrow_back</span>
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {scanStep === 'pickRecord' ? 'Scan Medical Records' : 'Review Detected Dates'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {scanStep === 'pickRecord'
                                            ? 'Pick a medical record to scan for dates and tied actions.'
                                            : `From ${scanRecordInfo?.fileName || 'record'} — pick which dates to add to the timeline.`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeScanModal}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <span className="material-icons text-slate-500">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 overflow-y-auto flex-1">
                            {scanError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {scanError}
                                </div>
                            )}

                            {scanStep === 'pickRecord' && (
                                <>
                                    {(!medicalRecords || medicalRecords.length === 0) ? (
                                        <div className="text-center py-12">
                                            <span className="material-icons text-5xl text-slate-300">folder_off</span>
                                            <p className="mt-2 text-slate-600 dark:text-slate-300 font-semibold">No medical records yet</p>
                                            <p className="text-sm text-slate-500 mt-1">Upload a medical record first, then come back to scan it.</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {medicalRecords.map((rec) => {
                                                const status = rec.ocrStatus || 'pending';
                                                const statusBadge = ({
                                                    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                    processing: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    failed: 'bg-red-50 text-red-700 border-red-200'
                                                })[status] || 'bg-slate-100 text-slate-600 border-slate-200';
                                                const recId = rec._id || rec.id;
                                                const isLoadingThis = scanLoading && scanRecordInfo?._id === recId;
                                                return (
                                                    <li key={recId} className="py-3 flex items-center justify-between gap-3 first:pt-0">
                                                        <div className="min-w-0 flex items-start gap-3">
                                                            <span className="material-icons text-slate-400 mt-0.5">description</span>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                    {rec.fileName || 'Untitled record'}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    {rec.documentType && (
                                                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                                                                            {rec.documentType}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusBadge}`}>
                                                                        OCR: {status}
                                                                    </span>
                                                                    {rec.recordDate && (
                                                                        <span className="text-[11px] text-slate-500">
                                                                            Record date: {formatDateDMY(rec.recordDate)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            disabled={scanLoading}
                                                            onClick={() => handlePickRecordToScan(recId)}
                                                            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#801829] text-white hover:bg-[#60121f] disabled:opacity-60 transition-colors flex items-center gap-1"
                                                        >
                                                            <span className="material-icons text-sm">document_scanner</span>
                                                            {isLoadingThis ? 'Scanning…' : 'Scan'}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </>
                            )}

                            {scanStep === 'reviewCandidates' && (
                                <>
                                    {scanRecordInfo && (
                                        <div className="mb-4 p-3 rounded-lg bg-[#f3efe5] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                                            <span><strong>File:</strong> {scanRecordInfo.fileName}</span>
                                            <span><strong>OCR:</strong> {scanRecordInfo.ocrStatus || 'pending'}</span>
                                            {scanRecordInfo.recordDate && (
                                                <span><strong>Record date:</strong> {formatDateDMY(scanRecordInfo.recordDate)}</span>
                                            )}
                                            {scanRecordInfo.dateOfService && (
                                                <span><strong>Service date:</strong> {formatDateDMY(scanRecordInfo.dateOfService)}</span>
                                            )}
                                        </div>
                                    )}

                                    {scanCandidates.length === 0 ? (
                                        <div className="text-center py-10">
                                            <span className="material-icons text-5xl text-slate-300">search_off</span>
                                            <p className="mt-2 text-slate-700 dark:text-slate-200 font-semibold">No dates detected in this record</p>
                                            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                                {scanRecordInfo && !scanRecordInfo.hasOcrText
                                                    ? `OCR is "${scanRecordInfo.ocrStatus || 'pending'}". Wait a moment for processing to finish, then scan again.`
                                                    : 'The document text didn\'t contain any clearly formatted dates. You can still add events manually.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs text-slate-500">
                                                    {scanSelectedKeys.size} of {scanCandidates.length} selected
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAllScanSelections(true)}
                                                        className="text-xs font-semibold text-[#801829] hover:underline"
                                                    >
                                                        Select all
                                                    </button>
                                                    <span className="text-slate-300">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAllScanSelections(false)}
                                                        className="text-xs font-semibold text-slate-500 hover:underline"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>

                                            <ul className="space-y-2">
                                                {scanCandidates.map((c) => {
                                                    const checked = scanSelectedKeys.has(c.key);
                                                    const isEditing = editingCandidateKey === c.key;

                                                    if (isEditing) {
                                                        return (
                                                            <li
                                                                key={c.key}
                                                                className="p-4 rounded-lg border-2 border-[#801829] bg-[#801829]/5"
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="material-icons text-sm text-[#801829]">edit</span>
                                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                            Editing — {formatDateDMY(c.eventDate)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-500">Date is fixed</span>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                                            Title
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={editingForm.title}
                                                                            onChange={(e) => setEditingForm((f) => ({ ...f, title: e.target.value }))}
                                                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829]"
                                                                            placeholder="e.g., Surgery preparation"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                                            Category
                                                                        </label>
                                                                        <select
                                                                            value={editingForm.category}
                                                                            onChange={(e) => setEditingForm((f) => ({ ...f, category: e.target.value }))}
                                                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829] capitalize"
                                                                        >
                                                                            {TIMELINE_CATEGORY_OPTIONS.map((cat) => (
                                                                                <option key={cat} value={cat} className="capitalize">{cat}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                                            OCR text / notes
                                                                        </label>
                                                                        <textarea
                                                                            rows={3}
                                                                            value={editingForm.excerpt}
                                                                            onChange={(e) => setEditingForm((f) => ({ ...f, excerpt: e.target.value }))}
                                                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#801829] font-mono"
                                                                            placeholder="Edit the extracted OCR sentence into a cleaner version…"
                                                                        />
                                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                                            This is what will appear under the event in the timeline.
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex items-center justify-end gap-2 pt-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelEditCandidate}
                                                                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={saveEditCandidate}
                                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#801829] text-white hover:bg-[#60121f] transition-colors flex items-center gap-1"
                                                                        >
                                                                            <span className="material-icons text-sm">check</span>
                                                                            Save changes
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        );
                                                    }

                                                    return (
                                                        <li
                                                            key={c.key}
                                                            className={`p-3 rounded-lg border transition-colors ${checked
                                                                ? 'border-[#801829] bg-[#801829]/5'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleScanSelection(c.key)}
                                                                    className="mt-1 w-4 h-4 text-[#801829] border-slate-300 rounded focus:ring-[#801829] cursor-pointer"
                                                                />
                                                                <div
                                                                    className="flex-1 min-w-0 cursor-pointer"
                                                                    onClick={() => toggleScanSelection(c.key)}
                                                                >
                                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                            {formatDateDMY(c.eventDate)}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 capitalize">
                                                                            {c.category}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize bg-amber-50 text-amber-700 border-amber-200">
                                                                            {c.confidence} confidence
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                        {c.title}
                                                                    </p>
                                                                    {c.excerpt && (
                                                                        <p className="text-xs italic text-slate-500 mt-1 whitespace-pre-wrap">"{c.excerpt}"</p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startEditCandidate(c);
                                                                    }}
                                                                    className="shrink-0 p-1.5 text-slate-500 hover:text-[#801829] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                                    title="Edit this entry"
                                                                >
                                                                    <span className="material-icons text-base">edit</span>
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={closeScanModal}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            {scanStep === 'reviewCandidates' && scanCandidates.length > 0 && (
                                <>
                                    {editingCandidateKey && (
                                        <span className="text-xs text-slate-500 mr-2">
                                            Save or cancel your edit first
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        disabled={scanSaving || scanSelectedKeys.size === 0 || !!editingCandidateKey}
                                        onClick={handleSaveScannedEvents}
                                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#801829] text-white hover:bg-[#60121f] disabled:opacity-60 transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-icons text-sm">playlist_add_check</span>
                                        {scanSaving
                                            ? 'Adding…'
                                            : `Add ${scanSelectedKeys.size} to Timeline`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseDetail;
