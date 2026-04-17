import api from './api.service';

const caseService = {
    // Get all cases
    getAllCases: async (params = {}) => {
        const response = await api.get('/cases', { params });
        return response.data;
    },

    // Get case by ID
    getCaseById: async (id) => {
        const response = await api.get(`/cases/${id}`);
        return response.data;
    },

    // Create new case
    createCase: async (caseData) => {
        const response = await api.post('/cases', caseData);
        return response.data;
    },

    // Update case
    updateCase: async (id, caseData) => {
        const response = await api.put(`/cases/${id}`, caseData);
        return response.data;
    },

    // Consultant acknowledges intake → review
    acknowledgeCase: async (id) => {
        const response = await api.post(`/cases/${id}/acknowledge`);
        return response.data;
    },

    // Delete case
    deleteCase: async (id) => {
        const response = await api.delete(`/cases/${id}`);
        return response.data;
    },

    // Add timeline event
    addTimelineEvent: async (id, eventData) => {
        const response = await api.post(`/cases/${id}/timeline`, eventData);
        return response.data;
    },

    // Add document
    addDocument: async (id, documentData) => {
        const response = await api.post(`/cases/${id}/documents`, documentData);
        return response.data;
    },

    // Get case statistics
    getCaseStats: async () => {
        const response = await api.get('/cases/stats');
        return response.data;
    }
};

export default caseService;
