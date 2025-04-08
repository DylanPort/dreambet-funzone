
#!/usr/bin/env node

// This script is a wrapper for vite that ensures the correct version is used
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check several possible locations for the vite executable
const possiblePaths = [
  path.resolve(__dirname, '../node_modules/.bin/vite'),
  path.resolve(__dirname, '../node_modules/vite/bin/vite.js'),
  'vite' // Let the system try to find it
];

// Function to check if a file exists and is executable
function isExecutable(filePath) {
  try {
    if (filePath === 'vite') return true; // Skip check for system path
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Find the first valid vite path
const vitePath = possiblePaths.find(isExecutable);

if (!vitePath) {
  console.error('Error: Vite executable not found in any expected location');
  console.log('Attempting to run vite using npx as a last resort...');
  
  // Try to run vite using npx as a fallback
  const args = process.argv.slice(2);
  const viteProcess = spawn('npx', ['vite', ...args], { stdio: 'inherit' });
  
  viteProcess.on('error', (error) => {
    console.error(`Error starting Vite with npx: ${error.message}`);
    console.log('Please run "npm install" to install all dependencies.');
    process.exit(1);
  });
  
  viteProcess.on('close', (code) => {
    process.exit(code);
  });
} else {
  // Use the found vite installation
  const args = process.argv.slice(2);
  const command = vitePath === 'vite' ? 'vite' : process.execPath;
  const scriptArgs = vitePath === 'vite' ? args : [vitePath, ...args];
  
  console.log(`Starting Vite from: ${vitePath}`);
  
  const viteProcess = spawn(command, scriptArgs, { 
    stdio: 'inherit',
    shell: vitePath === 'vite' // Use shell for system path
  });

  viteProcess.on('error', (error) => {
    console.error(`Error starting Vite: ${error.message}`);
    console.log('Make sure you have run "npm install" to install all dependencies.');
    console.log('If the problem persists, try manually running "npx vite"');
    process.exit(1);
  });

  viteProcess.on('close', (code) => {
    process.exit(code);
  });
}
