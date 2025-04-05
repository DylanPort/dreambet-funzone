
#!/usr/bin/env node

// This script provides a cross-platform way to run npm scripts
const { spawn } = require('child_process');
const path = require('path');

// The npm script to run is the first argument
const scriptToRun = process.argv[2];

if (!scriptToRun) {
  console.error('Please specify a script to run.');
  console.log('Usage: node scripts/npm-run.js <script-name>');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log(`Running npm script: ${scriptToRun}`);

// Run the npm script
const npmProcess = spawn(npmCmd, ['run', scriptToRun], { 
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

npmProcess.on('error', (error) => {
  console.error(`Error running npm script: ${error.message}`);
  process.exit(1);
});

npmProcess.on('close', (code) => {
  process.exit(code);
});
