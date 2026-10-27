import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const data = JSON.parse(await readFile(new URL('../dist/assets/lastlabel-replay.json', import.meta.url)));

test('replay covers each task and noise level without outcome-based selection', () => {
  assert.equal(data.records.length, 24);
  const keys = new Set();
  for (const record of data.records) {
    assert.equal(record.config.seed, 100);
    assert.equal(record.config.query, 'uncertainty');
    assert.equal(record.config.learner, 'linear-svm');
    assert.equal(record.config.noise_model, 'symmetric');
    keys.add(`${record.task}:${record.config.noise}`);
    assert.match(record.sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(keys.size, 24);
  assert.equal(new Set(data.records.map(r => r.task)).size, 6);
});

test('displayed decisions agree with their saved learning curves and budget', () => {
  for (const record of data.records) {
    assert.equal(record.trace.at(-1).labels, record.config.budget);
    assert.equal(record.outcomes.length, 6);
    for (const outcome of record.outcomes) {
      const point = record.trace.find(p => p.labels === outcome.labels);
      assert.ok(point);
      assert.equal(point.f1, outcome.macro_f1);
      assert.ok(Math.abs(outcome.label_savings - (1 - outcome.labels / record.config.budget)) < 1e-12);
      if (!outcome.stopped) assert.equal(outcome.labels, record.config.budget);
    }
  }
});
