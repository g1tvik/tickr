#!/bin/bash

# tickr Launcher Script
# This script provides easy access to tickr from anywhere

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the tickr directory
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "start-tickr.sh" ]; then
    echo "❌ Error: Cannot find start-tickr.sh in the current directory"
    echo "Make sure you're running this from the tickr project directory"
    exit 1
fi

# Launch the main tickr script
echo "🚀 Launching tickr..."
./start-tickr.sh
