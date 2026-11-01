// Conservative design preflight, NOT a simulation of real player input or real game AI.
// Ensures a plausible lane route exists from 1 unit to >=100 after scripted contacts.
import { readFileSync } from 'node:fs';
const stages = JSON.parse(readFileSync(new URL('../data/stages.json', import.meta.url), 'utf8')).stages;

export function preflight(stage, hard = false) {
  let states = [{ lane: 0, shields: 0, troops: 1n, path: [] }];
  let lastAt = 0;
  for (const event of stage.events) {
    const secondsToEvent = (event.at - lastAt) / stage.speed;
    // Approximation only. Actual pointer motion and gate hitbox require play testing.
    const shiftMax = secondsToEvent >= 0.9 ? 2 : 1;
    const next = new Map();
    for (const state of states) {
      for (const targetLane of [-1, 0, 1]) {
        if (Math.abs(targetLane - state.lane) > shiftMax) continue;
        let troops = state.troops;
        let shields = state.shields;
        let reason = 'pass';
        if (event.type === 'gate_row') {
          const gate = event.choices.find(c => c.lane === targetLane);
          if (gate) {
            reason = gate.action + ':' + gate.value;
            if (gate.action === 'add') troops += BigInt(gate.value);
            else if (gate.action === 'multiply') troops *= BigInt(gate.value);
            else if (gate.action === 'subtract') troops = troops > BigInt(gate.value) ? troops - BigInt(gate.value) : 0n;
            else if (gate.action === 'divide') troops /= BigInt(gate.value);
            else if (gate.action === 'shield') shields += gate.value;
            // All other temporary powers are ignored: a conservative simplification.
          }
        } else if (event.type === 'obstacle') {
          if (targetLane === event.lane) {
            const damage = BigInt(Math.ceil(event.damage * (hard ? 1.25 : 1)));
            if (shields > 0) shields--;
            else troops -= damage;
            reason = 'hazard:' + damage;
          }
        } else if (event.type === 'enemy' || event.type === 'boss') {
          if (event.type === 'boss' || targetLane === event.lane) {
            // Does not assume any shots land before collision, conservatively subtracting full strength.
            const damage = BigInt(Math.ceil(event.strength * (hard ? 1.25 : 1)));
            if (shields > 0) shields--;
            else troops -= damage;
            reason = 'collision:' + damage;
          }
        }
        if (troops < 1n) continue;
        const result = {
          lane: targetLane,
          shields: Math.min(shields, 10),
          troops,
          path: [...state.path, { eventId: event.id, lane: targetLane, result: reason, survivors: troops.toString() }],
        };
        const key = targetLane + ':' + result.shields;
        if (!next.has(key) || next.get(key).troops < troops) next.set(key, result);
      }
    }
    states = [...next.values()];
    if (!states.length) return { reached: false, best: 0n, path: [], reason: 'all abstract paths died at ' + event.id };
    lastAt = event.at;
  }
  states.sort((a, b) => a.troops > b.troops ? -1 : a.troops < b.troops ? 1 : 0);
  const winner = states[0];
  return { reached: winner.troops >= 100n, best: winner.troops, path: winner.path, reason: '' };
}

// Useful for Codex on-demand and QA: node scripts/route-preflight.mjs
if (process.argv[1]?.endsWith('/route-preflight.mjs')) {
  for (const hard of [false, true]) {
    for (const stage of stages) {
      const info = preflight(stage, hard);
      console.log('stage', stage.id, hard ? 'HARD (draft)' : 'NORMAL', 'plausible:', info.reached, 'best survivors:', info.best.toString());
    }
  }
  console.log('CAUTION: abstract design routes ignore actual 3D positions/timing, projectile damage and unreleased HARD scripts; never substitute for actual gameplay QA.');
}
