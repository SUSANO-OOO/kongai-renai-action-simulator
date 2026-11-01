import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {validateBudget} from './lib/budget-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=p=>readFileSync(resolve(root,p),'utf8');
const errors=validateBudget(JSON.parse(text('data/product-settings.json')),JSON.parse(text('data/project-state.json')),text('.github/workflows/ci.yml'));
console.log(JSON.stringify({status:errors.length?'INVALID':'PASS',incrementalBudgetJPY:0,issues:errors,notice:'Static policy validation only; not proof of a zero invoice or an external billing lock.'},null,2));
process.exitCode=errors.length?1:0;
