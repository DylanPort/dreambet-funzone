
#!/bin/bash
# This script runs vite from local node_modules

# Make sure we're using the correct node version
if command -v nvm &> /dev/null; then
  nvm use 18 || true
fi

# Try to find vite in different locations
VITE_PATH="./node_modules/.bin/vite"
VITE_ALT_PATH="./node_modules/vite/bin/vite.js"

if [ -f "$VITE_PATH" ]; then
  # Ensure the script is executable
  chmod +x "$VITE_PATH"
  
  # Run vite with any arguments passed to this script
  "$VITE_PATH" "$@"
elif [ -f "$VITE_ALT_PATH" ]; then
  # If the standard path doesn't exist, try the alternative location
  chmod +x "$VITE_ALT_PATH"
  node "$VITE_ALT_PATH" "$@"
else
  # If vite is not found in the expected locations, try using npx
  echo "Vite executable not found in local node_modules. Trying with npx..."
  npx vite "$@"
fi
