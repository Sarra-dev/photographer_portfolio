@echo off
echo === Coastal Studio — Backend ===
cd /d "%~dp0backend"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server on http://localhost:5000
echo.
python app.py
pause
