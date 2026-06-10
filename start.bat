@echo off
REM ============================================================
REM  Tickr launcher  -  double-click this file to run the site
REM  - Backend  (auth-backend / Express)  ->  http://localhost:5001
REM  - Frontend (stockbuddy / Vite+React) ->  http://localhost:5173
REM ============================================================

title Tickr launcher
cd /d "%~dp0"

echo Starting Tickr backend (port 5001)...
start "Tickr backend" cmd /k "cd /d "%~dp0auth-backend" && npm start"

echo Starting Tickr frontend (port 5173)...
start "Tickr frontend" cmd /k "cd /d "%~dp0stockbuddy" && npm run dev"

echo Waiting for the dev server to come up...
timeout /t 5 /nobreak >nul

echo Opening http://localhost:5173 ...
start "" "http://localhost:5173"

echo.
echo Tickr is launching. Two terminal windows opened (backend + frontend).
echo Close those windows to stop the site.
exit
