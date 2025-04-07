
#!/bin/bash
# Custom start script that runs the application without modifying package.json

# Make this script executable
chmod +x "$0"

# Make vite executable
chmod +x ./node_modules/.bin/vite

# Make run-dev.sh executable
chmod +x ./run-dev.sh

# Run the application using the node_modules/.bin/vite directly
./node_modules/.bin/vite

# Alternative methods if the above doesn't work
# Method 2: Use the run-dev.sh script
# ./run-dev.sh

# Method 3: Use the vite-wrapper.js script
# node ./scripts/vite-wrapper.js

