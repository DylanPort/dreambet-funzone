
#!/usr/bin/env node

// This script is a wrapper for vite that ensures the correct version is used
const { spawn } = require('child_process');
const path = require('path');

const viteBinPath = path.resolve(__dirname, '../node_modules/.bin/vite');

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
