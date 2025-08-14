# tickr Startup Guide

## 🚀 Quick Start Options

### Option 1: Interactive Menu (Recommended)
Double-click `start-tickr.bat` for a menu with options:
- **Start Both Services** - Full startup with dependency checks
- **Start Backend Only** - Start just the API server
- **Start Frontend Only** - Start just the React development server
- **Quick Restart** - Stop and restart both services quickly
- **Check Status** - Verify if services are running (returns to menu)
- **Exit** - Close the menu

### Option 2: Command Line
```bash
# Interactive menu with all options
node start-stockbuddy.js

# Quick restart (stops existing services first)
node restart-tickr.js

# Check if services are running
node check-status.js
```

### Option 3: Unix/Linux/macOS
```bash
# Full startup
./start-stockbuddy.sh

# Quick restart
node restart-tickr.js
```

## 🔄 Restart Features

### Interactive Menu Options
When you run `node start-tickr.js`, you'll see:
```
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

### Built-in Restart Option
When you press `Ctrl+C` to stop the services, you'll see:
```
🔄 tickr Services Stopped
What would you like to do?
1. Restart tickr
2. Exit
Enter your choice (1 or 2):
```

### Quick Restart Script
The `restart-tickr.js` script:
- ✅ Automatically stops existing services
- ✅ Frees up ports 5001 and 5173
- ✅ Starts both backend and frontend
- ✅ Shows real-time service output
- ✅ Handles errors gracefully

## 📊 Service Status

### Backend (Port 5001)
- **URL**: http://localhost:5001
- **Purpose**: API server for stock data and trading
- **Features**: Stock quotes, company info, trading operations

### Frontend (Port 5173)
- **URL**: http://localhost:5173
- **Purpose**: React development server
- **Features**: User interface, real-time updates

## 🛠 Troubleshooting

### Services Won't Start
1. **Check Node.js**: Make sure Node.js is installed
2. **Check Ports**: Ensure ports 5001 and 5173 are free
3. **Check Dependencies**: Run `npm install` in both directories
4. **Check Logs**: Look for error messages in the console

### Port Already in Use
```bash
# Windows - Find process using port
netstat -ano | findstr :5001
netstat -ano | findstr :5173

# Kill process by PID
taskkill /PID <PID> /F
```

### Quick Fix Commands
```bash
# Install dependencies
cd auth-backend && npm install
cd ../stockbuddy && npm install

# Check status
node check-status.js

# Force restart
node restart-tickr.js
```

## 🎯 Usage Tips

### Development Workflow
1. **Start**: Run `node start-tickr.js` and choose option 1
2. **Develop**: Make changes to your code
3. **Restart**: Press `Ctrl+C` and choose "Restart tickr"
4. **Test**: Open http://localhost:5173 in your browser

### Individual Service Development
- **Backend Only**: Choose option 2 to start just the API server
- **Frontend Only**: Choose option 3 to start just the React server
- **Status Check**: Choose option 5 to check what's running

### Quick Development Cycle
```bash
# Start services
node start-tickr.js

# Make code changes...

# Quick restart (faster than full startup)
node restart-tickr.js
```

### Monitoring Services
```bash
# Check if everything is running
node check-status.js

# Expected output:
# ✅ Backend API is running (200)
# ✅ Frontend App is running (200)
```

## 📁 File Structure
```
thisisgoingtowork/
├── start-tickr.js      # Main startup script
├── restart-tickr.js    # Quick restart script
├── check-status.js          # Status checker
├── start-tickr.bat     # Windows menu
├── start-tickr.sh      # Unix startup script
└── STARTUP_GUIDE.md        # This guide
```

## 🚨 Common Issues

### "Port already in use"
- Use `restart-tickr.js` to automatically free ports
- Or manually kill processes using the port

### "Module not found"
- Run `npm install` in both `auth-backend` and `tickr` directories
- The startup script will do this automatically if needed

### "Connection refused"
- Services might not have started yet
- Wait a moment and try again
- Check the console for error messages

### "Timeout" messages
- Normal for first startup
- Services are still starting up
- Wait a few more seconds

## 🎉 Success Indicators

When everything is working, you should see:
- ✅ Backend and Frontend services running
- 📱 Frontend accessible at http://localhost:5173
- 🔧 Backend API responding at http://localhost:5001
- 📊 Stock data loading in the application

Happy coding! 🚀 