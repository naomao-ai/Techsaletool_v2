const fs = require('fs');
const content = fs.readFileSync('Spreadsheet.repaired.tsx', 'utf8');

let stack = [];
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') stack.push({char: '{', pos: i, line: content.substring(0, i).split('\n').length});
  if (content[i] === '}') {
    if (stack.length === 0 || stack[stack.length - 1].char !== '{') {
       console.log('Unmatched } at line', content.substring(0, i).split('\n').length);
    } else {
       stack.pop();
    }
  }
}
console.log('Remaining in stack:', stack.map(s => s.line));
