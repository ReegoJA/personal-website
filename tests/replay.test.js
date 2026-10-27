import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../dist/assets/lastlabel-findings.json', import.meta.url)));

test('findings retain every task in the published 30-seed comparison', () => {
  assert.equal(data.cases.length, 6);
  assert.equal(new Set(data.cases.map(row => row.task)).size, 6);
  assert.equal(data.seeds, 30);
  for (const hash of Object.values(data.hashes)) assert.match(hash, /^[a-f0-9]{64}$/);
});

test('paired differences match displayed group means', () => {
  for (const row of data.cases) {
    assert.ok(Math.abs(row.values.easy.labels - row.values.fixed.labels - row.delta.labels_delta) < 1e-9);
    assert.ok(Math.abs(row.values.easy.macro_f1 - row.values.fixed.macro_f1 - row.delta.f1_delta) < 1e-9);
  }
});

test('published adverse and budget-fallback findings are preserved', () => {
  const balanced = data.cases.find(row => row.task === 'synthetic-balanced');
  assert.equal(balanced.delta.labels_delta.toFixed(2), '-114.67');
  assert.equal((100 * balanced.delta.f1_delta).toFixed(2), '-4.00');
  for (const task of ['baseball-vs-hockey', 'graphics-vs-windows']) {
    const row = data.cases.find(value => value.task === task);
    assert.equal(row.delta.labels_delta, 0);
    assert.equal(row.delta.f1_delta, 0);
    assert.equal(row.values.easy.stopped, 0);
    assert.equal(row.values.fixed.stopped, 0);
  }
});
