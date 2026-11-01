import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('email-only history transformation unit tests do not access or write a remote',()=>{
 const p=spawnSync('python3',[fileURLToPath(new URL('../ops/privacy/test_sanitize_history.py',import.meta.url))],{encoding:'utf8'});
 assert.equal(p.status,0,p.stderr||p.error?.message);
});
