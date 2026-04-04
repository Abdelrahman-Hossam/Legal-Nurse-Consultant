# Quick PDF OCR Setup

## What Changed
PDFs are now automatically converted to PNG images before OCR processing. This ensures compatibility with all OCR engines and improves text extraction quality.

## Installation (Windows)

### Quick Install (Recommended)
```powershell
# Run PowerShell as Administrator
.\install-poppler-windows.ps1
```

### Manual Install
1. Download: https://github.com/oschwartz10612/poppler-windows/releases/
2. Extract to `C:\Program Files\poppler`
3. Add to PATH: `C:\Program Files\poppler\Library\bin`
4. Restart terminal

### Install npm package
```bash
npm install
```

## Test Installation
```bash
# Verify Poppler
pdftoppm -v

# Test conversion
node test-pdf-conversion.js
```

## How It Works
1. User uploads PDF medical record
2. System detects PDF format
3. Converts each page to PNG
4. Runs OCR on PNG images
5. Combines text from all pages
6. Cleans up temp files

## Usage
No code changes needed! Just upload PDFs as before:
- Frontend uploads PDF normally
- Backend automatically converts to PNG
- OCR processes each page
- Returns extracted text

## Files Modified
- `backend/modules/medical-records/services/ocr.service.js` - Added PDF conversion
- `backend/package.json` - Added pdf-poppler dependency

## Troubleshooting
- **"spawn pdftoppm ENOENT"**: Poppler not installed or not in PATH
- **"PDF conversion failed"**: Invalid PDF file
- **Timeout errors**: PDF too large (>10MB or >50 pages)

See `backend/modules/medical-records/PDF_SETUP.md` for detailed guide.
