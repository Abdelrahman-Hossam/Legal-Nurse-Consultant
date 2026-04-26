import { useEffect, useState } from 'react';
import clientPortalService from '../../../services/clientPortal.service';

const ClientTimeline = () => {
    const [timeline, setTimeline] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState('');
    const [loading, setLoading] = useState(true);
    const [caseInfo, setCaseInfo] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (selectedCase) {
            fetchTimeline();
        }
    }, [selectedCase]);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const cases = await clientPortalService.getClientCases();
            if (cases && cases.length > 0) {
                setCases(cases);
                // Auto-select first case
                setSelectedCase(cases[0]._id);
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async () => {
        try {
            setLoading(true);
            const data = await clientPortalService.getClientTimeline(selectedCase);
            if (data) {
                setCaseInfo(data.case);
                // Get all events from all timelines and flatten them
                const allEvents = data.timelines.flatMap(tl => tl.events || []);
                // Sort by date descending (newest first)
                allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTimeline(allEvents);
            }
        } catch (error) {
            console.error('Error fetching timeline:', error);
            setTimeline([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'treatment': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200',
            'medication': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200',
            'lab': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200',
            'imaging': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200',
            'consultation': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border-pink-200',
            'procedure': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200',
            'symptom': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200',
            'other': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200'
        };
        return colors[category] || colors.other;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'treatment': 'medical_services',
            'medication': 'medication',
            'lab': 'science',
            'imaging': 'radiology',
            'consultation': 'person',
            'procedure': 'healing',
            'symptom': 'sick',
            'other': 'event'
        };
        return icons[category] || 'event';
    };

    if (loading && cases.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-icons animate-spin text-4xl text-[#0891b2]">refresh</span>
            </div>
        );
    }

    if (cases.length === 0) {
        return (
            <div>
                <div className="text-center py-12">
                    <span className="material-icons text-6xl text-slate-300 mb-4">folder_open</span>
                    <p className="text-slate-500">No cases found</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Medical Timeline</h1>
                <p className="text-slate-600 dark:text-slate-400">Chronological view of medical events and treatments</p>
            </div>

            {/* Case Selector */}
            <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Select Case
                        </label>
                        <select
                            value={selectedCase}
                            onChange={(e) => setSelectedCase(e.target.value)}
                            className="w-full md:min-w-[300px] px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0891b2] focus:border-transparent"
                        >
                            {cases.map((caseItem) => (
                                <option key={caseItem._id} value={caseItem._id}>
                                    {caseItem.caseNumber} - {caseItem.caseName || caseItem.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-[#0891b2] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#0891b2]/90 transition-colors"
                    >
                        <span className="material-icons">download</span>
                        Export Timeline
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="material-icons animate-spin text-4xl text-[#0891b2]">refresh</span>
                </div>
            ) : timeline.length === 0 ? (
                <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <span className="material-icons text-6xl text-slate-300 mb-4">timeline</span>
                    <p className="text-slate-500">No timeline events available for this case yet.</p>
                </div>
            ) : (
                <>
                    {/* Timeline */}
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#0891b2]/20"></div>

                        {/* Timeline Events */}
                        <div className="space-y-8">
                            {timeline.map((event, index) => (
                                <div key={event._id || index} className="relative pl-20">
                                    {/* Timeline Dot */}
                                    <div className="absolute left-0 w-16 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-[#0891b2] rounded-full flex items-center justify-center shadow-lg z-10">
                                            <span className="material-icons text-[#0891b2]">{getCategoryIcon(event.category)}</span>
                                        </div>
                                    </div>

                                    {/* Event Card */}
                                    <div className="bg-[#e4dace] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getCategoryColor(event.category)}`}>
                                                        {event.category}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {new Date(event.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    {event.time && <span className="text-sm text-slate-400">{event.time}</span>}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h3>
                                            </div>
                                        </div>

                                        {event.description && (
                                            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                {event.description}
                                            </p>
                                        )}

                                        {event.provider && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                {event.provider.name && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="material-icons text-[#0891b2] text-lg">person</span>
                                                        <span className="text-slate-700 dark:text-slate-300">{event.provider.name}</span>
                                                    </div>
                                                )}
                                                {event.provider.facility && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="material-icons text-[#0891b2] text-lg">location_on</span>
                                                        <span className="text-slate-700 dark:text-slate-300">{event.provider.facility}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Citations */}
                                        {event.citations && event.citations.length > 0 && (
                                            <div className="bg-[#0891b2]/5 border border-[#0891b2]/20 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-icons text-[#0891b2] text-sm">link</span>
                                                    <span className="text-xs font-bold text-[#0891b2] uppercase">Source Citations</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {event.citations.map((citation, idx) => (
                                                        <span key={idx} className="text-xs bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                            {citation.document?.fileName || 'Document'} - Page {citation.pageNumber}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {event.notes && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <p className="text-xs font-semibold text-slate-500 mb-1">Notes:</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{event.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                            <span className="material-icons text-[#0891b2] text-3xl">info</span>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">About This Timeline</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    This medical chronology has been carefully compiled by our legal nurse consultants from your medical records.
                                    Each event is citation-linked to source documents for verification and court presentation.
                                </p>
                                <p className="text-xs text-slate-500">
                                    Last updated: {new Date().toLocaleDateString()} • {timeline.length} events documented
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClientTimeline;
