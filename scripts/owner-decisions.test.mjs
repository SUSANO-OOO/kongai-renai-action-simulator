import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bytes=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(bytes(p).toString('utf8'));
test('owner art scope is CG-styled 2D, not mandatory female 3D or nationality labels',()=>{
 const p=read('data/product-settings.json');assert.equal(p.brand.name,'PAO GAMES');
 assert.equal(p.characters.artDirection,'stylized_cg');assert.equal(p.characters.releaseMedium,'2d_illustrations');
 assert.equal(p.characters.optional3d,'post_completion_only');assert.equal(p.characters.nationalityLabels,false);
 assert.equal(p.characters.dialogue,false);assert.equal(p.characters.romanceBranches,false);
 const chars=read('data/characters.json').characters;assert.equal(chars.length,10);
 for(const c of chars){assert.equal(c.ageGroup,'adult');assert.ok(c.designAge>=20);assert.ok(!('originMotif' in c));assert.equal(typeof c.approval,'boolean');}
 assert.ok(chars.filter(c=>c.designCue.includes('人妻')).length>=2);
});
test('default plus three extra cosmetic skins and loss payout zero are explicit',()=>{
 const p=read('data/progression.json');assert.equal(p.skins.length,4);assert.equal(p.skins.filter(s=>s.default).length,1);
 assert.equal(new Set(p.skins.map(s=>s.assetId)).size,4);assert.equal(p.runRewards.lossPayout,0);
 assert.equal(p.runRewards.bankOn,'clear_only');assert.equal(p.difficulty.hardRequiresNormalClear,false);
 assert.deepEqual(p.secret.modes,['hard']);assert.deepEqual(read('data/secret-stage.json').modes,['hard']);
 assert.deepEqual(read('data/stages.json').secretStage.modes,['hard']);
 for(const s of read('data/stages.json').normalStages)assert.equal(s.hard.requiresNormalClear,false);
 const ids=read('data/asset-manifest.json').requiredAssets.map(a=>a.id);
 for(const s of p.skins)assert.ok(ids.includes(s.assetId));
});
test('initial free local-only release is separate from future advertising and release authorization',()=>{
 const p=read('data/product-settings.json');assert.equal(p.distribution.initialPrice,0);assert.equal(p.distribution.initialAds,false);
 assert.equal(p.save.mode,'device_local');assert.equal(p.save.cloudSync,false);assert.equal(p.github.autonomousLowRiskMerge,true);
 assert.equal(p.paidExternalResources.authorized,false);assert.equal(p.privacy.historyRewriteAuthorized,true);
 assert.equal(p.audio.characterDialogue,false);assert.equal(p.audio.characterPleasureVocals,'excluded_not_supported');
 assert.match(bytes('LICENSE').toString(),/MIT License/);assert.match(bytes('ASSET_RIGHTS.md').toString(),/does \*\*not\*\* license artwork/);
});
test('Paisen references match the currently verified faithful master, rights not art approval',()=>{
 const provenance=read('references/paisen/provenance.json');assert.equal(provenance.ownerRightsConfirmed,true);assert.equal(provenance.newGameArtApproved,false);
 for(const ref of provenance.references){const data=bytes(ref.path);assert.equal(data.length,ref.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),ref.sha256);}
});
