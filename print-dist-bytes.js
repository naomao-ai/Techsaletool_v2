import fs from 'fs';
const htmlContent = fs.readFileSync('dist/index.html', 'utf-8');

console.log("Characters 477800 to 478050 in dist/index.html:");
console.log(htmlContent.substring(477800, 478050));
