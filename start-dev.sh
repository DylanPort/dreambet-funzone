
#!/bin/bash
# Custom start script that runs the application without modifying package.json

# Make this script executable
chmod +x "$0"

# Make run-dev.sh executable
chmod +x ./run-dev.sh

# Run the application using node to execute vite-wrapper.js
node ./scripts/vite-wrapper.js
