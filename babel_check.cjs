const fs = require('fs');
const parser = require('@babel/parser');

const source = fs.readFileSync('Spreadsheet.repaired.tsx', 'utf8');

try {
  parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Parsed successfully!");
} catch (e) {
  console.error("Parse Error:", e.message, "at line:", e.loc.line, "column:", e.loc.column);
}
