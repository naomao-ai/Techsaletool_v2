import fs from 'fs';
const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');
console.log("First 1000 characters:");
console.log(htmlContent.substring(0, 1000));
