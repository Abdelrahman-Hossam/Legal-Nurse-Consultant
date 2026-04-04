# Poppler Installation Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Poppler Installation for Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if Chocolatey is installed
Write-Host "Checking for Chocolatey..." -ForegroundColor Yellow
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "✓ Chocolatey is installed" -ForegroundColor Green
    
    # Install Poppler using Chocolatey
    Write-Host ""
    Write-Host "Installing Poppler via Chocolatey..." -ForegroundColor Yellow
    choco install poppler -y
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Poppler installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Poppler installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Chocolatey is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Install Chocolatey (Recommended)" -ForegroundColor Cyan
    Write-Host "Run this command in PowerShell as Administrator:" -ForegroundColor Yellow
    Write-Host 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString("https://community.chocolatey.org/install.ps1"))' -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 2: Manual Installation" -ForegroundColor Cyan
    Write-Host "1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases/" -ForegroundColor White
    Write-Host "2. Extract to C:\Program Files\poppler" -ForegroundColor White
    Write-Host "3. Add C:\Program Files\poppler\Library\bin to PATH" -ForegroundColor White
    exit 1
}

# Verify installation
Write-Host ""
Write-Host "Verifying Poppler installation..." -ForegroundColor Yellow
$popplerInstalled = Get-Command pdftoppm -ErrorAction SilentlyContinue

if ($popplerInstalled) {
    Write-Host "✓ Poppler is working correctly!" -ForegroundColor Green
    Write-Host ""
    pdftoppm -v
} else {
    Write-Host "✗ Poppler verification failed" -ForegroundColor Red
    Write-Host "You may need to restart your terminal/IDE" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal/IDE" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Test PDF upload in the application" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
