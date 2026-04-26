import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import caseService from '../../../services/case.service';
import fileShareService from '../../../services/fileShare.service';

const ClientCaseView = () => {
    const { id } = useParams();
    const [caseData, setCaseData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCaseData();
            fetchDocuments();
        }
    }, [id]);

    const fetchCaseData = async () => {
        try {
            const data = await caseService.getCaseById(id);
            setCaseData(data);
        } catch (error) {
            console.error('Failed to load case:', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const data = await fileShareService.getSharedFiles(id);
            setDocuments(data || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId) => {
        try {
            await fileShareService.downloadFile(fileId);
        } catch (error) {
            alert('Failed to download file: ' + error.message);
        }
    };
    const progressSteps = [
        { label: 'Intake', date: 'Aug 12', completed: true, icon: 'check' },
        { label: 'Record Retrieval', date: 'Aug 28', completed: true, icon: 'check' },
        { label: 'Medical Review', date: 'In Progress', completed: false, active: true, icon: 'pulse' },
        { label: 'Drafting Report', date: 'Pending', completed: false, icon: '4' },
        { label: 'Finalized', date: 'Pending', completed: false, icon: 'flag' }
    ];

    const messages = [
        {
            sender: 'Dr. Elena Rodriguez',
            role: 'Consultant',
            message: "I've reviewed the second set of radiology reports. There is a discrepancy in the imaging dates we should discuss during our call on Thursday.",
            time: '2 hours ago',
            avatar: 'ER',
            isOwn: false
        },
        {
            sender: 'Jonathan Harker',
            role: 'Client (You)',
            message: "Thank you, Elena. I'll make sure the junior associate is also on that call.",
            time: 'Yesterday',
            avatar: 'JH',
            isOwn: true
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="p-8">
                {/* Case Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{caseData?.title || 'Loading...'}</h1>
                    <p className="text-slate-500">Case Number: <span className="text-slate-900 dark:text-slate-300 font-medium">{caseData?.caseNumber || 'N/A'}</span></p>
                </div>

                {/* Case Progress Timeline */}
                <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl p-8 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <span className="material-icons text-[#0891b2]">analytics</span>
                            Case Progress
                        </h3>
                        <span className="text-sm font-medium px-3 py-1 bg-[#0891b2]/10 text-[#0891b2] rounded-full">Phase 3: Medical Review</span>
                    </div>
                    <div className="relative">
                        <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        <div className="absolute top-5 left-0 w-[66%] h-1 bg-[#0891b2] rounded-full"></div>
                        <div className="relative flex justify-between">
                            {progressSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center group">
                                    <div className={`w-10 h-10 ${step.completed ? 'bg-[#0891b2] text-white' : step.active ? 'bg-white dark:bg-slate-900 border-4 border-[#0891b2]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-4 border-white dark:border-slate-900'} rounded-full flex items-center justify-center z-10 ${step.completed ? 'shadow-lg' : step.active ? 'shadow-md' : ''} mb-3`}>
                                        {step.icon === 'check' && <span className="material-icons text-xl">check</span>}
                                        {step.icon === 'pulse' && <div className="w-2 h-2 bg-[#0891b2] rounded-full animate-pulse"></div>}
                                        {step.icon === 'flag' && <span className="material-icons text-lg">flag</span>}
                                        {step.icon === '4' && <span className="text-sm font-bold">4</span>}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${step.completed || step.active ? 'text-[#0891b2]' : 'text-slate-400'} ${step.active ? 'text-slate-900 dark:text-white' : ''}`}>
                                        {step.label}
                                    </span>
                                    <span className={`text-[10px] mt-1 ${step.active ? 'text-[#0891b2] font-medium' : 'text-slate-400'}`}>
                                        {step.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 p-4 bg-[#0891b2]/5 rounded-lg border border-[#0891b2]/10 flex gap-4">
                        <span className="material-icons text-[#0891b2]">info</span>
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Current Activity</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Dr. Rodriguez is currently cross-referencing the anesthesia logs with the operative report from the June 14th surgery. Expected completion by Friday.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Shared Documents */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="material-icons text-[#0891b2]">folder_shared</span>
                                    Shared Documents
                                </h3>
                                <button className="text-[#0891b2] text-sm font-semibold hover:underline">Upload New</button>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <div className="px-6 py-12 text-center text-slate-500">
                                        Loading documents...
                                    </div>
                                ) : documents.length > 0 ? (
                                    documents.map((doc, idx) => (
                                        <div key={idx} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded flex items-center justify-center">
                                                    <span className="material-icons">description</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{doc.fileName}</p>
                                                    <p className="text-xs text-slate-400">Shared on {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleDownload(doc._id)} className="p-2 text-slate-400 hover:text-[#0891b2]"><span className="material-icons">download</span></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-12 text-center text-slate-500">
                                        No documents shared yet
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center">
                                <button className="text-sm font-medium text-slate-500 hover:text-[#0891b2]">View All 12 Documents</button>
                            </div>
                        </div>

                        {/* Recent Messages */}
                        <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="material-icons text-[#0891b2]">chat_bubble_outline</span>
                                    Recent Communication
                                </h3>
                                <button className="text-[#0891b2] text-sm font-semibold hover:underline">New Message</button>
                            </div>
                            <div className="p-6 space-y-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full ${msg.isOwn ? 'bg-primary/20 text-primary' : 'bg-gradient-to-br from-blue-400 to-blue-600'} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                            {msg.avatar}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm">{msg.sender}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{msg.role}</span>
                                                <span className="text-[10px] text-slate-400 ml-auto">{msg.time}</span>
                                            </div>
                                            <div className={`${msg.isOwn ? 'bg-[#0891b2]/5 border border-[#0891b2]/10' : 'bg-slate-50 dark:bg-slate-800'} p-3 rounded-lg rounded-tl-none`}>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{msg.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        {/* Upcoming Appointment */}
                        <div className="bg-[#0891b2] text-white rounded-xl p-6 shadow-md shadow-[#0891b2]/20">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons">event</span>
                                Upcoming Call
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-lg flex flex-col items-center justify-center">
                                        <span className="text-xs font-bold leading-none uppercase">Oct</span>
                                        <span className="text-xl font-black leading-none">19</span>
                                    </div>
                                    <div>
                                        <p className="font-bold">Medical Review Strategy</p>
                                        <p className="text-xs text-white/80">Thursday • 2:00 PM EST</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/90 bg-white/10 p-2 rounded border border-white/10">
                                    <span className="material-icons text-sm">link</span>
                                    <span className="truncate">https://medlegal.zoom.us/j/882...</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button className="bg-white text-[#0891b2] font-bold py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">Join Call</button>
                                    <button className="bg-white/10 text-white border border-white/20 font-bold py-2 rounded-lg text-sm hover:bg-white/20 transition-colors">Reschedule</button>
                                </div>
                            </div>
                        </div>

                        {/* Consultant Card */}
                        <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center">
                            <div className="relative inline-block mb-4">
                                <div className="w-20 h-20 rounded-full mx-auto border-4 border-[#0891b2]/10 bg-gradient-to-br from-blue-400 to-blue-600"></div>
                                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                            </div>
                            <h4 className="font-bold text-lg">Dr. Elena Rodriguez, RN</h4>
                            <p className="text-sm text-slate-500 mb-4">Board Certified Legal Nurse Consultant</p>
                            <div className="flex items-center justify-center gap-4 text-slate-400 mb-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-900 dark:text-white font-bold">142</span>
                                    <span className="text-[10px] uppercase font-medium">Cases</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-900 dark:text-white font-bold">12yr</span>
                                    <span className="text-[10px] uppercase font-medium">Exp.</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-900 dark:text-white font-bold">4.9/5</span>
                                    <span className="text-[10px] uppercase font-medium">Rating</span>
                                </div>
                            </div>
                            <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-[#0891b2] hover:text-white transition-all">
                                View Consultant Profile
                            </button>
                        </div>

                        {/* Helpful Resources */}
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-sm mb-4 text-slate-500 uppercase tracking-widest">Case Resources</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 group cursor-pointer">
                                    <div className="w-8 h-8 rounded bg-[#e4dace] dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:text-[#0891b2]">
                                        <span className="material-icons text-lg">help_outline</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold group-hover:text-[#0891b2] transition-colors">Understanding Medical Reports</p>
                                        <p className="text-xs text-slate-400">Guide for non-experts</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 group cursor-pointer">
                                    <div className="w-8 h-8 rounded bg-[#e4dace] dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:text-[#0891b2]">
                                        <span className="material-icons text-lg">schedule</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold group-hover:text-[#0891b2] transition-colors">Case Timeline FAQs</p>
                                        <p className="text-xs text-slate-400">Typical duration of phases</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 group cursor-pointer">
                                    <div className="w-8 h-8 rounded bg-[#e4dace] dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:text-[#0891b2]">
                                        <span className="material-icons text-lg">security</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold group-hover:text-[#0891b2] transition-colors">Our Security Standards</p>
                                        <p className="text-xs text-slate-400">How your data is protected</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ClientCaseView;
