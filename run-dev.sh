
#!/bin/bash
# This script runs vite from local node_modules

# Ensure the script is executable
chmod +x ./node_modules/.bin/vite

# Run vite with any arguments passed to this script
./node_modules/.bin/vite "$@"

