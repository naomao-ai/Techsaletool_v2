const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setRequirements\(parsed\.requirements \|\| INITIAL_REQUIREMENTS\);/g, `setRequirements(parsed.requirements || INITIAL_REQUIREMENTS);\n             setRequirements2(parsed.requirements2 || []);`);

code = code.replace(/if \(parsed\.requirements\) setRequirements\(parsed\.requirements\);/g, `if (parsed.requirements) setRequirements(parsed.requirements);\n              if (parsed.requirements2) setRequirements2(parsed.requirements2);`);

code = code.replace(/if \(parsed\.columns\) setColumns\(parsed\.columns\);/g, `if (parsed.columns) setColumns(parsed.columns);\n              if (parsed.columns2) setColumns2(parsed.columns2);`);

code = code.replace(/setRequirements\(INITIAL_REQUIREMENTS\);/g, `setRequirements(INITIAL_REQUIREMENTS);\n             setRequirements2([]);`);

code = code.replace(/setColumns\(DEFAULT_COLUMNS\);/g, `setColumns(DEFAULT_COLUMNS);\n             setColumns2(DEFAULT_COLUMNS);`);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
