@echo off
echo ---------------------------------------------------
echo Starting React Frontend...
echo ---------------------------------------------------

cd "%~dp0frontend"
:: call npm install
call npm run dev -- --host
:: pause
