
#!/usr/bin/env node

// This script is a wrapper for vite that ensures the correct version is used
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the absolute path to the vite binary
const viteBinPath = path.resolve(__dirname, '../node_modules/.bin/vite');

// Make the vite binary executable (equivalent to chmod +x)
try {
  fs.chmodSync(viteBinPath, '755');
  console.log(`Made vite executable: ${viteBinPath}`);
} catch (error) {
  console.error(`Warning: Unable to make vite executable: ${error.message}`);
}

console.log('Starting Vite development server...');

const args = process.argv.slice(2);
const viteProcess = spawn(viteBinPath, args, { 
  stdio: 'inherit',
  shell: true // Use shell to ensure compatibility across platforms
});

viteProcess.on('error', (error) => {
  console.error(`Error starting Vite: ${error.message}`);
  console.log('Make sure you have run npm install to install all dependencies.');
  process.exit(1);
});

viteProcess.on('close', (code) => {
  process.exit(code);
});
