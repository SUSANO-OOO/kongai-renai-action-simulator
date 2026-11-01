// Executable specification only: not a second game engine or a finished game.
export function count(value) {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) throw new TypeError('Count must be an exact nonnegative integer');
  if (typeof value !== 'bigint' && typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) throw new TypeError('Invalid count');
  const n = BigInt(value);
  if (n < 0n) throw new RangeError('Negative count');
  return n;
}
export function applyGate(troops, action, value) {
  const n = count(troops), v = count(value);
  if (!['add','multiply','subtract','divide'].includes(action)) throw new RangeError('Unknown gate');
  if (v === 0n) throw new RangeError('Gate operand must be positive');
  // Once eliminated, a later gate cannot resurrect a finished run.
  if (n === 0n) return 0n;
  if (action === 'add') return n + v;
  if (action === 'multiply') return n * v;
  if (action === 'subtract') return n > v ? n - v : 0n;
  return n / v;
}
export function goalOutcome(snapshot) {
  const n = count(snapshot);
  return n === 0n ? 'exhausted' : n >= 100n ? 'clear' : 'absorbed';
}
