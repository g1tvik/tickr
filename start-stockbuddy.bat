@echo off
title StockBuddy Development Environment

:menu
cls
echo.
echo ========================================
echo    StockBuddy Development Environment
echo ========================================
echo.
echo Choose an option:
echo 1. Start Both Services (Full startup)
echo 2. Start Backend Only
echo 3. Start Frontend Only
echo 4. Quick Restart (Stop and restart both)
echo 5. Check Status
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

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
    echo Starting Backend Only...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Run the startup script with backend only
    node start-stockbuddy.js
) else if "%choice%"=="3" (
    echo.
    echo Starting Frontend Only...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Run the startup script with frontend only
    node start-stockbuddy.js
) else if "%choice%"=="4" (
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
) else if "%choice%"=="5" (
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
    goto menu
) else if "%choice%"=="6" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto menu
)

REM Keep the window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo Press any key to exit...
    pause >nul
) 