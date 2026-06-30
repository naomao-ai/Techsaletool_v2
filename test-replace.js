import fs from 'fs';
let htmlContent = fs.readFileSync('dist/index.html', 'utf-8');

console.log("Original includes type=\"module\":", htmlContent.includes('type="module"'));

// Simulate the replace used in App.tsx
try {
  let temp1 = htmlContent.replace(/<script type="module" crossorigin(.*?)>/g, '<script$1>');
  console.log("Temp1 length:", temp1.length);
  // Let's see if temp1 still contains </script>
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match = scriptRegex.exec(temp1);
  if (match) {
    console.log("Found script tag in Temp1.");
    console.log("Script body start:", match[1].substring(0, 200));
  } else {
    console.log("No script tag found in Temp1! This means the tag was broken!");
  }
} catch (e) {
  console.error(e);
}
