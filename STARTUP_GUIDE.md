# StockBuddy Startup Guide

## 🚀 Quick Start Options

### Option 1: Interactive Menu (Recommended)
Double-click `start-stockbuddy.bat` for a menu with options:
- **Start StockBuddy** - Full startup with dependency checks
- **Quick Restart** - Stop and restart services quickly
- **Check Status** - Verify if services are running
- **Exit** - Close the menu

### Option 2: Command Line
```bash
# Full startup with restart option
node start-stockbuddy.js

# Quick restart (stops existing services first)
node restart-stockbuddy.js

# Check if services are running
node check-status.js
```

### Option 3: Unix/Linux/macOS
```bash
# Full startup
./start-stockbuddy.sh

# Quick restart
node restart-stockbuddy.js
```

## 🔄 Restart Features

### Built-in Restart Option
When you press `Ctrl+C` to stop the services, you'll see:
```
🔄 StockBuddy Services Stopped
What would you like to do?
1. Restart StockBuddy
2. Exit
Enter your choice (1 or 2):
```

### Quick Restart Script
The `restart-stockbuddy.js` script:
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
node restart-stockbuddy.js
```

## 🎯 Usage Tips

### Development Workflow
1. **Start**: Run `node start-stockbuddy.js`
2. **Develop**: Make changes to your code
3. **Restart**: Press `Ctrl+C` and choose "Restart StockBuddy"
4. **Test**: Open http://localhost:5173 in your browser

### Quick Development Cycle
```bash
# Start services
node start-stockbuddy.js

# Make code changes...

# Quick restart (faster than full startup)
node restart-stockbuddy.js
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
├── start-stockbuddy.js      # Main startup script
├── restart-stockbuddy.js    # Quick restart script
├── check-status.js          # Status checker
├── start-stockbuddy.bat     # Windows menu
├── start-stockbuddy.sh      # Unix startup script
└── STARTUP_GUIDE.md        # This guide
```

## 🚨 Common Issues

### "Port already in use"
- Use `restart-stockbuddy.js` to automatically free ports
- Or manually kill processes using the port

### "Module not found"
- Run `npm install` in both `auth-backend` and `stockbuddy` directories
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