const Timeline = require('../../../models/Timeline.model');
const MedicalRecord = require('../../../models/MedicalRecord.model');

/**
 * Case Timeline Service
 *
 * Builds a unified, chronological timeline for a case by merging:
 *   - Manual events from the case Timeline document(s).
 *   - Auto-extracted events derived from uploaded medical records
 *     (recordDate, metadata.dateOfService, and date mentions inside OCR text).
 *
 * The merged result is returned read-only; verified manual events live on the
 * Timeline document, while extracted events are recomputed each request and
 * filtered by the Timeline's `dismissedExtractedKeys`.
 */

const CATEGORY_KEYWORDS = [
    { category: 'admission', label: 'Hospital admission', patterns: [/admit/i, /admission/i, /admitted to/i, /\bicu\b/i, /\ber\b/i, /emergency room/i] },
    { category: 'discharge', label: 'Hospital discharge', patterns: [/discharg/i, /left the hospital/i, /leaves? the hospital/i, /leaving the hospital/i, /sent home/i, /released from/i, /went home/i] },
    { category: 'procedure', label: 'Surgical procedure', patterns: [/surger/i, /operation/i, /operative/i, /procedure/i, /pre[- ]?op/i, /post[- ]?op/i, /anesthe[ts]/i, /propofol/i] },
    { category: 'imaging', label: 'Imaging study', patterns: [/x[- ]?ray/i, /\bmri\b/i, /\bct scan\b/i, /\bct\b/i, /ultrasound/i, /imaging/i, /radiolog/i] },
    { category: 'lab', label: 'Lab work', patterns: [/lab\b/i, /laborator/i, /blood test/i, /culture/i, /panel/i] },
    { category: 'medication', label: 'Medication change', patterns: [/prescrib/i, /medication/i, /\brx\b/i, /dos(?:e|es|ed|ing|age)/i, /\bmg\b/i, /\bml\b/i, /injection/i] },
    { category: 'consultation', label: 'Clinical consultation', patterns: [/consult/i, /referral/i, /follow[- ]?up/i, /\bvisit/i] },
    { category: 'symptom', label: 'Reported symptom', patterns: [/complain/i, /symptom/i, /pain/i, /onset/i, /did not wake/i, /unconscious/i] },
    { category: 'treatment', label: 'Treatment', patterns: [/treatment/i, /therap/i] }
];

const VALID_TIMELINE_CATEGORIES = new Set([
    'treatment', 'medication', 'lab', 'imaging', 'consultation',
    'procedure', 'symptom', 'other'
]);

const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
};

const DATE_PATTERNS = [
    // 12/31/2024, 12-31-2024, 12.31.2024 (month/day/year — US style)
    /\b(0?[1-9]|1[0-2])[\/\-.](0?[1-9]|[12]\d|3[01])[\/\-.](\d{2,4})\b/g,
    // 19/4/2026, 21-4-2026 (day/month/year — unambiguous when day > 12)
    /\b(1[3-9]|2\d|3[01])[\/\-.](0?[1-9]|1[0-2])[\/\-.](\d{2,4})\b/g,
    // 2024-12-31 (ISO-like — year/month/day)
    /\b(\d{4})[\/\-.](0?[1-9]|1[0-2])[\/\-.](0?[1-9]|[12]\d|3[01])\b/g,
    // January 5, 2024 / Jan 5 2024 / April 26 th , 2026 (ordinal may be on its own line in OCR output)
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(0?[1-9]|[12]\d|3[01])(?:\s*(?:st|nd|rd|th))?\s*,?\s+(\d{2,4})\b/gi,
    // 5 January 2024 / 5th January 2024 (ordinal may be split by whitespace)
    /\b(0?[1-9]|[12]\d|3[01])(?:\s*(?:st|nd|rd|th))?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{2,4})\b/gi
];

const MIN_VALID_YEAR = 1950;

