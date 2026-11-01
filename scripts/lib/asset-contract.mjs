import {existsSync,readFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
const STATES=['not_started','in_progress','preview_ready','qa_passed','awaiting_user_review','approved','rework_required'];
const txt=x=>typeof x==='string'&&x.trim().length>0;
function file(root,path){
  if(!txt(path)||isAbsolute(path)) return null;
  const full=resolve(root,path), rel=relative(resolve(root),full);
  if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)||!existsSync(full)) return null;
  const real=realpathSync(full),realRel=relative(realpathSync(root),real);
  if(realRel==='..'||realRel.startsWith('..'+sep)||isAbsolute(realRel)) return null;
  try{return readFileSync(real);}catch{return null;}
}
export function assetDigest(manifest,root){
  const hash=createHash('sha256');
  for(const a of [...manifest.requiredAssets].sort((a,b)=>a.id.localeCompare(b.id))){
    hash.update(JSON.stringify([a.id,a.required,a.license??null]));
    for(const kind of ['sourceFiles','runtimeFiles','previewFiles']){
      for(const path of [...(a[kind]??[])].sort()){
        const bytes=file(root,path); if(bytes===null) throw Error('Missing asset file: '+path);
        hash.update(JSON.stringify([kind,path])); hash.update(createHash('sha256').update(bytes).digest());
      }
    }
  }
  return hash.digest('hex');
}
export function validateAssets(manifest,root,requiredIds=[]){
  const errors=[];
  if(manifest.schemaVersion!==2) errors.push('Expected asset schemaVersion 2');
  if(!Array.isArray(manifest.requiredAssets)) return [...errors,'requiredAssets must be an array'];
  const ids=manifest.requiredAssets.map(a=>a.id);
  if(new Set(ids).size!==ids.length) errors.push('Duplicate asset ID');
  for(const id of requiredIds) if(!manifest.requiredAssets.some(a=>a.id===id&&a.required===true)) errors.push('Missing required asset: '+id);
  for(const a of manifest.requiredAssets){
    if(!txt(a.id)||!STATES.includes(a.status)||typeof a.approved!=='boolean') errors.push('Invalid asset state: '+a.id);
    if(a.approved!==(a.status==='approved')) errors.push('Approval/status mismatch: '+a.id);
    const ready=['preview_ready','qa_passed','awaiting_user_review','approved'].includes(a.status);
    for(const kind of ['sourceFiles','runtimeFiles','previewFiles']){
      if(ready&&(!Array.isArray(a[kind])||a[kind].length===0)) errors.push(a.id+': missing '+kind);
      if(a[kind]!==undefined&&!Array.isArray(a[kind])){errors.push(a.id+': invalid '+kind);continue;}
      for(const p of a[kind]??[]) if(file(root,p)===null) errors.push(a.id+': invalid/missing file '+p);
    }
    if(['qa_passed','awaiting_user_review','approved'].includes(a.status)&&(!txt(a.qaEvidence)||file(root,a.qaEvidence)===null||a.license?.status!=='cleared'||!txt(a.license?.reference))) errors.push(a.id+': QA/license evidence missing');
    if(a.approved&&(!txt(a.approvalEvidence)||file(root,a.approvalEvidence)===null)) errors.push(a.id+': approval evidence missing');
  }
  if(typeof manifest.approvedForProduction!=='boolean'||!manifest.producerReview) errors.push('Production approval fields missing');
  if(manifest.approvedForProduction){
    if(!manifest.requiredAssets.filter(a=>a.required).every(a=>a.approved)) errors.push('Required assets not all approved');
    const rounds=manifest.auditRounds??[];
    if(!Array.isArray(rounds)||new Set(rounds.filter(r=>r.passed===true&&Number.isInteger(r.round)&&txt(r.evidence)&&file(root,r.evidence)!==null).map(r=>r.round)).size<3) errors.push('Three distinct evidenced audit rounds required');
    const p=manifest.producerReview;
    if(p.status!=='approved'||p.actor!=='SUSANO-OOO'||!txt(p.evidence)||file(root,p.evidence)===null) errors.push('Explicit producer approval record required');
    try{if(p.assetSetSha256!==assetDigest(manifest,root)) errors.push('Approval is stale: asset digest changed');}catch(e){errors.push(e.message);}
  }
  return errors;
}
