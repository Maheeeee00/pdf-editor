@echo off
rem Starts Stirling PDF on http://localhost:8080 (needs Java 25 and Stirling-PDF.jar in this folder)
cd /d "%~dp0"
if not exist "Stirling-PDF.jar" (
  echo Stirling-PDF.jar not found in %~dp0
  echo Run download-stirling-pdf.bat first.
  pause
  exit /b 1
)
for %%F in ("Stirling-PDF.jar") do if %%~zF LSS 100000000 (
  echo Stirling-PDF.jar is incomplete ^(%%~zF bytes^). Run download-stirling-pdf.bat again.
  pause
  exit /b 1
)

rem Prefer an installed Java 25, even if an older Java comes first on PATH.
set "JAVA=java"
for /d %%D in ("%ProgramFiles%\Eclipse Adoptium\jre-25*" "%ProgramFiles%\Eclipse Adoptium\jdk-25*") do set "JAVA=%%~D\bin\java.exe"
if "%JAVA%"=="java" (
  where java >nul 2>nul
  if errorlevel 1 (
    echo Java 25 is not installed.
    echo Install it with:  winget install EclipseAdoptium.Temurin.25.JRE
    pause
    exit /b 1
  )
)

echo Starting Stirling PDF... open http://localhost:8080 in about a minute.
"%JAVA%" -jar Stirling-PDF.jar
pause
