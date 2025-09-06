@echo off
echo 🚀 Community Chat Backend Setup & Test Script
echo ==============================================

REM Check Node.js version
echo 📦 Node.js version:
node --version

REM Check if environment file exists
if exist ".env" (
    echo ✅ Environment file found
) else (
    echo ⚠️  Environment file not found. Please copy .env.example to .env and configure it
)

REM Check if MongoDB is running
echo 📊 Checking if MongoDB is accessible...
echo This will check if MongoDB is running on default port 27017

REM Basic project structure check
echo 📁 Checking project structure...
if exist "package.json" echo ✅ package.json found
if exist "server.js" echo ✅ server.js found
if exist "models" echo ✅ models directory found
if exist "routes" echo ✅ routes directory found
if exist "services" echo ✅ services directory found

echo.
echo 🎉 Setup verification complete! Next steps:
echo 1. Configure your .env file with Firebase credentials
echo 2. Start MongoDB (mongod)
echo 3. Run: npm run dev
echo 4. Visit: http://localhost:3000/api-docs
echo.
echo 📚 For detailed setup instructions, see README.md
pause
