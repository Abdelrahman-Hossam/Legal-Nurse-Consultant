import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import timelineService from '../../../services/timeline.service';

const TimelineBuilder = () => {
    const { caseId } = useParams();
    const [timeline, setTimeline] = useState(null);
    const [caseInfo, setCaseInfo] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showEditEvent, setShowEditEvent] = useState(false);

    useEffect(() => {
        if (caseId) {
            fetchTimeline();
        }
    }, [caseId]);

    const fetchTimeline = async () => {
        try {
            setLoading(true);
            const response = await timelineService.getTimelinesByCase(caseId);
            const timelines = response.data?.timelines || response.timelines || [];
            if (timelines.length > 0) {
                const tl = timelines[0];
                setTimeline(tl);
                setEvents(tl.events || []);
                setCaseInfo(tl.case);
            } else {
                // No timeline exists yet for this case
                setTimeline(null);
                setEvents([]);
                setCaseInfo(null);
            }
        } catch (error) {
            console.error('Error fetching timeline:', error);
            setTimeline(null);
            setEvents([]);
            setCaseInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (eventData) => {
        try {
            if (!timeline) {
                // Create timeline first
                const tlResponse = await timelineService.createTimeline({
                    case: caseId,
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
            setShowAddEvent(false);
            alert('Event added successfully');
        } catch (error) {
            alert('Failed to add event');
        }
    };

    const handleEditEvent = async (eventData) => {
        try {
            await timelineService.updateEvent(timeline._id, editingEvent._id, eventData);
            fetchTimeline();
            setShowEditEvent(false);
            setEditingEvent(null);
            alert('Event updated successfully');
        } catch (error) {
            alert('Failed to update event');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await timelineService.deleteEvent(timeline._id, eventId);
            fetchTimeline();
            alert('Event deleted successfully');
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            treatment: 'bg-blue-100 text-blue-800',
            medication: 'bg-purple-100 text-purple-800',
            lab: 'bg-green-100 text-green-800',
            imaging: 'bg-yellow-100 text-yellow-800',
            consultation: 'bg-pink-100 text-pink-800',
            procedure: 'bg-red-100 text-red-800',
            symptom: 'bg-orange-100 text-orange-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors.other;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-icons animate-spin text-4xl">refresh</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Medical Timeline Builder</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {caseInfo ? `Case: ${caseInfo.caseNumber} - ${caseInfo.caseName || ''}` : 'Create chronological medical events with citations'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                if (!timeline) {
                                    alert('No timeline to export');
                                    return;
                                }
                                try {
                                    const blob = await timelineService.exportTimeline(timeline._id, 'txt');
                                    // Create download link
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `timeline-${caseInfo?.caseNumber || 'report'}.txt`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                } catch (error) {
                                    alert('Failed to export report: ' + error.message);
                                }
                            }}
                            disabled={!timeline || events.length === 0}
                            className="flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-icons text-sm mr-2">download</span>
                            Export Report
                        </button>
                        <button
                            onClick={() => setShowAddEvent(true)}
                            className="flex items-center px-5 py-2.5 bg-[#0891b2] hover:bg-teal-700 text-white rounded-lg shadow-lg transition-all text-sm font-semibold"
                        >
                            <span className="material-icons text-sm mr-2">add</span>
                            Add Event
                        </button>
                    </div>
                </div>
            </header>

            {/* Timeline Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#e4dace] dark:bg-slate-800/40 p-4 rounded-xl border">
                    <p className="text-xs uppercase font-bold text-slate-500">Total Events</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{events.length}</p>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-800/40 p-4 rounded-xl border">
                    <p className="text-xs uppercase font-bold text-slate-500">Date Range</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {events.length > 0 ? `${new Date(events[0].date).toLocaleDateString()} - ${new Date(events[events.length - 1].date).toLocaleDateString()}` : 'N/A'}
                    </p>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-800/40 p-4 rounded-xl border">
                    <p className="text-xs uppercase font-bold text-slate-500">Status</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{timeline?.status || 'Draft'}</p>
                </div>
                <div className="bg-[#e4dace] dark:bg-slate-800/40 p-4 rounded-xl border">
                    <p className="text-xs uppercase font-bold text-slate-500">Citations</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {events.reduce((sum, e) => sum + (e.citations?.length || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Timeline Events */}
            <div className="bg-[#e4dace] dark:bg-slate-800/40 rounded-xl border p-6">
                {events.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <span className="material-icons text-6xl text-slate-300 mb-4">timeline</span>
                        <p>No events yet. Click "Add Event" to start building the timeline.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

                        {/* Events */}
                        <div className="space-y-6">
                            {events.map((event, index) => (
                                <div key={event._id || index} className="relative pl-16">
                                    {/* Timeline Dot */}
                                    <div className="absolute left-6 top-2 w-4 h-4 rounded-full bg-[#0891b2] border-4 border-white dark:border-slate-800"></div>

                                    {/* Event Card */}
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getCategoryColor(event.category)}`}>
                                                        {event.category}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(event.date).toLocaleDateString()}
                                                        {event.time && ` at ${event.time}`}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{event.title}</h3>
                                                {event.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.description}</p>
                                                )}
                                                {event.provider && (
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        Provider: {event.provider.name} {event.provider.facility && `- ${event.provider.facility}`}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingEvent(event);
                                                        setShowEditEvent(true);
                                                    }}
                                                    className="p-1 text-slate-400 hover:text-[#0891b2]"
                                                >
                                                    <span className="material-icons text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event._id)}
                                                    className="p-1 text-slate-400 hover:text-rose-500"
                                                >
                                                    <span className="material-icons text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Citations */}
                                        {event.citations && event.citations.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                <p className="text-xs font-semibold text-slate-500 mb-2">Citations:</p>
                                                <div className="space-y-1">
                                                    {event.citations.map((citation, idx) => (
                                                        <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                            <span className="material-icons text-xs">description</span>
                                                            <span>{citation.document?.fileName || 'Document'} - Page {citation.pageNumber}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Event Modal (Simple) */}
            {showAddEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Add Timeline Event</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleAddEvent({
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
                        }}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input type="date" name="date" required className="px-3 py-2 border rounded-lg" />
                                <input type="time" name="time" className="px-3 py-2 border rounded-lg" />
                            </div>
                            <select name="category" required className="w-full px-3 py-2 border rounded-lg mb-4">
                                <option value="">Select Category</option>
                                <option value="treatment">Treatment</option>
                                <option value="medication">Medication</option>
                                <option value="lab">Lab</option>
                                <option value="imaging">Imaging</option>
                                <option value="consultation">Consultation</option>
                                <option value="procedure">Procedure</option>
                                <option value="symptom">Symptom</option>
                            </select>
                            <input type="text" name="title" required placeholder="Event Title" className="w-full px-3 py-2 border rounded-lg mb-4" />
                            <textarea name="description" placeholder="Description" className="w-full px-3 py-2 border rounded-lg mb-4" rows="3"></textarea>
                            <input type="text" name="providerName" placeholder="Provider Name" className="w-full px-3 py-2 border rounded-lg mb-4" />
                            <input type="text" name="facility" placeholder="Facility" className="w-full px-3 py-2 border rounded-lg mb-4" />
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 bg-[#0891b2] text-white py-2 rounded-lg font-semibold">Add Event</button>
                                <button type="button" onClick={() => setShowAddEvent(false)} className="px-6 py-2 border rounded-lg">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditEvent && editingEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-xl font-bold mb-4">Edit Timeline Event</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleEditEvent({
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
                        }}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    defaultValue={editingEvent.date ? new Date(editingEvent.date).toISOString().split('T')[0] : ''}
                                    className="px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="time"
                                    name="time"
                                    defaultValue={editingEvent.time || ''}
                                    className="px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <select
                                name="category"
                                required
                                defaultValue={editingEvent.category}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                            >
                                <option value="">Select Category</option>
                                <option value="treatment">Treatment</option>
                                <option value="medication">Medication</option>
                                <option value="lab">Lab</option>
                                <option value="imaging">Imaging</option>
                                <option value="consultation">Consultation</option>
                                <option value="procedure">Procedure</option>
                                <option value="symptom">Symptom</option>
                            </select>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="Event Title"
                                defaultValue={editingEvent.title}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                            />
                            <textarea
                                name="description"
                                placeholder="Description"
                                defaultValue={editingEvent.description || ''}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                                rows="3"
                            ></textarea>
                            <input
                                type="text"
                                name="providerName"
                                placeholder="Provider Name"
                                defaultValue={editingEvent.provider?.name || ''}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                            />
                            <input
                                type="text"
                                name="facility"
                                placeholder="Facility"
                                defaultValue={editingEvent.provider?.facility || ''}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                            />
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 bg-[#0891b2] text-white py-2 rounded-lg font-semibold">Update Event</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditEvent(false);
                                        setEditingEvent(null);
                                    }}
                                    className="px-6 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimelineBuilder;
