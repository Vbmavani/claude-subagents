// A strong test file: behaviour, edges and errors. Copy it to demo/textkit/textkit.test.js
// to see the grader give it full marks. It is the calibration for what "good" looks like.
const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, truncate, wordCount, chunk, clamp, parseDuration } = require('./textkit.js');

test('slugify lowercases and joins words with one dash', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});
test('slugify collapses runs of symbols and spaces into a single dash', () => {
  assert.equal(slugify('a  --  b!!c'), 'a-b-c');
});
test('slugify trims dashes from both ends', () => {
  assert.equal(slugify('  --Hello--  '), 'hello');
  assert.equal(slugify('!!!'), '');
});
test('slugify strips accents', () => assert.equal(slugify('Crème Brûlée'), 'creme-brulee'));
test('slugify rejects non-strings', () => assert.throws(() => slugify(42), TypeError));

test('truncate leaves text that fits, including text of exactly max length', () => {
  assert.equal(truncate('abc', 5), 'abc');
  assert.equal(truncate('abcde', 5), 'abcde');
});
test('truncate output never exceeds max and ends in the ellipsis', () => {
  const r = truncate('abcdefghij', 6);
  assert.equal(r, 'abcde…');
  assert.equal(r.length, 6);
});
test('truncate supports a custom ellipsis', () => assert.equal(truncate('abcdefghij', 6, '..'), 'abcd..'));
test('truncate with a max shorter than the ellipsis returns part of the ellipsis', () => {
  assert.equal(truncate('abcdefghij', 2, '...'), '..');
  assert.equal(truncate('abcdefghij', 0), '');
});
test('truncate rejects bad input', () => {
  assert.throws(() => truncate(5, 3), TypeError);
  assert.throws(() => truncate('abc', -1), RangeError);
  assert.throws(() => truncate('abc', 1.5), RangeError);
});

test('wordCount counts words separated by any whitespace', () => {
  assert.equal(wordCount('one two three'), 3);
  assert.equal(wordCount('  one \t two\nthree  '), 3);
});
test('wordCount returns 0 for empty and blank text', () => {
  assert.equal(wordCount(''), 0);
  assert.equal(wordCount('   \n '), 0);
});
test('wordCount rejects non-strings', () => assert.throws(() => wordCount(null), TypeError));

test('chunk splits evenly and keeps a shorter last group', () => {
  assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});
test('chunk of an empty array is empty, and a big size gives one group', () => {
  assert.deepEqual(chunk([], 3), []);
  assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
});
test('chunk rejects bad size and non-arrays', () => {
  assert.throws(() => chunk([1], 0), RangeError);
  assert.throws(() => chunk([1], 1.5), RangeError);
  assert.throws(() => chunk('ab', 1), TypeError);
});

test('clamp keeps values in range and returns the bounds at the edges', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(10, 0, 10), 10);
});
test('clamp throws when min is greater than max', () => assert.throws(() => clamp(1, 5, 2), RangeError));

test('parseDuration reads each unit', () => {
  assert.equal(parseDuration('90s'), 90);
  assert.equal(parseDuration('2m'), 120);
  assert.equal(parseDuration('1h'), 3600);
});
test('parseDuration adds mixed units, ignoring case and outer spaces', () => {
  assert.equal(parseDuration('1h30m'), 5400);
  assert.equal(parseDuration(' 1H2M3S '), 3723);
});
test('parseDuration returns null for anything invalid', () => {
  for (const bad of ['', 'abc', '10', '5x', '1h 30m', '-5s', 12, null]) assert.equal(parseDuration(bad), null);
});
