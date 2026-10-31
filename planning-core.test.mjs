import assert from 'node:assert/strict';
import { initials, parsePrice, summarize } from './planning-core.mjs';

assert.equal(parsePrice('$1,234.50'), 1234.5);
assert.equal(parsePrice('19.9'), 19.9);
assert.equal(parsePrice('0'), null);
assert.equal(parsePrice('-5'), null);
assert.equal(parsePrice('12.345'), null);
assert.equal(initials('Avery Morgan'), 'AM');
assert.deepEqual(summarize([{ price: 10 }, { price: 25 }]), { total: 35, average: 17.5, count: 2 });

console.log('planning-core tests passed');
