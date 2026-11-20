@echo off
chcp 65001 >nul
where node >nul 2>nul || (echo Установите Node.js с https://nodejs.org и запустите снова & pause & exit /b 1)
if not exist node_modules (call npm install)
call npm start
