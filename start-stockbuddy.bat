@echo off
title StockBuddy Development Environment
echo.
echo ========================================
echo    StockBuddy Development Environment
echo ========================================
echo.
echo Choose an option:
echo 1. Start StockBuddy (Full startup)
echo 2. Quick Restart (Stop and restart)
echo 3. Check Status
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting StockBuddy - Complete Development Environment...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Run the startup script
    node start-stockbuddy.js
) else if "%choice%"=="2" (
    echo.
    echo Quick Restart - StockBuddy Services...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Run the restart script
    node restart-stockbuddy.js
) else if "%choice%"=="3" (
    echo.
    echo Checking StockBuddy Status...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Run the status checker
    node check-status.js
    echo.
    echo Press any key to return to menu...
    pause >nul
    goto :eof
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)

REM Keep the window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo Press any key to exit...
    pause >nul
) 