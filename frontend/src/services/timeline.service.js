import api from './api.service';

const timelineService = {
    // Get timelines by case
    getTimelinesByCase: async (caseId) => {
        const response = await api.get(`/timelines/case/${caseId}`);
        return response.data;
    },

    // Get timeline by ID
    getTimelineById: async (id) => {
        const response = await api.get(`/timelines/${id}`);
        return response.data;
    },

    // Create timeline
    createTimeline: async (timelineData) => {
        const response = await api.post('/timelines', timelineData);
        return response.data;
    },

    // Update timeline
    updateTimeline: async (id, timelineData) => {
        const response = await api.put(`/timelines/${id}`, timelineData);
        return response.data;
    },

    // Delete timeline
    deleteTimeline: async (id) => {
        const response = await api.delete(`/timelines/${id}`);
        return response.data;
    },

    // Update status
    updateStatus: async (id, status) => {
        const response = await api.patch(`/timelines/${id}/status`, { status });
        return response.data;
    },

    // Add event
    addEvent: async (timelineId, eventData) => {
        const response = await api.post(`/timelines/${timelineId}/events`, eventData);
        return response.data;
    },

    // Update event
    updateEvent: async (timelineId, eventId, eventData) => {
        const response = await api.put(`/timelines/${timelineId}/events/${eventId}`, eventData);
        return response.data;
    },

    // Delete event
    deleteEvent: async (timelineId, eventId) => {
        const response = await api.delete(`/timelines/${timelineId}/events/${eventId}`);
        return response.data;
    },

    // Get work queue
    getWorkQueue: async (params = {}) => {
        const response = await api.get('/timelines/work-queue', { params });
        return response.data;
    },

    // Generate timeline
    generateTimeline: async (id) => {
        const response = await api.post(`/timelines/${id}/generate`);
        return response.data;
    },

    // Export timeline
    exportTimeline: async (id, format = 'txt') => {
        const response = await api.get(`/timelines/${id}/export`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    },

    // Unified case timeline (manual events + auto-extracted medical-record events)
    getUnifiedCaseTimeline: async (caseId) => {
        const response = await api.get(`/timelines/case/${caseId}/unified`);
        return response.data;
    },

    dismissExtractedEvent: async (caseId, key) => {
        const response = await api.post(`/timelines/case/${caseId}/dismiss-extracted`, { key });
        return response.data;
    },

    restoreExtractedEvent: async (caseId, key) => {
        const response = await api.post(`/timelines/case/${caseId}/restore-extracted`, { key });
        return response.data;
    },

    promoteExtractedEvent: async (caseId, event, dismiss = true) => {
        const response = await api.post(`/timelines/case/${caseId}/promote-extracted`, { event, dismiss });
        return response.data;
    },

    // Scan a single medical record and return candidate events (no save)
    scanRecord: async (caseId, recordId) => {
        const response = await api.get(`/timelines/case/${caseId}/scan/${recordId}`);
        return response.data;
    },

    // Bulk-add selected extracted events into the timeline
    promoteExtractedEventsBulk: async (caseId, events, dismiss = true) => {
        const response = await api.post(`/timelines/case/${caseId}/promote-extracted-bulk`, { events, dismiss });
        return response.data;
    }
};

export default timelineService;
