# Tickr Launch Manager
# Simple and elegant launcher for Tickr services

$ErrorActionPreference = 'Stop'

# Get project paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
$BackendDir = Join-Path $ProjectRoot 'auth-backend'
$FrontendDir = Join-Path $ProjectRoot 'stockbuddy'
$LogsDir = Join-Path $ProjectRoot 'logs'

# Ensure logs directory exists
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

# Process tracking
$script:BackendProcess = $null
$script:FrontendProcess = $null

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host "     TICKR LAUNCH MANAGER" -ForegroundColor Cyan
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Status {
    Write-Host "  Status:" -ForegroundColor Gray
    $backendRunning = $script:BackendProcess -ne $null -and (Get-Process -Id $script:BackendProcess.Id -ErrorAction SilentlyContinue)
    $frontendRunning = $script:FrontendProcess -ne $null -and (Get-Process -Id $script:FrontendProcess.Id -ErrorAction SilentlyContinue)
    
    if ($backendRunning) {
        Write-Host "    Backend  : " -NoNewline -ForegroundColor Gray
        Write-Host "[RUNNING]" -ForegroundColor Green -NoNewline
        Write-Host " http://localhost:5001" -ForegroundColor DarkGray
    } else {
        Write-Host "    Backend  : " -NoNewline -ForegroundColor Gray
        Write-Host "[STOPPED]" -ForegroundColor Red
        $script:BackendProcess = $null
    }
    
    if ($frontendRunning) {
        Write-Host "    Frontend : " -NoNewline -ForegroundColor Gray
        Write-Host "[RUNNING]" -ForegroundColor Green -NoNewline
        Write-Host " http://localhost:5173" -ForegroundColor DarkGray
    } else {
        Write-Host "    Frontend : " -NoNewline -ForegroundColor Gray
        Write-Host "[STOPPED]" -ForegroundColor Red
        $script:FrontendProcess = $null
    }
    Write-Host ""
}

function Start-Backend {
    if ($script:BackendProcess -ne $null -and (Get-Process -Id $script:BackendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  Backend is already running." -ForegroundColor Yellow
        return
    }
    
    Write-Host "  Starting backend..." -ForegroundColor Cyan
    
    # Install dependencies
    Push-Location $BackendDir
    npm install | Out-Null
    Pop-Location
    
    # Start backend
    $backendOut = Join-Path $LogsDir 'backend.out.log'
    $backendErr = Join-Path $LogsDir 'backend.err.log'
    $script:BackendProcess = Start-Process -FilePath "node" -ArgumentList "server.js" `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $backendOut `
        -RedirectStandardError $backendErr `
        -WindowStyle Hidden `
        -PassThru
    
    Start-Sleep -Seconds 2
    
    if ($script:BackendProcess -ne $null -and (Get-Process -Id $script:BackendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  [OK] Backend started" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Failed to start backend" -ForegroundColor Red
        $script:BackendProcess = $null
    }
}

function Start-Frontend {
    if ($script:FrontendProcess -ne $null -and (Get-Process -Id $script:FrontendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  Frontend is already running." -ForegroundColor Yellow
        return
    }
    
    Write-Host "  Starting frontend..." -ForegroundColor Cyan
    
    # Install dependencies
    Push-Location $FrontendDir
    npm install | Out-Null
    Pop-Location
    
    # Start frontend
    $frontendOut = Join-Path $LogsDir 'frontend.out.log'
    $frontendErr = Join-Path $LogsDir 'frontend.err.log'
    $script:FrontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $frontendOut `
        -RedirectStandardError $frontendErr `
        -WindowStyle Hidden `
        -PassThru
    
    Start-Sleep -Seconds 3
    
    if ($script:FrontendProcess -ne $null -and (Get-Process -Id $script:FrontendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  [OK] Frontend started" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Failed to start frontend" -ForegroundColor Red
        $script:FrontendProcess = $null
    }
}

function Stop-Backend {
    if ($script:BackendProcess -eq $null -or -not (Get-Process -Id $script:BackendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  Backend is not running." -ForegroundColor Yellow
        return
    }
    
    Write-Host "  Stopping backend..." -ForegroundColor Cyan
    Stop-Process -Id $script:BackendProcess.Id -Force -ErrorAction SilentlyContinue
    $script:BackendProcess = $null
    Write-Host "  [OK] Backend stopped" -ForegroundColor Green
}

function Stop-Frontend {
    if ($script:FrontendProcess -eq $null -or -not (Get-Process -Id $script:FrontendProcess.Id -ErrorAction SilentlyContinue)) {
        Write-Host "  Frontend is not running." -ForegroundColor Yellow
        return
    }
    
    Write-Host "  Stopping frontend..." -ForegroundColor Cyan
    Stop-Process -Id $script:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
    $script:FrontendProcess = $null
    Write-Host "  [OK] Frontend stopped" -ForegroundColor Green
}

function Show-Menu {
    Write-Host "  Options:" -ForegroundColor Gray
    Write-Host "    1. Start All" -ForegroundColor White
    Write-Host "    2. Stop All" -ForegroundColor White
    Write-Host "    3. Start Backend" -ForegroundColor White
    Write-Host "    4. Stop Backend" -ForegroundColor White
    Write-Host "    5. Start Frontend" -ForegroundColor White
    Write-Host "    6. Stop Frontend" -ForegroundColor White
    Write-Host "    7. Open URLs" -ForegroundColor White
    Write-Host "    0. Exit" -ForegroundColor White
    Write-Host ""
}

# Main loop
while ($true) {
    Write-Header
    Show-Status
    Show-Menu
    
    $choice = Read-Host "  Enter choice"
    
    switch ($choice) {
        '1' { Start-Backend; Start-Frontend }
        '2' { Stop-Backend; Stop-Frontend }
        '3' { Start-Backend }
        '4' { Stop-Backend }
        '5' { Start-Frontend }
        '6' { Stop-Frontend }
        '7' {
            if ($script:BackendProcess -ne $null) { Start-Process "http://localhost:5001" }
            if ($script:FrontendProcess -ne $null) { Start-Process "http://localhost:5173" }
            Write-Host "  [OK] URLs opened" -ForegroundColor Green
        }
        '0' {
            Stop-Backend
            Stop-Frontend
            Write-Host ""
            Write-Host "  Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host "  Invalid choice." -ForegroundColor Red
        }
    }
    
    if ($choice -ne '0') {
        Write-Host ""
        Read-Host "  Press Enter to continue"
    }
}
