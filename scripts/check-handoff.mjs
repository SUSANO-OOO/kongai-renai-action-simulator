import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {validateAssets} from './lib/asset-contract.mjs';import {validateBudget} from './lib/budget-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),text=p=>readFileSync(resolve(root,p),'utf8'),read=p=>JSON.parse(text(p));
if(process.argv.includes('--production')){const r=spawnSync(process.execPath,[resolve(root,'scripts/check-readiness.mjs'),'assets'],{stdio:'inherit'});process.exit(r.status??1);}
const m=read('data/asset-manifest.json'),s=read('data/project-state.json'),issues=validateBudget(read('data/product-settings.json'),s,text('.github/workflows/ci.yml'));
issues.push(...validateAssets(m,root,read('data/asset-requirements.json').requiredIds));
for(const f of ['package-lock.json','AGENTS.md','CODEX_START_PROMPT.md','docs/HANDOFF.md','docs/decisions/2026-11-02-cadence.md'])if(!existsSync(resolve(root,f)))issues.push('Missing '+f);
console.log(JSON.stringify({status:issues.length?'NOT_READY':'READY_FOR_ASSET_PRODUCTION',scope:'Codex can start producing and validating assets',productionIntegrationApproved:m.approvedForProduction===true,issues,notice:'Not finished artwork, a completed game, or permission to skip producer review.'},null,2));process.exitCode=issues.length?2:0;
