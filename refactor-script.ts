import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/Spreadsheet.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1-1. Select cell 'px-4' -> 'px-[5px]'
// Check line 3290 exactly. Wait, I will just replace `className={\`px-4 py-2 border-r` in `td` where `col.type === 'select'`.
const selectColRegex = /if \(col\.type === 'select'\) \{.*?className=\{`px-4 py-2/s;
content = content.replace(selectColRegex, (match) => {
    return match.replace('px-4 py-2', 'px-[5px] py-1');
});

// 1-2. In select type dropdown, add '(추가)' logic
const selectDropdownRegex = /<option value=""><\/option>(.*?)<\/select>/s;
content = content.replace(/if \(col\.type === 'select'\) \{.*?<\/select>/s, (match) => {
    // Add the ADD_NEW option and change the onChange logic
    let modified = match.replace(/onChange=\{\(e\) => updateRequirementField\(req\.id, col\.id, e\.target\.value\)\}/g, `onChange={(e) => {
                                  if (e.target.value === '__ADD_NEW__') {
                                    const newOption = prompt('새 항목의 이름을 입력하세요:');
                                    if (newOption && newOption.trim()) {
                                       const trimmed = newOption.trim();
                                       setColumns(prev => prev.map(c => {
                                          if (c.id === col.id) {
                                            const existing = c.options || [];
                                            if (!existing.includes(trimmed)) {
                                              return { ...c, options: [...existing, trimmed] };
                                            }
                                          }
                                          return c;
                                       }));
                                       updateRequirementField(req.id, col.id, trimmed);
                                    }
                                  } else {
                                    updateRequirementField(req.id, col.id, e.target.value);
                                  }
                                }}`);
    modified = modified.replace(/<\/select>/, `  <option value="__ADD_NEW__">(추가)</option>\n                              </select>`);
    return modified;
});

// 2. Alignment context menu.
const alignmentMenuOld = /<button[\s\S]*?onClick=\{\(\) => \{\s*setColumns\(prev => prev\.map\(c =>[\s\S]*?c\.alignment === 'center'\s*\?\s*'left'\s*:\s*'center'[\s\S]*?\}\}\s*>\s*<AlignJustify className="w-3\.5 h-3\.5 text-brand-outline-variant" \/>\s*\{columns\.find\(c => c\.id === contextMenuColId\)\?\.alignment === 'center'\s*\?\s*"기본 정렬 \(좌측\)"\s*:\s*"가운데 정렬"\}\s*<\/button>/s;

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

content = content.replace(alignmentMenuOld, alignmentMenuNew);


// 3. Super header edit.
const superHeaderOld = /<th \s*key=\{`group-\$\{ths\.length\}`\}\s*colSpan=\{colSpan\}\s*className=\{`py-1 text-center \$\{currentGroup \? [^>]*>\s*\{currentGroup \|\| ''\}\s*<\/th>/s;

const superHeaderNew = `<th 
                          key={\`group-\${ths.length}\`} 
                          colSpan={colSpan} 
                          className={\`py-1 text-center \${currentGroup ? 'border-x border-t-2 border-b-0 border-brand-primary/50 text-brand-primary font-bold shadow-sm cursor-text hover:bg-brand-surface-high/30 transition-colors' : 'border-r border-brand-outline-variant'}\`}
                          onContextMenu={(e) => {
                            if (currentGroup) {
                              e.preventDefault();
                              setSuperContextMenuGroup(currentGroup);
                              setContextMenuPos({ x: e.clientX, y: e.clientY });
                            }
                          }}
                          onClick={() => {
                             if (currentGroup) {
                                // @ts-ignore
                                setActiveCellEditor({ rowId: 'GROUP_HEADER', field: currentGroup });
                             }
                          }}
                        >
                          {activeCellEditor?.rowId === 'GROUP_HEADER' && activeCellEditor?.field === currentGroup ? (
                              <input
                                type="text"
                                defaultValue={currentGroup}
                                autoFocus
                                onBlur={(e) => {
                                   const newVal = e.target.value.trim();
                                   if (newVal && newVal !== currentGroup) {
                                      setColumns(prev => prev.map(c => c.groupName === currentGroup ? { ...c, groupName: newVal } : c));
                                   }
                                   // @ts-ignore
                                   setActiveCellEditor(null);
                                }}
                                onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                      const newVal = e.currentTarget.value.trim();
                                      if (newVal && newVal !== currentGroup) {
                                         setColumns(prev => prev.map(c => c.groupName === currentGroup ? { ...c, groupName: newVal } : c));
                                      }
                                      // @ts-ignore
                                      setActiveCellEditor(null);
                                   }
                                   // @ts-ignore
                                   if (e.key === 'Escape') setActiveCellEditor(null);
                                }}
                                className="w-full text-center bg-transparent border-none outline-none text-brand-primary"
                              />
                          ) : (
                              currentGroup || ''
                          )}
                        </th>`;

content = content.replace(superHeaderOld, superHeaderNew);

// 4. Exchange rates padding
const exchangeRatesInputRegex = /className="w-16 bg-brand-surface text-brand-on-surface px-1\.5 py-0\.5 border/g;
content = content.replace(exchangeRatesInputRegex, 'className="w-20 bg-brand-surface text-brand-on-surface px-0.5 py-0 border');

// 5. Grid columns padding reduction
// General replacement for td classes
content = content.replace(/className=\{`px-4 py-2 border-r /g, 'className={`px-2 py-1 border-r ');
content = content.replace(/className="px-4 py-2 text-center text-brand-on-surface-variant w-\[100px\]"/g, 'className="px-2 py-1 text-center text-brand-on-surface-variant w-[100px]"');
content = content.replace(/className=\{`px-4 py-2 text-center text-brand-on-surface-variant/g, 'className={`px-2 py-1 text-center text-brand-on-surface-variant');

fs.writeFileSync(file, content, 'utf8');
