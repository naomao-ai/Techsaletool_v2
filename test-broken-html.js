import fs from 'fs';
let htmlContent = fs.readFileSync('dist/index.html', 'utf-8');

// Simulate server.ts and App.tsx replacement logic:
htmlContent = htmlContent.replace(/<script type="module" crossorigin(.*?)>/g, '<script$1>');
htmlContent = htmlContent.replace(/<script type="module"(.*?)>/g, '<script$1>');
htmlContent = htmlContent.replace(/<script crossorigin(.*?)>/g, '<script$1>');

fs.writeFileSync('test-output.html', htmlContent);
console.log("Written test-output.html. Let's see the start of the file:");
console.log(htmlContent.substring(0, 500));

console.log("\nLet's search for script tags in test-output.html:");
const scriptRegex = /<script\b[^>]*>/gi;
let match;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  console.log("Found tag:", match[0], "at index:", match.index);
}
