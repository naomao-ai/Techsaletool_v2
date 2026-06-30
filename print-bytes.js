import fs from 'fs';
const htmlContent = fs.readFileSync('test-output.html', 'utf-8');

console.log("Characters 478150 to 478400:");
console.log(htmlContent.substring(478150, 478440));
