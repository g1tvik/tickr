-- tickr Launcher AppleScript
-- This creates a double-clickable application for tickr

tell application "Terminal"
    -- Get the directory where this script is located
    set scriptPath to POSIX path of (path to me)
    set scriptDir to do shell script "dirname " & quoted form of scriptPath
    
    -- Create a new terminal window and run the tickr script
    do script "cd '" & scriptDir & "' && ./start-tickr.sh"
    
    -- Activate Terminal to bring it to the front
    activate
end tell
