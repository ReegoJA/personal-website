import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decodeFile, requestGithub} from '../dist/github.js';

test('decodes UTF-8 repository content', () => {
  const source = 'const message = "λ";';
  const content = Buffer.from(source).toString('base64');
  assert.equal(decodeFile({size: 25, encoding: 'base64', content}), source);
});

test('rejects binary and oversized content', () => {
  assert.throws(() => decodeFile({size: 250001}), /250 KB/);
  assert.throws(() => decodeFile({
    size: 3,
    encoding: 'base64',
    content: Buffer.from([65, 0, 66]).toString('base64'),
  }), /Binary/);
});

test('reports rate limits without leaking response bodies', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ok: false, status: 403});
  try {
    await assert.rejects(requestGithub('/rate-limit-test'), /limiting requests/);
  } finally {
    globalThis.fetch = original;
  }
});

test('caches successful public responses', async () => {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () => {
    count++;
    return {ok: true, json: async () => ({name: 'example'})};
  };
  try {
    await requestGithub('/cache-test');
    await requestGithub('/cache-test');
    assert.equal(count, 1);
  } finally {
    globalThis.fetch = original;
  }
});
