#!/bin/bash

<<<<<<< Updated upstream
<<<<<<<< Updated upstream:start-stockbuddy.sh
echo "🚀 Starting StockBuddy - Complete Development Environment"
========
=======
>>>>>>> Stashed changes
# Function to check if we're running in Terminal.app or iTerm2
is_terminal_app() {
    if [[ "$TERM_PROGRAM" == "Apple_Terminal" ]] || [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to open a new terminal window if needed
open_terminal_window() {
    if is_terminal_app; then
        # We're already in a terminal, just continue
        return 0
    else
        # We're not in a terminal (e.g., double-clicked), open one
        osascript -e 'tell application "Terminal" to do script "'"$0"'"; tell application "Terminal" to activate'
        exit 0
    fi
}

# Set the title for the terminal (if supported)
echo -e "\033]0;tickr Development Environment\007"

# Check if we need to open a terminal window
open_terminal_window

echo "🚀 Starting tickr - Complete Development Environment"
echo "=================================================="
<<<<<<< Updated upstream
>>>>>>>> Stashed changes:start-tickr.sh
=======
>>>>>>> Stashed changes
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    echo "Press any key to exit..."
    read -n 1 -s
    exit 1
fi

# Display Node.js version
echo "✅ Node.js version: $(node --version)"
echo

# Make the script executable
chmod +x start-stockbuddy.js

# Set environment variable to indicate this is called from shell script
export TICKR_FROM_SHELL=true

# Run the startup script
<<<<<<< Updated upstream
<<<<<<<< Updated upstream:start-stockbuddy.sh
node start-stockbuddy.js 
========
node start-tickr.js
=======
node start-stockbuddy.js
>>>>>>> Stashed changes

# Handle exit codes from the Node.js script
exit_code=$?
if [ $exit_code -eq 999 ]; then
    echo ""
    echo "🔄 Closing terminal..."
    sleep 2
    # Close the terminal window
    osascript -e 'tell application "Terminal" to close front window' 2>/dev/null || true
    exit 0
elif [ $exit_code -ne 0 ]; then
    echo ""
    echo "❌ An error occurred. Press any key to exit..."
    read -n 1 -s
    exit $exit_code
<<<<<<< Updated upstream
fi 
>>>>>>>> Stashed changes:start-tickr.sh
=======
fi
>>>>>>> Stashed changes
