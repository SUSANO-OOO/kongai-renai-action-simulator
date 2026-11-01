import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {preflight} from './route-preflight.mjs';
const stages = JSON.parse(readFileSync(new URL('../data/stages.json',import.meta.url),'utf8')).stages;
test('One-unit to >=100 plausible abstract route exists across 10 normal and 10 future hard cases', () => {
 for (const stage of stages) {
  for (const hard of [false,true]) {
   const result = preflight(stage,hard);
   assert.ok(result.reached,`stage ${stage.id} mode ${hard?'hard':'normal'}: ${result.reason} best=${result.best}`);
   assert.equal(result.path.length,stage.events.length);
  }
 }
});
