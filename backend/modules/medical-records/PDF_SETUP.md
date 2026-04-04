# PDF to PNG Conversion Setup Guide

## Overview
This guide explains how to set up PDF to PNG conversion for medical records OCR processing. The system automatically converts PDF files to PNG images before running OCR, ensuring compatibility with Tesseract OCR.

## How It Works

1. **File Upload**: User uploads a medical record (PDF or image)
2. **File Type Detection**: System checks if file is PDF
3. **PDF Conversion**: If PDF, converts each page to PNG image
4. **OCR Processing**: Runs OCR on PNG images (one per page)
5. **Text Extraction**: Combines text from all pages
6. **Cleanup**: Removes temporary files

## Installation Steps

### Windows Installation

#### Option 1: Using Chocolatey (Recommended)
```bash
# Install Chocolatey if not already installed
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Poppler
choco install poppler
```

#### Option 2: Manual Installation
1. Download Poppler for Windows from: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract the ZIP file to `C:\Program Files\poppler`
3. Add Poppler to PATH:
   - Open System Properties → Environment Variables
   - Edit "Path" variable
   - Add: `C:\Program Files\poppler\Library\bin`
4. Restart your terminal/IDE

#### Verify Installation
```bash
# Check if Poppler is installed correctly
pdftoppm -v
```

### macOS Installation
```bash
# Using Homebrew
brew install poppler
```

### Linux Installation
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install poppler-utils

# CentOS/RHEL
sudo yum install poppler-utils

# Fedora
sudo dnf install poppler-utils
```

## Install Node.js Package

After installing Poppler system dependency, install the npm package:

```bash
cd backend
npm install pdf-poppler
```

## Testing

### Test PDF Conversion
Create a test file `backend/test-pdf-conversion.js`:

```javascript
const { convertPdfToPng } = require('./modules/medical-records/services/ocr.service');
const fs = require('fs').promises;

async function testConversion() {
    try {
        // Read a sample PDF
        const pdfBuffer = await fs.readFile('./sample.pdf');
        const base64Pdf = pdfBuffer.toString('base64');
        
        console.log('Converting PDF to PNG...');
        const pngImages = await convertPdfToPng(base64Pdf);
        
        console.log(`Success! Converted to ${pngImages.length} PNG images`);
        console.log(`First image size: ${pngImages[0].length} bytes`);
    } catch (error) {
        console.error('Conversion failed:', error.message);
    }
}

testConversion();
```

Run the test:
```bash
node test-pdf-conversion.js
```

## Troubleshooting

### Error: "spawn pdftoppm ENOENT"
- **Cause**: Poppler is not installed or not in PATH
- **Solution**: Follow installation steps above and verify with `pdftoppm -v`

### Error: "PDF conversion failed"
- **Cause**: Corrupted PDF or unsupported format
- **Solution**: Try with a different PDF file, ensure it's a valid PDF

### Error: "EACCES: permission denied"
- **Cause**: No write permission to temp directory
- **Solution**: Ensure `backend/temp/` directory exists and is writable

### Large PDF Files
- PDFs with many pages may take longer to process
- Consider implementing pagination or limiting page count
- Current timeout is 30 seconds per document

## Configuration

### Environment Variables
No additional environment variables needed. The system uses:
- `OCR_SPACE_API_KEY`: For OCR processing (already configured)

### Temp Directory
- Location: `backend/temp/`
- Auto-created if doesn't exist
- Files are automatically cleaned up after processing

## Performance Considerations

### File Size Limits
- Recommended max PDF size: 10MB
- Recommended max pages: 50 pages
- Larger files may timeout in serverless environments

### Optimization Tips
1. **Compress PDFs**: Use PDF compression before upload
2. **Limit Pages**: Process only relevant pages
3. **Async Processing**: OCR runs asynchronously, doesn't block upload
4. **Cleanup**: Temp files are auto-deleted after processing

## Production Deployment

### Vercel/Serverless
- Poppler must be included in deployment
- Use custom build with Poppler binaries
- Consider using Lambda layers for AWS

### Docker
Add to Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y poppler-utils
```

### Traditional Server
- Install Poppler using package manager
- Ensure sufficient disk space for temp files
- Monitor temp directory for cleanup

## API Usage

The conversion is automatic. Just upload a PDF:

```javascript
// Frontend - Upload PDF
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('case', caseId);
formData.append('documentType', 'Medical Report');

await medicalRecordService.upload(formData);
```

Backend automatically:
1. Detects PDF format
2. Converts to PNG
3. Runs OCR on each page
4. Returns extracted text

## Support

For issues or questions:
1. Check Poppler installation: `pdftoppm -v`
2. Verify temp directory permissions
3. Check backend logs for detailed error messages
4. Test with a simple PDF first
