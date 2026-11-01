import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateAssets,assetDigest} from './lib/asset-contract.mjs';
const base=()=>({schemaVersion:2,approvedForProduction:false,producerReview:{status:'not_requested'},auditRounds:[],requiredAssets:[{id:'x',required:true,status:'not_started',approved:false}]});
test('unfinished work is valid project state, not production approval',()=>{
 const m=base(); assert.deepEqual(validateAssets(m,process.cwd(),['x']),[]);
 m.approvedForProduction=true; assert.ok(validateAssets(m,process.cwd(),['x']).length>0);
});
test('cannot approve without files, QA, rights and producer evidence',()=>{
 const m=base();m.requiredAssets[0].status='approved';m.requiredAssets[0].approved=true;
 assert.ok(validateAssets(m,process.cwd(),['x']).length>=5);
});
test('evidenced approval is allowed; changed content invalidates freeze',()=>{
 const root=mkdtempSync(join(tmpdir(),'kongai-approval-'));
 try{
  for(const p of ['source','runtime','preview','qa','approval','audit1','audit2','audit3']) writeFileSync(join(root,p),p);
  const m=base(),a=m.requiredAssets[0];Object.assign(a,{status:'approved',approved:true,sourceFiles:['source'],runtimeFiles:['runtime'],previewFiles:['preview'],qaEvidence:'qa',approvalEvidence:'approval',license:{status:'cleared',reference:'fixture original author'}});
  m.auditRounds=[1,2,3].map(round=>({round,passed:true,evidence:'audit'+round}));
  m.producerReview={status:'approved',actor:'SUSANO-OOO',evidence:'approval',assetSetSha256:assetDigest(m,root)};m.approvedForProduction=true;
  assert.deepEqual(validateAssets(m,root,['x']),[]);
  writeFileSync(join(root,'runtime'),'modified');assert.ok(validateAssets(m,root,['x']).some(e=>e.includes('stale')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('required scope and unique IDs cannot silently disappear',()=>{
 const m=base();assert.ok(validateAssets(m,process.cwd(),['missing']).length>0);
 m.requiredAssets.push({...m.requiredAssets[0]});assert.ok(validateAssets(m,process.cwd()).some(e=>e.includes('Duplicate')));
});
