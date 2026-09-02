@echo off
echo Installing required packages...
echo.

python -m pip install pandas openpyxl gdown requests
if errorlevel 1 (
    echo.
    echo ============================================================
    echo Something went wrong. Make sure Python is installed and
    echo added to PATH. Download it from https://www.python.org/downloads/
    echo IMPORTANT: during install, check "Add python.exe to PATH".
    echo ============================================================
) else (
    echo.
    echo Done! You can now double-click "Run Downloader.bat"
)

pause
