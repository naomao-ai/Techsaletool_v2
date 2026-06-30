const fs = require('fs');

const local = fs.readFileSync('vite.config.ts', 'utf8');
const repo = fs.readFileSync('/tmp/repo/vite.config.ts', 'utf8');

console.log("Local length:", local.length, "Repo length:", repo.length);
if (local !== repo) {
  console.log("Diff exists.");
}
