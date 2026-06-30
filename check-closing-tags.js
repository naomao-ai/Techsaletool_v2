import fs from 'fs';
const htmlContent = fs.readFileSync('test-output.html', 'utf-8');

const regex = /<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(htmlContent)) !== null) {
  count++;
  console.log(`Closing tag #${count} at index:`, match.index);
  // print surrounding characters (100 before, 100 after)
  const start = Math.max(0, match.index - 150);
  const end = Math.min(htmlContent.length, match.index + 150);
  console.log(`Surrounding content:\n${htmlContent.substring(start, end)}\n`);
}
