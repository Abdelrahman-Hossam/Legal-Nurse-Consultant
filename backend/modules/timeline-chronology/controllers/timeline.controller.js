const Timeline = require('../../../models/Timeline.model');
const AppError = require('../../../shared/errors/AppError');
const caseTimelineService = require('../services/caseTimeline.service');

// Get timelines by case
exports.getTimelinesByCase = async (req, res, next) => {
    try {
        const timelines = await Timeline.find({ case: req.params.caseId })
            .populate({
                path: 'case',
                select: 'caseNumber caseName caseType client lawFirm',
                populate: [
                    { path: 'client', select: 'firstName lastName fullName' },
                    { path: 'lawFirm', select: 'name' }
                ]
            })
            .populate('assignedTo', 'fullName email')
            .populate('createdBy', 'fullName')
            .populate('events.citations.document', 'fileName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { timelines }
        });
    } catch (error) {
        next(error);
    }
};

// Get timeline by ID
exports.getTimelineById = async (req, res, next) => {
    try {
        const timeline = await Timeline.findById(req.params.id)
            .populate('case', 'caseNumber caseName client')
            .populate('assignedTo', 'fullName email')
            .populate('createdBy', 'fullName')
            .populate('reviewedBy', 'fullName')
            .populate('events.citations.document', 'fileName fileUrl')
            .populate('events.createdBy', 'fullName');

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        // Sort events by date
        timeline.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Create timeline
exports.createTimeline = async (req, res, next) => {
    try {
        const timelineData = {
            ...req.body,
            createdBy: req.user._id
        };

        const timeline = await Timeline.create(timelineData);
        await timeline.populate('case assignedTo createdBy');

        res.status(201).json({
            success: true,
            message: 'Timeline created successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Update timeline
exports.updateTimeline = async (req, res, next) => {
    try {
        const timeline = await Timeline.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('case assignedTo createdBy');

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Timeline updated successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Delete timeline
exports.deleteTimeline = async (req, res, next) => {
    try {
        const timeline = await Timeline.findByIdAndDelete(req.params.id);

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Timeline deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Add event to timeline
exports.addEvent = async (req, res, next) => {
    try {
        const timeline = await Timeline.findById(req.params.id);

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        const eventData = {
            ...req.body,
            createdBy: req.user._id,
            // Only the normal "Add Event" form may create true manual entries.
            eventSource: 'manual'
        };

        timeline.events.push(eventData);
        await timeline.save();

        // Sort events by date
        timeline.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        await timeline.save();

        res.status(200).json({
            success: true,
            message: 'Event added successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Update event
exports.updateEvent = async (req, res, next) => {
    try {
        const timeline = await Timeline.findById(req.params.timelineId);

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        const event = timeline.events.id(req.params.eventId);
        if (!event) {
            throw new AppError('Event not found', 404);
        }

        Object.assign(event, req.body);
        await timeline.save();

        // Re-sort events
        timeline.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        await timeline.save();

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Delete event
exports.deleteEvent = async (req, res, next) => {
    try {
        const timeline = await Timeline.findById(req.params.timelineId);

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        timeline.events.pull(req.params.eventId);
        await timeline.save();

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Get work queue (timelines assigned to user or all timelines)
exports.getWorkQueue = async (req, res, next) => {
    try {
        const { status } = req.query;

        const query = {};

        // Only filter by assignedTo if it's explicitly requested
        // This allows showing all timelines in the work queue
        if (req.query.assignedToMe === 'true') {
            query.assignedTo = req.user._id;
        }

        if (status) query.status = status;

        const timelines = await Timeline.find(query)
            .populate({
                path: 'case',
                select: 'caseNumber caseName caseType client lawFirm',
                populate: [
                    { path: 'client', select: 'firstName lastName fullName' },
                    { path: 'lawFirm', select: 'name' }
                ]
            })
            .populate('createdBy', 'fullName')
            .populate('assignedTo', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { timelines }
        });
    } catch (error) {
        next(error);
    }
};

// Update timeline status
exports.updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const timeline = await Timeline.findById(req.params.id);

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        timeline.status = status;

        if (status === 'completed') {
            timeline.completedAt = new Date();
        }

        if (status === 'review') {
            timeline.reviewedBy = req.user._id;
            timeline.reviewedAt = new Date();
        }

        await timeline.save();

        res.status(200).json({
            success: true,
            message: 'Timeline status updated successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Generate timeline (mark as completed and ready for export)
exports.generateTimeline = async (req, res, next) => {
    try {
        const timeline = await Timeline.findById(req.params.id)
            .populate('case', 'caseNumber caseName')
            .populate('events.citations.document', 'fileName');

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        // Sort events by date
        timeline.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Update status to completed
        timeline.status = 'completed';
        timeline.completedAt = new Date();
        await timeline.save();

        res.status(200).json({
            success: true,
            message: 'Timeline generated successfully',
            data: { timeline }
        });
    } catch (error) {
        next(error);
    }
};

// Get unified case timeline (manual events + extracted from medical records)
exports.getUnifiedCaseTimeline = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const result = await caseTimelineService.buildUnifiedTimeline(caseId);

        res.status(200).json({
            success: true,
            data: {
                timeline: result.timeline
                    ? {
                        _id: result.timeline._id,
                        title: result.timeline.title,
                        status: result.timeline.status,
                        dismissedExtractedKeys: result.timeline.dismissedExtractedKeys || []
                    }
                    : null,
                events: result.unifiedEvents,
                manualEvents: result.manualEvents,
                extractedEvents: result.extractedEvents,
                stats: result.stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Dismiss an auto-extracted event so it stops appearing in the unified timeline
exports.dismissExtractedEvent = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { key } = req.body || {};
        if (!key) {
            throw new AppError('Extracted event key is required', 400);
        }
        await caseTimelineService.dismissExtractedEvent(caseId, key, req.user._id);
        const result = await caseTimelineService.buildUnifiedTimeline(caseId);
        res.status(200).json({
            success: true,
            message: 'Extracted event dismissed',
            data: {
                events: result.unifiedEvents,
                manualEvents: result.manualEvents,
                extractedEvents: result.extractedEvents,
                stats: result.stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Restore a previously dismissed extracted event
exports.restoreExtractedEvent = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { key } = req.body || {};
        if (!key) {
            throw new AppError('Extracted event key is required', 400);
        }
        await caseTimelineService.restoreExtractedEvent(caseId, key, req.user._id);
        const result = await caseTimelineService.buildUnifiedTimeline(caseId);
        res.status(200).json({
            success: true,
            message: 'Extracted event restored',
            data: {
                events: result.unifiedEvents,
                manualEvents: result.manualEvents,
                extractedEvents: result.extractedEvents,
                stats: result.stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Scan a single medical record and return its extracted candidate events
exports.scanRecord = async (req, res, next) => {
    try {
        const { caseId, recordId } = req.params;
        const result = await caseTimelineService.scanMedicalRecord(caseId, recordId);

        if (!result.record) {
            throw new AppError('Medical record not found for this case', 404);
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const VALID_TIMELINE_CATEGORIES = ['treatment', 'medication', 'lab', 'imaging', 'consultation', 'procedure', 'symptom', 'other'];

// Promote multiple extracted events at once (used by the Scan UX)
exports.promoteExtractedEventsBulk = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { events = [], dismiss = true } = req.body || {};
        if (!Array.isArray(events) || events.length === 0) {
            throw new AppError('Provide at least one event to add', 400);
        }

        const timelineDoc = await caseTimelineService.ensureTimelineForCase(caseId, req.user._id);

        events.forEach((event) => {
            if (!event || !event.eventDate || !event.title) return;
            const category = VALID_TIMELINE_CATEGORIES.includes(event.category) ? event.category : 'other';
            // The user may have edited the OCR excerpt during the Scan review step.
            // Persist that edited text as the citation excerpt so it shows up under
            // the timeline entry.
            const excerptText = (event.excerpt || '').trim();
            const eventSource = event.eventSource === 'medical_record_edited'
                ? 'medical_record_edited'
                : 'medical_record';
            timelineDoc.events.push({
                date: new Date(event.eventDate),
                category,
                title: event.title,
                description: event.description || '',
                provider: event.provider || {},
                citations: event.sourceType === 'medical_record' && event.sourceId
                    ? [{
                        document: event.sourceId,
                        excerpt: excerptText
                    }]
                    : [],
                eventSource,
                createdBy: req.user._id
            });
            if (dismiss && event.key && !timelineDoc.dismissedExtractedKeys.includes(event.key)) {
                timelineDoc.dismissedExtractedKeys.push(event.key);
            }
        });

        timelineDoc.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        await timelineDoc.save();

        const result = await caseTimelineService.buildUnifiedTimeline(caseId);
        res.status(201).json({
            success: true,
            message: `${events.length} event(s) added to timeline`,
            data: {
                events: result.unifiedEvents,
                manualEvents: result.manualEvents,
                extractedEvents: result.extractedEvents,
                stats: result.stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Promote an extracted event into a real manual Timeline event with citation
exports.promoteExtractedEvent = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { event, dismiss = true } = req.body || {};
        if (!event || !event.eventDate || !event.title) {
            throw new AppError('Event date and title are required', 400);
        }

        const timelineDoc = await caseTimelineService.ensureTimelineForCase(caseId, req.user._id);

        const validCategories = ['treatment', 'medication', 'lab', 'imaging', 'consultation', 'procedure', 'symptom', 'other'];
        const category = validCategories.includes(event.category) ? event.category : 'other';

        const eventSource = event.eventSource === 'medical_record_edited'
            ? 'medical_record_edited'
            : 'medical_record';

        const newEvent = {
            date: new Date(event.eventDate),
            category,
            title: event.title,
            description: event.description || '',
            provider: event.provider || {},
            citations: event.sourceType === 'medical_record' && event.sourceId
                ? [{
                    document: event.sourceId,
                    excerpt: (event.excerpt || '').trim()
                }]
                : [],
            eventSource,
            createdBy: req.user._id
        };

        timelineDoc.events.push(newEvent);
        if (dismiss && event.key) {
            if (!timelineDoc.dismissedExtractedKeys.includes(event.key)) {
                timelineDoc.dismissedExtractedKeys.push(event.key);
            }
        }
        timelineDoc.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        await timelineDoc.save();

        const result = await caseTimelineService.buildUnifiedTimeline(caseId);
        res.status(201).json({
            success: true,
            message: 'Event added to timeline',
            data: {
                events: result.unifiedEvents,
                manualEvents: result.manualEvents,
                extractedEvents: result.extractedEvents,
                stats: result.stats
            }
        });
    } catch (error) {
        next(error);
    }
};

// Export timeline as text report
exports.exportTimeline = async (req, res, next) => {
    try {
        const { format = 'txt' } = req.query;
        const timeline = await Timeline.findById(req.params.id)
            .populate({
                path: 'case',
                select: 'caseNumber caseName client lawFirm',
                populate: [
                    { path: 'client', select: 'fullName' },
                    { path: 'lawFirm', select: 'name' }
                ]
            })
            .populate('events.citations.document', 'fileName')
            .populate('createdBy', 'fullName');

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        // Sort events by date
        timeline.events.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Generate text report
        let report = '';
        report += '='.repeat(80) + '\n';
        report += 'MEDICAL CHRONOLOGY TIMELINE REPORT\n';
        report += '='.repeat(80) + '\n\n';

        report += `Case Number: ${timeline.case?.caseNumber || 'N/A'}\n`;
        report += `Case Name: ${timeline.case?.caseName || 'N/A'}\n`;
        report += `Client: ${timeline.case?.client?.fullName || 'N/A'}\n`;
        report += `Law Firm: ${timeline.case?.lawFirm?.name || 'N/A'}\n`;
        report += `Timeline Title: ${timeline.title}\n`;
        report += `Status: ${timeline.status.toUpperCase()}\n`;
        report += `Total Events: ${timeline.events.length}\n`;
        report += `Created By: ${timeline.createdBy?.fullName || 'N/A'}\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += '\n' + '='.repeat(80) + '\n\n';

        // Add events
        report += 'CHRONOLOGICAL EVENTS\n';
        report += '='.repeat(80) + '\n\n';

        timeline.events.forEach((event, index) => {
            report += `${index + 1}. ${new Date(event.date).toLocaleDateString()}`;
            if (event.time) report += ` at ${event.time}`;
            report += '\n';
            report += `   Category: ${event.category.toUpperCase()}\n`;
            report += `   Title: ${event.title}\n`;

            if (event.description) {
                report += `   Description: ${event.description}\n`;
            }

            if (event.provider?.name) {
                report += `   Provider: ${event.provider.name}`;
                if (event.provider.facility) report += ` - ${event.provider.facility}`;
                report += '\n';
            }

            if (event.citations && event.citations.length > 0) {
                report += `   Citations:\n`;
                event.citations.forEach((citation, idx) => {
                    report += `     ${idx + 1}. ${citation.document?.fileName || 'Document'} - Page ${citation.pageNumber}\n`;
                    if (citation.excerpt) {
                        report += `        "${citation.excerpt}"\n`;
                    }
                });
            }

            report += '\n';
        });

        report += '='.repeat(80) + '\n';
        report += 'END OF REPORT\n';
        report += '='.repeat(80) + '\n';

        // Set headers for download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="timeline-${timeline.case?.caseNumber || 'report'}.txt"`);
        res.send(report);
    } catch (error) {
        next(error);
    }
};
