const fs = require('fs');
const decompiled = fs.readFileSync('Spreadsheet.decompiled.tsx', 'utf8');

const firstBtnIdx = decompiled.indexOf('<button');
console.log('First <button> is at index:', firstBtnIdx);
console.log('Surrounding code: \n', decompiled.substring(firstBtnIdx - 50, firstBtnIdx + 200));

const original = fs.readFileSync('src/components/Spreadsheet.tsx.bak', 'utf8').catch(()=>null);
