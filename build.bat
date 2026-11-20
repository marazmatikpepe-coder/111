@echo off
chcp 65001 >nul
echo === SKVERNA: сборка установщика для Windows ===
where node >nul 2>nul || (echo Установите Node.js с https://nodejs.org и запустите снова & pause & exit /b 1)
call npm install || (echo Ошибка npm install & pause & exit /b 1)
call npm run dist || (echo Ошибка сборки & pause & exit /b 1)
echo.
echo Готово! Установщик лежит в папке dist
pause
