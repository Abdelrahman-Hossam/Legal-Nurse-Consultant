const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
    case: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: [true, 'Case reference is required']
    },
    title: {
        type: String,
        required: [true, 'Timeline title is required']
    },
    description: String,
    status: {
        type: String,
        enum: ['draft', 'in-progress', 'review', 'completed'],
        default: 'draft'
    },
    events: [{
        date: {
            type: Date,
            required: true
        },
        time: String,
        category: {
            type: String,
            enum: ['treatment', 'medication', 'lab', 'imaging', 'consultation', 'procedure', 'symptom', 'other'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        provider: {
            name: String,
            facility: String,
            specialty: String
        },
        citations: [{
            document: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MedicalRecord'
            },
            pageNumber: Number,
            excerpt: String
        }],
        // Distinguishes user-typed events vs. events promoted from OCR / metadata.
        eventSource: {
            type: String,
            enum: ['manual', 'medical_record', 'medical_record_edited'],
            default: 'manual'
        },
        significance: {
            type: String,
            enum: ['critical', 'important', 'routine', 'informational']
        },
        tags: [String],
        notes: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedAt: Date,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    // Stable keys of auto-extracted events (from medical records) the user has hidden from the unified timeline.
    dismissedExtractedKeys: [{
        type: String
    }]
}, {
    timestamps: true
});

timelineSchema.index({ case: 1 });
timelineSchema.index({ status: 1 });
timelineSchema.index({ assignedTo: 1 });
timelineSchema.index({ 'events.date': 1 });

module.exports = mongoose.model('Timeline', timelineSchema);
