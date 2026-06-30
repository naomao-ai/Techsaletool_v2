// Update recover_script.js
const fs = require('fs');

const decompiled = fs.readFileSync('Spreadsheet.decompiled.tsx', 'utf8');
let current = fs.readFileSync('src/components/Spreadsheet.tsx', 'utf8');

// 1. EXTRACT THE LOST JSX FROM DECOMPILED FILE
// We know it starts at the first button (`handleUndo`) inside the Toolbar
const startTag = '<button\n              onClick={handleUndo}'; 
const endTag = '가운데 정렬"}\n            </button>';

const startIndex = decompiled.indexOf(startTag);
const endIndex = decompiled.indexOf(endTag) + endTag.length;

if (startIndex === -1 || decompiled.indexOf(endTag) === -1) {
  console.log('Could not find start or end tags in decompiled file!');
  console.log(decompiled.indexOf(startTag), decompiled.indexOf(endTag));
  process.exit(1);
}

let lostJSX = decompiled.substring(startIndex, endIndex);

// Clean up `/* @__PURE__ */`
lostJSX = lostJSX.replace(/\/\*\s*@__PURE__\s*\*\//g, '');

// Convert functions back to JSX properly (SpreadsheetRow is a functional component)
lostJSX = lostJSX.replace(/<SpreadsheetRow2/g, '<SpreadsheetRow');

// Inject the new alignment menu into lostJSX
const alignmentMenuNew = `<div className="px-4 py-2 border-b border-brand-outline-variant/60 flex flex-col gap-1.5 mb-1" onClick={e => e.stopPropagation()}>
            <span className="text-[10px] text-brand-on-surface-variant font-medium">정렬 지정</span>
            <div className="flex gap-1.5">
               <button
                 className={\`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors \${columns.find(c => c.id === contextMenuColId)?.alignment === 'left' || !columns.find(c => c.id === contextMenuColId)?.alignment ? 'bg-brand-primary text-brand-on-primary border-brand-primary' : 'border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface'}\`}
                 onClick={() => {
                   setColumns(prev => prev.map(c => c.id === contextMenuColId ? { ...c, alignment: 'left' } : c));
                   setContextMenuColId(null);
                 }}
               >
                 왼쪽
               </button>
               <button
                 className={\`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors \${columns.find(c => c.id === contextMenuColId)?.alignment === 'center' ? 'bg-brand-primary text-brand-on-primary border-brand-primary' : 'border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface'}\`}
                 onClick={() => {
                   setColumns(prev => prev.map(c => c.id === contextMenuColId ? { ...c, alignment: 'center' } : c));
                   setContextMenuColId(null);
                 }}
               >
                 가운데
               </button>
               <button
                 className={\`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors \${columns.find(c => c.id === contextMenuColId)?.alignment === 'right' ? 'bg-brand-primary text-brand-on-primary border-brand-primary' : 'border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface'}\`}
                 onClick={() => {
                   setColumns(prev => prev.map(c => c.id === contextMenuColId ? { ...c, alignment: 'right' } : c));
                   setContextMenuColId(null);
                 }}
               >
                 오른쪽
               </button>
            </div>
          </div>`;

const alignStartIdx = lostJSX.indexOf('<button\n              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"\n              onClick={() => {\n                setColumns((prev) =>');
const alignEndIdx = lostJSX.indexOf('가운데 정렬"}\n            </button>') + '가운데 정렬"}\n            </button>'.length;

lostJSX = lostJSX.substring(0, alignStartIdx) + alignmentMenuNew + lostJSX.substring(alignEndIdx);

// 2. FIND WHERE TO REPLACE IN CURRENT FILE
const corruptStartIdx = current.indexOf('<div className="px-4 py-2 border-b border-brand-outline-variant/60 flex flex-col gap-1.5 mb-1" onClick={e => e.stopPropagation()}>');
if (corruptStartIdx === -1) {
   console.log("Could not find start of corruption in current file!");
   process.exit(1);
}

const corruptEndIdx = corruptStartIdx + alignmentMenuNew.length;
current = current.substring(0, corruptStartIdx) + lostJSX + current.substring(corruptEndIdx);

fs.writeFileSync('Spreadsheet.repaired.tsx', current);
console.log('Repaired! Length:', current.length);
