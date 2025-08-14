@echo off
title tickr Development Environment

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Launch the Node.js script with the colored menu
node start-tickr.js

REM Handle exit codes from the Node.js script
if %errorlevel% equ 999 (
    echo.
    echo Closing terminal...
    timeout /t 2 >nul
    exit
) else if %errorlevel% neq 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause >nul
) 