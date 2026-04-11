import { useEffect, useState } from 'react';
import PagesTopBar from '../../../shared/components/PagesTopBar';
import caseService from '../../../services/case.service';
import noteService from '../../../services/note.service';

const NotesPage = () => {
    const [selectedCase, setSelectedCase] = useState('');
    const [cases, setCases] = useState([]);
    const [notes, setNotes] = useState([]);
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        fetchCases();
        // Get logged-in user's name from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            setUserName(user.name);
        }
    }, []);

    useEffect(() => {
        if (selectedCase) {
            fetchNotes();
        }
    }, [selectedCase]);

    const fetchCases = async () => {
        try {
            const response = await caseService.getAllCases();
            console.log('Cases API response:', response);

            // Handle different response structures
            const casesData = response.data?.cases || response.cases || response.data || [];
            console.log('Extracted cases:', casesData);

            setCases(casesData);
            if (casesData.length > 0) {
                setSelectedCase(casesData[0]._id);
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
        }
    };

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await noteService.getByCase(selectedCase);
            setNotes(response.data.notes || []);
            setStats(response.data.stats || null);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!noteTitle.trim() || !noteContent.trim()) return;

        try {
            await noteService.create({
                case: selectedCase,
                title: noteTitle,
                content: noteContent,
                tags: selectedTags,
                type: 'general',
                priority: 'medium'
            });
            setNoteTitle('');
            setNoteContent('');
            setSelectedTags([]);
            fetchNotes();
        } catch (error) {
            console.error('Error creating note:', error);
        }
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handlePinNote = async (noteId) => {
        try {
            await noteService.togglePin(noteId);
            fetchNotes();
        } catch (error) {
            console.error('Error pinning note:', error);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        try {
            await noteService.delete(noteId);
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <PagesTopBar
                title="Case Notes & Collaboration"
                subtitle="Team collaboration and case notes"
            />

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Select Case:</label>
                    <select
                        className="flex-1 max-w-md px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                    >
                        {cases.length === 0 ? (
                            <option value="">No cases available</option>
                        ) : (
                            cases.map(c => (
                                <option key={c._id} value={c._id}>
                                    {c.caseName || c.title || 'Unnamed Case'}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-4">Add New Note</h3>
                        <input
                            type="text"
                            className="w-full px-4 py-2 mb-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] outline-none"
                            placeholder="Note title..."
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                        />
                        <textarea
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-[#0891b2] focus:border-transparent outline-none resize-none"
                            rows="4"
                            placeholder="Write your note here..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        />
                        {selectedTags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-3">
                                {selectedTags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => toggleTag(tag)} className="hover:text-blue-900">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-end mt-4">
                            <button
                                onClick={handleCreateNote}
                                disabled={!noteTitle.trim() || !noteContent.trim()}
                                className="bg-[#0891b2] hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons text-sm">send</span>
                                Post Note
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0891b2]"></div>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center">
                            <span className="material-icons text-6xl text-slate-300 mb-4">note</span>
                            <p className="text-slate-500">No notes yet. Create your first note above.</p>
                        </div>
                    ) : (
                        notes.map((note) => {
                            // Use current user's name if createdBy is not populated
                            const displayName = note.createdBy?.name || userName;
                            const displayInitial = displayName.charAt(0).toUpperCase();

                            return (
                                <div key={note._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#1f3b61]/10 flex items-center justify-center text-[#1f3b61] text-sm font-bold ring-2 ring-white dark:ring-slate-800">
                                            {displayInitial}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{displayName}</h4>
                                                    <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handlePinNote(note._id)}
                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                        title={note.isPinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        <span className={`material-icons text-sm ${note.isPinned ? 'text-[#0891b2]' : 'text-slate-400'}`}>
                                                            push_pin
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNote(note._id)}
                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                    >
                                                        <span className="material-icons text-sm text-slate-400">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <h5 className="font-semibold text-slate-900 dark:text-white mb-2">{note.title}</h5>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{note.content}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {note.tags?.map((tag, index) => (
                                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {note.attachments?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <span className="material-icons text-xs">attach_file</span>
                                                        {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {note.isPinned && (
                                                    <span className="flex items-center gap-1 text-xs text-[#0891b2]">
                                                        <span className="material-icons text-xs">push_pin</span>
                                                        Pinned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h3 className="font-bold text-lg mb-4">Quick Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => toggleTag('Important')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes('Important')
                                    ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    }`}
                            >
                                Important
                            </button>
                            <button
                                onClick={() => toggleTag('Completed')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes('Completed')
                                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                    }`}
                            >
                                Completed
                            </button>
                            <button
                                onClick={() => toggleTag('Follow-up')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes('Follow-up')
                                    ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                    }`}
                            >
                                Follow-up
                            </button>
                            <button
                                onClick={() => toggleTag('Meeting')}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes('Meeting')
                                    ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                    }`}
                            >
                                Meeting
                            </button>
                        </div>
                    </div>

                    {stats && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-4">Activity Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Notes</span>
                                    <span className="text-sm font-bold">{stats.total || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Pinned</span>
                                    <span className="text-sm font-bold">{stats.pinned || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">With Attachments</span>
                                    <span className="text-sm font-bold">{stats.withAttachments || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default NotesPage;
