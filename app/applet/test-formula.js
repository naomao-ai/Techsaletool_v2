import { readFileSync } from 'fs';

let code = readFileSync('src/components/Spreadsheet.tsx', 'utf8');

const match = code.match(/const getFormulaFn = \([\s\S]*?return formulaCache\.get\(cacheKey\);\n\};/);
if (!match) throw new Error('Could not find getFormulaFn');

let formulaFnCode = match[0].replace('const getFormulaFn = ', 'globalThis.getFormulaFn = ');
formulaFnCode = formulaFnCode.replace(/:\s*any(?:\[\])?/g, ''); // strip some types roughly
formulaFnCode = formulaFnCode.replace(/f:\s*string/, 'f');

// Just mock the cache
globalThis.formulaCache = new Map();
try {
  eval(formulaFnCode);
} catch (e) {
  console.log("EVAL ERROR:", e.message);
  console.log(formulaFnCode);
  process.exit(1);
}

const columns = [{ id: 'col1', label: '금액(1)' }, { id: 'col2', label: '시점차이(개월수)' }];
const f = '[금액(1)] + [시점차이(개월수)]';

const fn = globalThis.getFormulaFn(f, columns);
const req = { customColumns: { col1: '100', col2: '50' } };
console.log('Result:', fn(req));
