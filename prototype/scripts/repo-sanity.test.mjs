import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const cwd=process.cwd();
const read=path=>readFileSync(join(cwd,path),'utf8');

test('all files referenced by README exist',()=>{
  const text=read('README.md');
  const paths=[...text.matchAll(/\]\((docs\/[^)]*\.md|AGENTS\.md|CODEX_START_PROMPT\.md)\)/g)].map(x=>x[1]);
  assert.ok(paths.length>=10);
  for(const path of paths)assert.ok(existsSync(join(cwd,path)),`missing ${path}`);
});

test('every referenced main UI element exists',()=>{
  const source=read('src/main.ts');const html=read('index.html');
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
  for(const match of source.matchAll(/byId\(['"]([^'"]+)['"]\)/g)){
    assert.ok(ids.has(match[1]),`missing markup id ${match[1]}`);
  }
});
