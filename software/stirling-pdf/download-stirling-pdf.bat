@echo off
rem Downloads Stirling-PDF.jar into this folder. Safe to run again: it resumes where it stopped.
cd /d "%~dp0"
curl.exe -L --fail -C - --retry 20 --retry-delay 5 --retry-all-errors -o Stirling-PDF.jar https://github.com/Stirling-Tools/Stirling-PDF/releases/download/v3.1.0/Stirling-PDF.jar
if errorlevel 1 (
  echo Download stopped. Run this file again to continue.
) else (
  echo Download complete.
)
