import fs from 'fs';

let content = fs.readFileSync('src/components/Spreadsheet.tsx', 'utf-8');
const startStr = `              filteredAndSortedRequirements.map((req) => {
                const isSelected = selectedIds.includes(req.id);`;

const endStr = `              })
            )}

            {/* Bottom Row`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find block');
  process.exit(1);
}

let mapContent = content.substring(startIndex, endIndex);

const rowProps = `
                  key={req.id}
                  req={req}
                  isSelected={selectedIds.includes(req.id)}
                  dragOverRowId={dragOverRowId}
                  columns={columns}
                  minimizedColumns={minimizedColumns}
                  columnWidths={columnWidths}
                  activeCellEditor={activeCellEditor}
                  activeLocks={activeLocks}
                  currentUser={currentUser}
                  showPriorityDropdownId={showPriorityDropdownId}
                  showAssigneeDropdownId={showAssigneeDropdownId}
                  showStatusDropdownId={showStatusDropdownId}
                  assigneesPool={assigneesPool}
                  requirements={requirements}
                  
                  handleRowDragOver={handleRowDragOver}
                  handleRowDrop={handleRowDrop}
                  handleDuplicateRow={handleDuplicateRow}
                  handleRowDragStart={handleRowDragStart}
                  handleSelectRow={handleSelectRow}
                  setMinimizedColumns={setMinimizedColumns}
                  setActiveCellEditor={setActiveCellEditor}
                  updateRequirementField={updateRequirementField}
                  handleGridPaste={handleGridPaste}
                  setShowPriorityDropdownId={setShowPriorityDropdownId}
                  priorityRef={priorityRef}
                  setShowAssigneeDropdownId={setShowAssigneeDropdownId}
                  originalSetRequirements={originalSetRequirements}
                  assigneeRef={assigneeRef}
                  setShowStatusDropdownId={setShowStatusDropdownId}
                  statusRef={statusRef}
                  setRequirements={setRequirements}
`;

const replacement = `              filteredAndSortedRequirements.map((req) => (
                <SpreadsheetRow ${rowProps} />
              ))
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

// remove the first line
mapContent = mapContent.replace(/.*filteredAndSortedRequirements\.map[^\n]*\n/, '');

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
${mapContent}
});
`;

fs.writeFileSync('src/components/Spreadsheet.tsx', content + spreadsheetRowComponent);
console.log('Refactoring completed successfully!');
