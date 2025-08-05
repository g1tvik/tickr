@echo off
title StockBuddy Development Environment
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

REM Keep the window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo Press any key to exit...
    pause >nul
) 