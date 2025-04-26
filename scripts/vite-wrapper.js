
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to locate the vite executable
const possiblePaths = [
  path.join(__dirname, '../node_modules/.bin/vite'),
  path.join(__dirname, '../node_modules/vite/bin/vite.js')
];

let vitePath = null;
for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    vitePath = path;
    break;
  }
}

if (!vitePath) {
  console.error('Could not find Vite executable. Make sure vite is installed.');
  process.exit(1);
}

console.log(`Starting Vite from: ${vitePath}`);

const vite = spawn(vitePath, [], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});
