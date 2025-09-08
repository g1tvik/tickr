# 🍎 Mac Usage Guide for tickr

## Quick Start Options

You now have several ways to run tickr on Mac, just like the Windows batch files:

### 1. **Double-Click Method** (Easiest)
**Option A: .command files (Recommended)**
- Double-click `tickr-launcher.command` or `stockbuddy-launcher.command` in Finder
- These will automatically open Terminal and run tickr
- Perfect for non-technical users!

**Option B: .app bundle**
- Double-click `tickr.app` in Finder
- This is a proper Mac application bundle
- Also opens Terminal automatically

### 2. **Terminal Method** (Command Line)
```bash
# Navigate to the tickr directory
cd /Users/mac/Desktop/tickr/tickr

# Run tickr
./start-tickr.sh

# Or run stockbuddy
./start-stockbuddy.sh
```

### 3. **Launcher Script** (From Anywhere)
```bash
# Run from anywhere
./launch-tickr.sh
```

### 4. **AppleScript Application** (Advanced)
- Double-click `tickr-launcher.applescript` to create a double-clickable app
- Or compile it in Script Editor to create a standalone `.app` file

## Features

✅ **Full Interactivity**: Same menu system as Windows batch files  
✅ **Auto Terminal**: Opens Terminal automatically when double-clicked  
✅ **Error Handling**: Proper error messages and user prompts  
✅ **Node.js Check**: Verifies Node.js installation  
✅ **Clean Exit**: Properly closes terminal when exiting  
✅ **Cross-Compatible**: Works with Terminal.app and iTerm2  

## What You Get

When you run any of these scripts, you'll see:

```
🚀 Starting tickr - Complete Development Environment
==================================================

✅ Node.js version: v18.x.x

========================================
    tickr Development Environment
========================================
Choose an option:
1. Start Both Services (Full)
2. Start Backend Only
3. Start Frontend Only
4. Quick Restart (Stop and restart both)
5. Check Status
6. Exit
Enter your choice (1-6):
```

## Troubleshooting

- **"Permission denied"**: Run `chmod +x start-tickr.sh` to make it executable
- **"Node.js not found"**: Install Node.js from https://nodejs.org/
- **Terminal doesn't open**: Make sure Terminal.app is installed and accessible

## Pro Tips

- Use `start-tickr.sh` for the main tickr application
- Use `start-stockbuddy.sh` for the stockbuddy variant
- Press `Ctrl+C` to stop services gracefully
- The scripts automatically handle dependencies and installations
