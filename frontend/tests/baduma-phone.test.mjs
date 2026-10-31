import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePhone } from '../lib/baduma-phone.mjs';

test('normalizes Sri Lankan local and international phone numbers for Supabase', () => {
  assert.equal(normalizePhone('077 123 4567'), '+94771234567');
  assert.equal(normalizePhone('94771234567'), '+94771234567');
  assert.equal(normalizePhone('+94 (77) 123-4567'), '+94771234567');
  assert.equal(normalizePhone('+1 (202) 555-0198'), '+12025550198');
});

test('rejects malformed and incomplete phone numbers', () => {
  for (const value of ['', '07712', 'hello0771234567', '1234567890', '+0771234567', '++94771234567']) {
    assert.equal(normalizePhone(value), null, value);
  }
});
