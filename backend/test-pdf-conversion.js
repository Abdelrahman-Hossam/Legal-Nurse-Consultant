/**
 * Test PDF to PNG Conversion
 * This script tests the PDF conversion functionality
 */

const fs = require('fs').promises;
const path = require('path');

async function testPdfConversion() {
    console.log('========================================');
    console.log('PDF to PNG Conversion Test');
    console.log('========================================\n');

    try {
        // Check if Poppler is installed
        const { execSync } = require('child_process');
        try {
            const version = execSync('pdftoppm -v', { encoding: 'utf8' });
            console.log('✓ Poppler is installed');
            console.log(version);
        } catch (error) {
            console.error('✗ Poppler is NOT installed or not in PATH');
            console.error('Please run: install-poppler-windows.ps1 (as Administrator)');
            console.error('Or install manually: https://github.com/oschwartz10612/poppler-windows/releases/');
            return;
        }

        // Load OCR service
        console.log('\n✓ Loading OCR service...');
        const { convertPdfToPng } = require('./modules/medical-records/services/ocr.service');

        // Create a simple test PDF (base64 encoded)
        // This is a minimal valid PDF with "Hello World" text
        const testPdfBase64 = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA1IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDQgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUCi9GMSA0OCBUZgoxMCA3MDAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvVGltZXMtUm9tYW4+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1szIDAgUl0+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKNiAwIG9iago8PC9Qcm9kdWNlcihQREYgVGVzdCkvQ3JlYXRpb25EYXRlKEQ6MjAyNDAxMDEpPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI5NyAwMDAwMCBuIAowMDAwMDAwMjQ2IDAwMDAwIG4gCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDEyNyAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCjAwMDAwMDAzNDYgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDcvUm9vdCAxIDAgUi9JbmZvIDYgMCBSPj4Kc3RhcnR4cmVmCjQxMQolJUVPRgo=';

        console.log('✓ Test PDF loaded (1 page, "Hello World")');

        // Test conversion
        console.log('\n→ Converting PDF to PNG...');
        const startTime = Date.now();
        const pngImages = await convertPdfToPng(testPdfBase64);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✓ Conversion successful in ${duration}s`);
        console.log(`✓ Generated ${pngImages.length} PNG image(s)`);
        console.log(`✓ First image size: ${Math.round(pngImages[0].length / 1024)} KB`);

        // Save first image for inspection (optional)
        const outputPath = path.join(__dirname, 'test-output.png');
        await fs.writeFile(outputPath, Buffer.from(pngImages[0], 'base64'));
        console.log(`✓ Saved test image to: ${outputPath}`);

        console.log('\n========================================');
        console.log('✓ ALL TESTS PASSED!');
        console.log('========================================');
        console.log('\nYour system is ready to process PDF medical records.');
        console.log('PDFs will be automatically converted to PNG before OCR.');

    } catch (error) {
        console.error('\n✗ TEST FAILED');
        console.error('Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Ensure Poppler is installed: pdftoppm -v');
        console.error('2. Restart your terminal/IDE after installing Poppler');
        console.error('3. Check that PATH includes Poppler bin directory');
        console.error('4. Run: npm install pdf-poppler');
        console.error('\nSee PDF_SETUP.md for detailed instructions.');
    }
}

// Run test
testPdfConversion();
