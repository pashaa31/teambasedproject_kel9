@echo off
title VComp - Vape Companion
cd /d "%~dp0backend"
echo ==========================================
echo   VComp - Vape Companion
echo ==========================================
echo.
if not exist node_modules (
  echo Pertama kali dijalankan. Menginstall kebutuhan...
  call npm install
  if errorlevel 1 (
    echo.
    echo GAGAL menginstall kebutuhan.
    pause
    exit /b 1
  )
)
echo.
echo Menjalankan backend...
start "VComp Backend" cmd /c "npm start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Website dibuka di http://localhost:3000
echo Halaman admin: http://localhost:3000/admin
echo Jangan tutup jendela backend selama demo.
pause
