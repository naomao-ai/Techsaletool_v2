import fs from 'fs';
const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');

console.log("Indexes of '</head>' in dist/index.html:");
let idx = htmlContent.indexOf('</head>');
while (idx !== -1) {
  console.log("Found '</head>' at:", idx);
  // surrounding 100 characters
  console.log(htmlContent.substring(idx - 100, idx + 100));
  idx = htmlContent.indexOf('</head>', idx + 1);
}
