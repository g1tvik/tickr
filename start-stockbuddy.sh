#!/bin/bash

echo "🚀 Starting StockBuddy - Complete Development Environment"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Make the script executable
chmod +x start-stockbuddy.js

# Run the startup script
node start-stockbuddy.js 