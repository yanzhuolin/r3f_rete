@echo off
setlocal

cd /d "%~dp0"
where pm2 >nul 2>&1
if errorlevel 1 (
  echo PM2 is not installed. Installing globally...
  call npm install -g pm2
  if errorlevel 1 exit /b 1
)

call pm2.cmd describe roll-order-app >nul 2>&1
if not errorlevel 1 call pm2.cmd delete roll-order-app >nul 2>&1
call pm2.cmd start node_modules\next\dist\bin\next --name roll-order-app -- start --hostname 0.0.0.0 --port 3456

call pm2.cmd save
echo [roll-order] App is running on 0.0.0.0:3456
endlocal
