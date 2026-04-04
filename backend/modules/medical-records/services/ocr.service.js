const axios = require('axios');
const FormData = require('form-data');
const pdfParse = require('pdf-parse');

/**
 * OCR Service using OCR.space API for images and pdf-parse for PDFs
 * Works on Vercel without system dependencies
 */

/**
 * Extract text from PDF using pdf-parse (pure JavaScript)
 * @param {string} base64Data - Base64 encoded PDF data
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPdf(base64Data) {
    try {
        console.log('[PDF-Parse] Extracting text from PDF');

        // Remove data URL prefix if present
        let base64String = base64Data;
        if (base64String.startsWith('data:')) {
            base64String = base64String.split(',')[1];
        }

        // Convert base64 to buffer
        const pdfBuffer = Buffer.from(base64String, 'base64');
        console.log(`[PDF-Parse] PDF size: ${pdfBuffer.length} bytes`);

        // Parse PDF and extract text
        const data = await pdfParse(pdfBuffer);

        console.log(`[PDF-Parse] Extracted ${data.text.length} characters from ${data.numpages} pages`);

        if (!data.text || data.text.trim().length === 0) {
            throw new Error('No text found in PDF. PDF may be image-based or scanned.');
        }

        return data.text;

    } catch (error) {
        console.error('[PDF-Parse] Error:', error.message);
        throw new Error(`PDF text extraction failed: ${error.message}`);
    }
}

/**
 * Process OCR using OCR.space API for images
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function processImageOCR(base64Data, mimeType) {
    try {
        const apiKey = process.env.OCR_SPACE_API_KEY || 'K83420428988957';

        console.log(`[OCR] Processing ${mimeType} with OCR.space API`);

        // Remove data URL prefix if present
        let base64String = base64Data;
        if (base64String.startsWith('data:')) {
            base64String = base64String.split(',')[1];
        }

        const formData = new FormData();
        formData.append('base64Image', `data:${mimeType};base64,${base64String}`);
        formData.append('apikey', apiKey);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        formData.append('OCREngine', '2');

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: formData.getHeaders(),
            timeout: 60000
        });

        if (!response.data) {
            throw new Error('No response from OCR API');
        }

        if (response.data.IsErroredOnProcessing) {
            const errorMessage = response.data.ErrorMessage?.[0] || 'Unknown OCR error';
            throw new Error(errorMessage);
        }

        if (response.data.ParsedResults && response.data.ParsedResults.length > 0) {
            const extractedText = response.data.ParsedResults[0].ParsedText || '';
            console.log(`[OCR] Success: ${extractedText.length} characters extracted`);
            return extractedText;
        }

        throw new Error('No text extracted from image');

    } catch (error) {
        console.error('[OCR] Error:', error.message);

        if (error.code === 'ECONNABORTED') {
            throw new Error('OCR timeout - file too large');
        }

        if (error.response?.status === 403) {
            throw new Error('OCR API key invalid or rate limit exceeded');
        }

        throw new Error(`OCR failed: ${error.message}`);
    }
}

/**
 * Main OCR processing function - handles both PDFs and images
 * @param {string} base64Data - Base64 encoded file data
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text
 */
async function processOCRWithAPI(base64Data, mimeType) {
    try {
        console.log(`[OCR] Processing file type: ${mimeType}`);

        let extractedText = '';

        // Handle PDF files - extract text directly
        if (mimeType === 'application/pdf') {
            console.log('[OCR] PDF detected - extracting text with pdf-parse');
            extractedText = await extractTextFromPdf(base64Data);
        }
        // Handle image files - use OCR.space API
        else if (mimeType.startsWith('image/')) {
            console.log('[OCR] Image detected - processing with OCR.space');
            extractedText = await processImageOCR(base64Data, mimeType);
        }
        else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text extracted from file');
        }

        return extractedText.trim();

    } catch (error) {
        console.error('[OCR] Processing error:', error.message);
        throw error;
    }
}

module.exports = {
    processOCRWithAPI,
    extractTextFromPdf
};
