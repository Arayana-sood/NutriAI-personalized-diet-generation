@echo off
echo ===================================================
echo Starting NutriAI Health Prediction System...
echo ===================================================

echo.
echo [1/2] Starting FastAPI Backend server...
start "NutriAI Backend" cmd /k "uvicorn main:app --reload"

echo.
echo [2/2] Opening Frontend website in browser...
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000"

echo.
echo System started successfully!
echo The backend is running in a separate window.
echo The website should have opened in your default browser.
echo You can close this window now.
pause
