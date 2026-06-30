import fs from 'fs';

let content = fs.readFileSync('src/components/Spreadsheet.tsx', 'utf-8');
const startStr = `              filteredAndSortedRequirements.map((req) => {
                const isSelected = selectedIds.includes(req.id);`;

const endStr = `              })
            )}

            {/* Bottom Row Add Button`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find block');
  process.exit(1);
}

const mapContent = content.substring(startIndex, endIndex);

// The map block contains the logic starting from:
//                const isSelected = selectedIds.includes(req.id);
// until the end of the return ( </tr> );
// We will replace this map with a call to `<SpreadsheetRow />`

const rowProps = `{
  key: req.id,
  req,
  isSelected: selectedIds.includes(req.id),
  dragOverRowId,
  columns,
  minimizedColumns,
  columnWidths,
  activeCellEditor,
  activeLocks,
  currentUser,
  showPriorityDropdownId,
  showAssigneeDropdownId,
  showStatusDropdownId,
  assigneesPool,
  requirements,
  
  handleRowDragOver,
  handleRowDrop,
  handleDuplicateRow,
  handleRowDragStart,
  handleSelectRow,
  setMinimizedColumns,
  setActiveCellEditor,
  updateRequirementField,
  handleGridPaste,
  setShowPriorityDropdownId,
  priorityRef,
  setShowAssigneeDropdownId,
  originalSetRequirements: setRequirements,
  assigneeRef,
  setShowStatusDropdownId,
  statusRef,
  setRequirements
}`;

const replacement = `              filteredAndSortedRequirements.map((req) => (
                <SpreadsheetRow ${rowProps.replace(/^{\n/, '').replace(/\n}$/, '')} />
              ))
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

// Now generate the SpreadsheetRow component at the bottom of the file
const functionBody = mapContent.replace(/filteredAndSortedRequirements\.map\(\(req\) => \{\n/, '').replace(/return \(\s*<tr/, 'return (\n    <tr');

const spreadsheetRowComponent = `

const SpreadsheetRow = React.memo(({
  req,
  isSelected,
  dragOverRowId,
  columns,
  minimizedColumns,
  columnWidths,
  activeCellEditor,
  activeLocks,
  currentUser,
  showPriorityDropdownId,
  showAssigneeDropdownId,
  showStatusDropdownId,
  assigneesPool,
  requirements,
  
  handleRowDragOver,
  handleRowDrop,
  handleDuplicateRow,
  handleRowDragStart,
  handleSelectRow,
  setMinimizedColumns,
  setActiveCellEditor,
  updateRequirementField,
  handleGridPaste,
  setShowPriorityDropdownId,
  priorityRef,
  setShowAssigneeDropdownId,
  originalSetRequirements,
  assigneeRef,
  setShowStatusDropdownId,
  statusRef,
  setRequirements
}: any) => {
${functionBody}
});
`;

fs.writeFileSync('src/components/Spreadsheet.tsx', content + spreadsheetRowComponent);
console.log('Refactoring completed successfully!');
