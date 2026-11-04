@echo off
rem Opens the Student Tools site in edit mode: click any text to change it.
rem Changes save into the site's files; use the Publish button to update Vercel.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to run the editor. Get it from https://nodejs.org
  pause
  exit /b 1
)
start "" http://localhost:5500
node server.js
pause
