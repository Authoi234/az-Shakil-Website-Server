// fix-gopd.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, 'node_modules');
const target = 'gopd';
const expected = 'gOPD.js';
const actual = 'gopd.js';

function fixCase(folder) {
  const file = path.join(folder, actual);
  const newFile = path.join(folder, expected);

  if (fs.existsSync(file) && !fs.existsSync(newFile)) {
    fs.copyFileSync(file, newFile);
    console.log(`[fixed] ${expected} created in ${folder}`);
  }
}

function walk(nodeModules) {
  fs.readdirSync(nodeModules, { withFileTypes: true }).forEach(entry => {
    if (entry.isDirectory()) {
      const dir = path.join(nodeModules, entry.name);
      if (entry.name === target) fixCase(dir);
      else walk(dir); // recurse
    }
  });
}

walk(root);
