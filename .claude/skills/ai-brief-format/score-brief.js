#!/usr/bin/env node
// Checks an AI news brief against the format in SKILL.md.
//   node score-brief.js brief.md [--json]
// Exit code 1 when any check fails. This checks the shape and the sourcing
// rules. It cannot tell whether a claim is true: the agent's evidence tags do that.

const fs = require('fs');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const file = args.find((a) => !a.startsWith('--'));
if (!file) { console.error('usage: node score-brief.js brief.md [--json]'); process.exit(2); }

let text;
try { text = fs.readFileSync(file, 'utf8'); }
catch (e) { console.error(`Cannot read ${file}`); process.exit(2); }

const lines = text.split('\n');
const field = (name) => {
  const l = lines.find((x) => x.startsWith(`${name}:`));
  return l ? l.slice(name.length + 1).trim() : null;
};
const day = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };

const date = field('DATE');
const headline = field('HEADLINE');
const push = field('PUSH');
const nothingNew = lines.some((l) => l.startsWith('NOTHING NEW:'));

// Lines under ITEMS, up to the next section.
const start = lines.findIndex((l) => l.trim() === 'ITEMS');
const stop = lines.findIndex((l, i) => i > start && /^(NOT VERIFIED|REPEATS SKIPPED|NOTES)/.test(l));
const items = start === -1 ? [] : lines.slice(start + 1, stop === -1 ? undefined : stop).filter((l) => l.startsWith('- '));

const itemRe = /^- \[(CONFIRMED|REPORTED|UNVERIFIED)\] .+ \(([^,()]+), (\d{4}-\d{2}-\d{2})\) (https:\/\/\S+)\s*$/;
const parsed = items.map((l) => ({ line: l, m: itemRe.exec(l) }));
const urls = parsed.filter((p) => p.m).map((p) => p.m[4]);
const hype = /\b(revolutionary|game[- ]changing|groundbreaking|unprecedented|shocking)\b/i;

const checks = [
  ['DATE present and valid', day(date) !== null, date || 'missing'],
  ['HEADLINE present, 140 characters or fewer', !!headline && headline.length <= 140, headline ? `${headline.length} chars` : 'missing'],
  ['PUSH present, 240 characters or fewer', !!push && push.length <= 240, push ? `${push.length} chars` : 'missing'],
  nothingNew
    ? ['NOTHING NEW used instead of padding', items.length === 0, `${items.length} items`]
    : ['3 to 8 items', items.length >= 3 && items.length <= 8, `${items.length} items`],
  ['Every item matches: [TAG] text (Source, YYYY-MM-DD) https://link', parsed.every((p) => p.m), `${parsed.filter((p) => !p.m).length} malformed`],
  ['No UNVERIFIED item under ITEMS', parsed.every((p) => !p.m || p.m[1] !== 'UNVERIFIED'), ''],
  ['Item dates within 2 days of DATE', day(date) === null || parsed.every((p) => {
    if (!p.m) return false; const d = day(p.m[3]); return d !== null && d <= day(date) && day(date) - d <= 2 * 86400000; }), ''],
  ['No duplicate links', new Set(urls).size === urls.length, ''],
  ['No hype words', !hype.test(text), (hype.exec(text) || [''])[0]],
  ['Under 3000 characters', text.length <= 3000, `${text.length} chars`],
];

const failed = checks.filter(([, ok]) => !ok).length;
if (asJson) {
  console.log(JSON.stringify({ file, passed: checks.length - failed, total: checks.length,
    checks: checks.map(([name, ok, detail]) => ({ name, ok, detail })) }, null, 2));
} else {
  console.log(`Checking ${file}\n`);
  for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
}
process.exit(failed ? 1 : 0);
