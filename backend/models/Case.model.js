const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    caseNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    caseName: {
        type: String,
        required: [true, 'Case name is required'],
        trim: true
    },
    caseType: {
        type: String,
        required: [true, 'Case type is required'],
        enum: ['medical-malpractice', 'personal-injury', 'workers-compensation', 'product-liability', 'other']
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client is required']
    },
    lawFirm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LawFirm'
    },
    attorney: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedConsultant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    /** User (admin/attorney) who last set assignedConsultant — used for acknowledge notifications */
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['intake', 'review', 'active', 'pending', 'closed', 'archived'],
        default: 'intake'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    incidentDate: Date,
    filingDate: Date,
    description: String,
    allegations: [String],
    damages: {
        economic: Number,
        nonEconomic: Number,
        punitive: Number
    },
    timeline: [{
        date: Date,
        event: String,
        description: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    documents: [{
        name: String,
        type: String,
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

caseSchema.index({ caseNumber: 1 });
caseSchema.index({ caseName: 'text', description: 'text' });
caseSchema.index({ status: 1 });
caseSchema.index({ client: 1 });
caseSchema.index({ lawFirm: 1 });
caseSchema.index({ attorney: 1 });

// Auto-generate case number
caseSchema.pre('save', async function (next) {
    if (!this.caseNumber) {
        const count = await mongoose.model('Case').countDocuments();
        const year = new Date().getFullYear();
        this.caseNumber = `CASE-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Case', caseSchema);
