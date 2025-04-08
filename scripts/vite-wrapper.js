
#!/usr/bin/env node

// This script is a wrapper for vite that ensures the correct version is used
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to the vite executable
const viteBinPath = path.resolve(__dirname, '../node_modules/.bin/vite');

// Check if the vite executable exists
if (!fs.existsSync(viteBinPath)) {
  console.error(`Error: Vite executable not found at ${viteBinPath}`);
  console.log('Make sure you have run npm install to install all dependencies.');
  console.log('Attempting to run vite using global installation...');
  
  // Try to run vite using npx as a fallback
  const args = process.argv.slice(2);
  const viteProcess = spawn('npx', ['vite', ...args], { stdio: 'inherit' });
  
  viteProcess.on('error', (error) => {
    console.error(`Error starting Vite with npx: ${error.message}`);
    console.log('Please run npm install to install all dependencies.');
    process.exit(1);
  });
  
  viteProcess.on('close', (code) => {
    process.exit(code);
  });
} else {
  // Use the local vite installation
  const args = process.argv.slice(2);
  const viteProcess = spawn(viteBinPath, args, { stdio: 'inherit' });

  viteProcess.on('error', (error) => {
    console.error(`Error starting Vite: ${error.message}`);
    console.log('Make sure you have run npm install to install all dependencies.');
    process.exit(1);
  });

  viteProcess.on('close', (code) => {
    process.exit(code);
  });
}
