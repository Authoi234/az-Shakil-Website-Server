const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`Copied gOPD.js to ${dest}`);
  } catch (e) {
    // ignore errors
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'gopd') {
        // ensure gOPD.js exists here
        const src = path.resolve(__dirname, 'node_modules', 'gopd', 'gOPD.js');
        const dest = path.join(full, 'gOPD.js');
        copyFile(src, dest);
      }
      walk(full);
    }
  }
}

// start from node_modules
walk(path.resolve(__dirname, 'node_modules'));