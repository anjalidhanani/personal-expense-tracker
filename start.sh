#!/bin/bash

# Personal Expense Tracker Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting Personal Expense Tracker Web Application..."
echo "====================================================="

# Check if setup has been run
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "❌ Dependencies not installed. Please run ./setup.sh first"
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please copy .env.example to .env and configure it"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to kill background processes on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server
echo ""
echo "🔧 Starting Backend Server..."
echo "=============================="
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend server started (PID: $BACKEND_PID)"
echo "📍 Backend running at: http://localhost:5000"

# Wait a moment for backend to start
sleep 3

# Start Frontend Server
echo ""
echo "🎨 Starting Frontend Server..."
echo "==============================="
cd ../frontend
ng serve --host 0.0.0.0 --port 4200 &
FRONTEND_PID=$!
echo "✅ Frontend server started (PID: $FRONTEND_PID)"
echo "📍 Frontend running at: http://localhost:4200"

echo ""
echo "🎉 Both servers are running!"
echo "============================"
echo ""
echo "📱 Open your browser and navigate to: http://localhost:4200"
echo ""
echo "🔐 Default admin credentials:"
echo "   Email: admin@expensetracker.com"
echo "   Password: admin123"
echo ""
echo "💡 Tips:"
echo "   - Backend API: http://localhost:5000/api"
echo "   - Health check: http://localhost:5000/api/health"
echo "   - Press Ctrl+C to stop both servers"
echo ""
echo "📊 Server logs will appear below..."
echo "==================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
