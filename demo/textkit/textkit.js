// textkit: six small text and number helpers. No dependencies.
// This is the target the test-writer agent writes tests for. The code is correct on
// purpose. Its tests are graded by how many deliberately broken copies they catch.
'use strict';

// "Hello, Wörld!" -> "hello-world". Throws TypeError for non-strings.
function slugify(input) {
  if (typeof input !== 'string') throw new TypeError('slugify expects a string');
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Cuts text to at most `max` characters, ending in the ellipsis when it was cut.
// Text that already fits is returned unchanged. A max shorter than the ellipsis
// returns just the start of the ellipsis.
function truncate(input, max, ellipsis = '…') {
  if (typeof input !== 'string') throw new TypeError('truncate expects a string');
  if (!Number.isInteger(max) || max < 0) throw new RangeError('max must be a non-negative integer');
  if (input.length <= max) return input;
  if (max <= ellipsis.length) return ellipsis.slice(0, max);
  return input.slice(0, max - ellipsis.length) + ellipsis;
}

// Counts words separated by any whitespace. Empty or blank text has 0 words.
function wordCount(input) {
  if (typeof input !== 'string') throw new TypeError('wordCount expects a string');
  const trimmed = input.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

// Splits an array into groups of `size`. The last group may be shorter.
function chunk(items, size) {
  if (!Array.isArray(items)) throw new TypeError('chunk expects an array');
  if (!Number.isInteger(size) || size < 1) throw new RangeError('size must be an integer of at least 1');
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Keeps value between min and max, inclusive. Throws RangeError when min > max.
function clamp(value, min, max) {
  if (min > max) throw new RangeError('min must not exceed max');
  return Math.min(Math.max(value, min), max);
}

// "1h30m" -> 5400, "90s" -> 90. Returns null for anything that is not a run of
// number+unit pairs with units h, m or s (letters in any case).
const UNIT_SECONDS = { h: 3600, m: 60, s: 1 };
function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim().toLowerCase();
  if (!/^(\d+[hms])+$/.test(text)) return null;
  let total = 0;
  for (const [, n, unit] of text.matchAll(/(\d+)([hms])/g)) total += Number(n) * UNIT_SECONDS[unit];
  return total;
}

module.exports = { slugify, truncate, wordCount, chunk, clamp, parseDuration };
