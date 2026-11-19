// A weak test file: happy paths only. Copy it to demo/textkit/textkit.test.js to see
// the grader give it a low score. These tests pass on correct code and miss most bugs.
const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, truncate, wordCount, chunk, clamp, parseDuration } = require('./textkit.js');

test('slugify makes a slug', () => assert.equal(slugify('Hello World'), 'hello-world'));
test('truncate shortens long text', () => assert.equal(truncate('abcdefghij', 6), 'abcde…'));
test('wordCount counts words', () => assert.equal(wordCount('one two three'), 3));
test('chunk splits evenly', () => assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]));
test('clamp keeps a value in range', () => assert.equal(clamp(15, 0, 10), 10));
test('parseDuration reads seconds', () => assert.equal(parseDuration('90s'), 90));
