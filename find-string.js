import fs from 'fs';
const htmlContent = fs.readFileSync('test-output.html', 'utf-8');

const target = 'window.__TAURI__';
let index = -1;
while ((index = htmlContent.indexOf(target, index + 1)) !== -1) {
  console.log(`\nFound target "${target}" at index ${index}:`);
  const start = Math.max(0, index - 200);
  const end = Math.min(htmlContent.length, index + 200);
  console.log("SURROUNDING CODE:");
  console.log(htmlContent.substring(start, end));
}
