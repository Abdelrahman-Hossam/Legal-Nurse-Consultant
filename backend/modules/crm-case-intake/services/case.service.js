const Case = require('../../../models/Case.model');

/**
 * Remove empty strings / null for optional ObjectId fields so Mongoose does not cast "".
 */
function sanitizeCaseInput(body) {
    const data = { ...body };
    const optionalRefKeys = ['lawFirm', 'attorney', 'assignedConsultant'];

    optionalRefKeys.forEach((key) => {
        if (data[key] === '' || data[key] === null || data[key] === undefined) {
            delete data[key];
        }
    });

    if (data.incidentDate === '' || data.incidentDate === null || data.incidentDate === undefined) {
        delete data.incidentDate;
    }

    return data;
}

/**
 * Create a case with cleaned payload (avoids CastError on optional refs).
 */
exports.createCase = async (body, userId) => {
    const cleaned = sanitizeCaseInput(body);
    const caseData = {
        ...cleaned,
        createdBy: userId
    };

    const newCase = await Case.create(caseData);

    return Case.findById(newCase._id)
        .populate('client', 'fullName email')
        .populate('lawFirm', 'firmName')
        .populate('attorney', 'fullName email lawFirm')
        .populate('assignedConsultant', 'fullName email')
        .populate('createdBy', 'fullName');
};

/**
 * Sanitize update payload (optional refs).
 */
exports.sanitizeCaseUpdateBody = (body) => sanitizeCaseInput(body);
