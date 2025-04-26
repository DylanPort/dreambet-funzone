
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const vite = spawn(path.join(__dirname, '../node_modules/.bin/vite'), [], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});
