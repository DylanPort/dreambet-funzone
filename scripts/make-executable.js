
#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// List of files to make executable
const filesToMakeExecutable = [
  'run-dev.sh',
  'scripts/vite-wrapper.js'
];

console.log('Making script files executable...');

filesToMakeExecutable.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    try {
      if (process.platform !== 'win32') { // Skip chmod on Windows
        execSync(`chmod +x "${filePath}"`);
        console.log(`Made executable: ${file}`);
      }
    } catch (error) {
      console.error(`Failed to make ${file} executable:`, error.message);
    }
  } else {
    console.warn(`File not found: ${file}`);
  }
});

console.log('Executable setup complete.');