const isValidDate = (date) => {
    if (!(date instanceof Date)) return false;
    if (Number.isNaN(date.getTime())) return false;
    const year = date.getFullYear();
    if (year < MIN_VALID_YEAR) return false;
    if (year > new Date().getFullYear() + 5) return false;
    return true;
};

const normalizeYear = (year) => {
    const y = Number(year);
    if (!Number.isFinite(y)) return null;
    if (y < 100) return y >= 50 ? 1900 + y : 2000 + y;
    return y;
};

const buildDate = (year, month, day) => {
    const y = normalizeYear(year);
    const m = Number(month);
    const d = Number(day);
    if (y == null || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const dt = new Date(Date.UTC(y, m, d));
    return isValidDate(dt) ? dt : null;
};

const monthIndex = (token) => {
    if (!token) return null;
    const key = token.toLowerCase().replace('.', '');
    return Object.prototype.hasOwnProperty.call(MONTHS, key) ? MONTHS[key] : null;
};

/**
 * Find all date mentions in a text body. Returns an array of:
 *   { date: Date, index: number, raw: string }
 */
const findDateMentions = (text) => {
    if (!text || typeof text !== 'string') return [];
    const found = [];
    const seen = new Set();

    DATE_PATTERNS.forEach((rawPattern, patternIdx) => {
        const pattern = new RegExp(rawPattern.source, rawPattern.flags);
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let date = null;
            if (patternIdx === 0) {
                // M/D/Y
                date = buildDate(match[3], Number(match[1]) - 1, match[2]);
            } else if (patternIdx === 1) {
                // D/M/Y (day > 12, unambiguous)
                date = buildDate(match[3], Number(match[2]) - 1, match[1]);
            } else if (patternIdx === 2) {
                // ISO Y/M/D
                date = buildDate(match[1], Number(match[2]) - 1, match[3]);
            } else if (patternIdx === 3) {
                // MonthName Day, Year
                date = buildDate(match[3], monthIndex(match[1]), match[2]);
            } else if (patternIdx === 4) {
                // Day MonthName Year
                date = buildDate(match[3], monthIndex(match[2]), match[1]);
            }
            if (!date) continue;
            const dedupeKey = `${date.toISOString()}::${match.index}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);
            found.push({ date, index: match.index, raw: match[0] });
        }
    });

    return found;
};

const SENTENCE_BOUNDARIES = ['.', ';', '\n', '!', '?'];

/**
 * Find the sentence (or short clause) containing a given index. We split on
 * common terminators so multi-event paragraphs like
 *   "Admitted on X. Surgery on Y. Discharged on Z."
 * map each date strictly to the keyword in its own clause.
 */
const findSentenceWindow = (text, index) => {
    let start = index;
    while (start > 0 && !SENTENCE_BOUNDARIES.includes(text[start - 1])) {
        start -= 1;
        if (index - start > 200) break;
    }
    let end = index;
    while (end < text.length && !SENTENCE_BOUNDARIES.includes(text[end])) {
        end += 1;
        if (end - index > 200) break;
    }
    return { start, end, text: text.slice(start, end) };
};

/**
 * Look at the sentence around a date mention and decide which clinical
 * category best matches it. The keyword whose nearest occurrence is closest to
 * the date inside that sentence wins.
 */
const inferCategoryFromContext = (text, index) => {
    if (!text) return null;
    const sentence = findSentenceWindow(text, index);
    const dateOffsetInSentence = index - sentence.start;
    if (!sentence.text) return null;

    let best = null;

    for (const entry of CATEGORY_KEYWORDS) {
        for (const pattern of entry.patterns) {
            const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
            const rx = new RegExp(pattern.source, flags);
            let match;
            while ((match = rx.exec(sentence.text)) !== null) {
                const distance = Math.abs(match.index - dateOffsetInSentence);
                if (!best || distance < best.distance) {
                    best = { category: entry.category, label: entry.label, distance };
                }
                if (match.index === rx.lastIndex) rx.lastIndex += 1;
            }
        }
    }

    return best ? { category: best.category, label: best.label } : null;
};

const buildExcerpt = (text, index, raw) => {
    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + raw.length + 60);
    return text.slice(start, end).replace(/\s+/g, ' ').trim();
};

const toIsoDay = (date) => date.toISOString().slice(0, 10);

/**
 * Build the stable key used to identify (and dismiss) an extracted event.
 * Format: extracted:<recordId>:<source>:<isoDay>[:<offset>]
 */
const buildExtractedKey = (recordId, source, date, offset) => {
    const base = `extracted:${recordId}:${source}:${toIsoDay(date)}`;
    return offset == null ? base : `${base}:${offset}`;
};

/**
 * Map an internal extracted-category to a Timeline.events.category enum.
 * Falls back to 'other' for non-clinical buckets so the value can be promoted
 * to a manual event without violating the schema.
 */
const toTimelineCategory = (category) => {
    if (!category) return 'other';
    if (VALID_TIMELINE_CATEGORIES.has(category)) return category;
    return 'other';
};

/**
 * Convert one MedicalRecord into 0..N candidate timeline events.
 */
const extractFromMedicalRecord = (record) => {
    const events = [];
    const recordId = String(record._id);
    const fileName = record.fileName || 'Medical Record';
    const provider = record.provider || {};

    const pushCandidate = (date, options) => {
        if (!isValidDate(date)) return;
        events.push({
            id: options.key,
            key: options.key,
            eventDate: date,
            eventType: options.eventType || toTimelineCategory(options.category),
            category: toTimelineCategory(options.category),
            title: options.title,
            description: options.description || '',
            sourceType: 'medical_record',
            sourceId: recordId,
            sourceLabel: fileName,
            provider: {
                name: provider.name || '',
                facility: provider.facility || '',
                specialty: provider.specialty || ''
            },
            confidence: options.confidence,
            isVerified: false,
            isDismissed: false,
            documentType: record.documentType || 'medical-record',
            excerpt: options.excerpt || ''
        });
    };

    if (record.recordDate) {
        const date = new Date(record.recordDate);
        if (isValidDate(date)) {
            pushCandidate(date, {
                key: buildExtractedKey(recordId, 'recordDate', date),
                category: 'other',
                title: `${record.documentType ? record.documentType.replace(/-/g, ' ') : 'Medical record'} - ${fileName}`,
                description: 'Date taken from the uploaded medical record metadata.',
                confidence: 'high'
            });
        }
    }

    if (record.metadata && record.metadata.dateOfService) {
        const date = new Date(record.metadata.dateOfService);
        if (isValidDate(date)) {
            pushCandidate(date, {
                key: buildExtractedKey(recordId, 'dateOfService', date),
                category: 'consultation',
                title: `Date of service - ${fileName}`,
                description: 'Date of service captured from medical record metadata.',
                confidence: 'high'
            });
        }
    }

    if (record.ocrText && typeof record.ocrText === 'string') {
        const mentions = findDateMentions(record.ocrText);
        const seenKeys = new Set();
        mentions.forEach((mention) => {
            const ctx = inferCategoryFromContext(record.ocrText, mention.index);
            const category = ctx ? ctx.category : 'other';
            const baseTitle = ctx ? ctx.label : 'Date mentioned in document';
            const key = buildExtractedKey(recordId, `ocr-${category}`, mention.date, mention.index);
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            pushCandidate(mention.date, {
                key,
                category,
                title: `${baseTitle} - ${fileName}`,
                description: '',
                excerpt: buildExcerpt(record.ocrText, mention.index, mention.raw),
                confidence: ctx ? 'medium' : 'low'
            });
        });
    }

    return events;
};

const dedupeExtractedEvents = (events) => {
    const byKey = new Map();
    events.forEach((event) => {
        const existing = byKey.get(event.key);
        if (!existing) {
            byKey.set(event.key, event);
            return;
        }
        // Prefer higher-confidence record for the same key.
        const order = { high: 3, medium: 2, low: 1 };
        if ((order[event.confidence] || 0) > (order[existing.confidence] || 0)) {
            byKey.set(event.key, event);
        }
    });
    return Array.from(byKey.values());
};

const mapManualEvent = (timelineDoc, event) => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const citations = (event.citations || []).map((c) => ({
        documentId: c.document && c.document._id ? String(c.document._id) : (c.document ? String(c.document) : null),
        documentName: c.document && c.document.fileName ? c.document.fileName : undefined,
        pageNumber: c.pageNumber,
        excerpt: c.excerpt
    }));

    let eventSource = event.eventSource;
    if (!['manual', 'medical_record', 'medical_record_edited'].includes(eventSource)) {
        const hasDocCitation = citations.some((c) => c.documentId);
        eventSource = hasDocCitation ? 'medical_record' : 'manual';
    }

    // Prefer a citation that has excerpt text; otherwise any citation tied to a
    // document (metadata-only promotions often have an empty excerpt).
    const primaryCitation = citations.find(
        (c) => (c.excerpt != null && String(c.excerpt).trim()) || c.documentId
    ) || citations[0] || null;

    const fromMedical = eventSource === 'medical_record' || eventSource === 'medical_record_edited';
    const sourceType = fromMedical ? 'medical_record' : 'manual';
    const fileName = primaryCitation?.documentName;
    const sourceLabel = fromMedical && fileName ? fileName : null;

    const excerptText = primaryCitation && primaryCitation.excerpt != null
        ? String(primaryCitation.excerpt).trim()
        : '';

    return {
        id: String(event._id),
        key: `manual:${String(event._id)}`,
        eventDate,
        eventType: event.category || 'other',
        category: event.category || 'other',
        title: event.title,
        description: event.description || '',
        excerpt: excerptText,
        eventSource,
        sourceType,
        sourceId: String(event._id),
        sourceLabel,
        provider: event.provider || { name: '', facility: '', specialty: '' },
        confidence: 'verified',
        isVerified: true,
        isDismissed: false,
        time: event.time,
        significance: event.significance,
        tags: event.tags || [],
        notes: event.notes,
        citations
    };
};

/**
 * Build the unified timeline for a case.
 *
 * Returns:
 *   {
 *     timeline: TimelineDoc | null,   // the (first) Timeline document for the case
 *     manualEvents: [...],            // manual events, normalized
 *     extractedEvents: [...],         // extracted candidates, normalized
 *     unifiedEvents: [...],           // manual + (non-dismissed) extracted, sorted asc by date
 *     dismissedKeys: [...],           // current dismissed extracted keys
 *     stats: {                        // summary counts for UI
 *       total, manual, extracted, dismissed
 *     }
 *   }
 */
const buildUnifiedTimeline = async (caseId) => {
    const [timelineDoc, records] = await Promise.all([
        Timeline.findOne({ case: caseId })
            .sort({ createdAt: 1 })
            .populate('events.citations.document', 'fileName')
            .populate('events.createdBy', 'fullName'),
        MedicalRecord.find({ case: caseId, isDeleted: { $ne: true } })
            .select('_id fileName documentType provider recordDate metadata ocrText')
    ]);

    const manualEvents = timelineDoc
        ? (timelineDoc.events || []).map((event) => mapManualEvent(timelineDoc, event))
        : [];

    const extractedRaw = (records || []).flatMap(extractFromMedicalRecord);
    const extracted = dedupeExtractedEvents(extractedRaw);

    const dismissedKeys = new Set(timelineDoc?.dismissedExtractedKeys || []);
    const visibleExtracted = extracted.map((e) => ({
        ...e,
        isDismissed: dismissedKeys.has(e.key)
    }));

    // Latest events first (descending by date) so the timeline reads
    // most-recent → oldest, matching how lawyers/nurses scan a case.
    const unifiedEvents = [
        ...manualEvents,
        ...visibleExtracted.filter((e) => !e.isDismissed)
    ].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    return {
        timeline: timelineDoc,
        manualEvents,
        extractedEvents: visibleExtracted,
        unifiedEvents,
        dismissedKeys: Array.from(dismissedKeys),
        stats: {
            total: unifiedEvents.length,
            manual: unifiedEvents.filter((e) => e.sourceType === 'manual').length,
            extracted: unifiedEvents.filter((e) => e.sourceType === 'medical_record').length,
            verified: unifiedEvents.filter((e) => e.isVerified).length,
            dismissed: visibleExtracted.filter((e) => e.isDismissed).length
        }
    };
};

const ensureTimelineForCase = async (caseId, userId) => {
    let timelineDoc = await Timeline.findOne({ case: caseId }).sort({ createdAt: 1 });
    if (!timelineDoc) {
        timelineDoc = await Timeline.create({
            case: caseId,
            title: 'Case Timeline',
            status: 'in-progress',
            createdBy: userId
        });
    }
    return timelineDoc;
};

const dismissExtractedEvent = async (caseId, key, userId) => {
    if (!key || typeof key !== 'string') {
        throw new Error('A valid extracted event key is required');
    }
    const timelineDoc = await ensureTimelineForCase(caseId, userId);
    if (!timelineDoc.dismissedExtractedKeys.includes(key)) {
        timelineDoc.dismissedExtractedKeys.push(key);
        await timelineDoc.save();
    }
    return timelineDoc;
};

const restoreExtractedEvent = async (caseId, key, userId) => {
    if (!key || typeof key !== 'string') {
        throw new Error('A valid extracted event key is required');
    }
    const timelineDoc = await ensureTimelineForCase(caseId, userId);
    timelineDoc.dismissedExtractedKeys = (timelineDoc.dismissedExtractedKeys || [])
        .filter((k) => k !== key);
    await timelineDoc.save();
    return timelineDoc;
};

/**
 * Run extraction for a single medical record. Useful for the "Scan" UX where
 * the user explicitly chooses a record and reviews candidate events before
 * accepting them.
 */
const scanMedicalRecord = async (caseId, recordId) => {
    const record = await MedicalRecord.findOne({
        _id: recordId,
        case: caseId,
        isDeleted: { $ne: true }
    }).select('_id fileName documentType provider recordDate metadata ocrText ocrStatus ocrProcessedAt');

    if (!record) {
        return { record: null, candidates: [], dismissedKeys: [] };
    }

    const timelineDoc = await Timeline.findOne({ case: caseId });
    const dismissedKeys = new Set(timelineDoc?.dismissedExtractedKeys || []);

    const rawCandidates = extractFromMedicalRecord(record);
    const candidates = dedupeExtractedEvents(rawCandidates).map((event) => ({
        ...event,
        isDismissed: dismissedKeys.has(event.key)
    }));

    return {
        record: {
            _id: String(record._id),
            fileName: record.fileName,
            documentType: record.documentType,
            ocrStatus: record.ocrStatus,
            ocrProcessedAt: record.ocrProcessedAt,
            hasOcrText: Boolean(record.ocrText && record.ocrText.length > 0),
            recordDate: record.recordDate,
            dateOfService: record.metadata?.dateOfService || null,
            provider: record.provider || {}
        },
        candidates,
        dismissedKeys: Array.from(dismissedKeys)
    };
};

module.exports = {
    buildUnifiedTimeline,
    ensureTimelineForCase,
    dismissExtractedEvent,
    restoreExtractedEvent,
    scanMedicalRecord,
    // exported for testing
    findDateMentions,
    inferCategoryFromContext,
    extractFromMedicalRecord
};
