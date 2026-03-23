@echo off
echo Starting GuardianByte Services...
echo.

echo 1. Starting ML Service...
cd /d "e:\GuardianByte\backend-ml"
start "ML Service" cmd /k "python app-minimal.py"

echo 2. Starting Backend...
cd /d "e:\GuardianByte\backend"
start "Backend" cmd /k "npm start"

echo 3. Starting Frontend...
cd /d "e:\GuardianByte\frontend"
start "Frontend" cmd /k "npm start"

echo.
echo All services started!
echo.
echo Access URLs:
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5001
echo ML Service: http://localhost:5000
echo.
echo Login Credentials:
echo User: raj@example.com / password123
echo Admin: admin@guardianbyte.com / admin123
echo.
pause
