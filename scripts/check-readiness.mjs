import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateAssets} from './lib/asset-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const mode=process.argv[2]??'assets';
if(!['assets','release'].includes(mode)) throw Error('Use assets or release');
const manifest=read('data/asset-manifest.json');
const errors=validateAssets(manifest,root,read('data/asset-requirements.json').requiredIds);
if(!manifest.approvedForProduction) errors.push('All-assets producer approval is still pending');
if(mode==='release'){
  const state=read('data/project-state.json');
  if(state.runtime!=='production_game') errors.push('Current runtime is not the production game');
  if(state.openProductDecisions.length) errors.push('Open product decisions: '+state.openProductDecisions.join(', '));
  for(const check of state.releaseChecks){
    if(check.status!=='passed'||!check.evidence||!existsSync(resolve(root,check.evidence))) errors.push('Release evidence missing: '+check.id);
  }
  if(state.releaseAuthorization?.status!=='approved'||!state.releaseAuthorization.evidence||!existsSync(resolve(root,state.releaseAuthorization.evidence))) errors.push('Producer release authorization missing');
}
console.log(JSON.stringify({mode,status:errors.length?'NOT_READY':'PREREQUISITES_PRESENT',issues:errors,notice:'Presence checks do not replace human approval or actual product/device QA.'},null,2));
process.exitCode=errors.length?2:0;
