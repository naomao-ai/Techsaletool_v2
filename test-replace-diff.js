import fs from 'fs';
const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');

const regex = /<script type="module" crossorigin(.*?)>/g;
let match;
while ((match = regex.exec(htmlContent)) !== null) {
  console.log("Matched index:", match.index);
  console.log("Captured group length:", match[1].length);
  if (match[1].length > 100) {
    console.log("Captured group preview (first 100):", match[1].substring(0, 100));
    console.log("Captured group preview (last 100):", match[1].substring(match[1].length - 100));
  } else {
    console.log("Captured group:", match[1]);
  }
}
