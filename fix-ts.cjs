const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = [
  'src/components/ChangelogViewer.tsx',
  'src/components/Spreadsheet.tsx',
  'src/App.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/window\.__TAURI_INTERNALS__/g, '("__TAURI_INTERNALS__" in window)');
  content = content.replace(/window\.__TAURI_IPC__/g, '("__TAURI_IPC__" in window)');
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
