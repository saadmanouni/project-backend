#!/bin/bash

echo "🎮 Starting Shadow of the Diagnosis..."
echo ""
echo "Starting backend server on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 3

echo ""
echo "Starting frontend server on port 5173..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Game servers started!"
echo ""
echo "📋 Access the game:"
echo "   Players: http://localhost:5173"
echo "   Admin:   http://localhost:5173?admin=true"
echo ""
echo "Press Ctrl+C to stop all servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait
