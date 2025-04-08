
#!/bin/bash
# This script runs vite from local node_modules

# Make sure we're using the correct node version
if command -v nvm &> /dev/null; then
  nvm use 18 || true
fi

# Ensure the vite binary path exists
VITE_PATH="./node_modules/.bin/vite"
if [ ! -f "$VITE_PATH" ]; then
  echo "Error: Vite executable not found at $VITE_PATH"
  echo "Make sure you have run 'npm install' to install all dependencies."
  exit 1
fi

# Ensure the script is executable
chmod +x "$VITE_PATH"

# Run vite with any arguments passed to this script
"$VITE_PATH" "$@"
