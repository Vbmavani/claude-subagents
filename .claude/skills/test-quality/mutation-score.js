#!/usr/bin/env node
// Grades a test file by how many deliberately broken copies of the code it catches.
//
//   node mutation-score.js [dir] [--json]      dir defaults to demo/textkit
//
// It expects dir/textkit.js and dir/textkit.test.js. First the tests must pass on the
// correct code. Then each mutant in mutants.json (one small bug) is swapped in and the
// tests are run again. A mutant is "killed" when the tests fail. A test suite that
// passes everything is not testing much.
//
// The test-writer agent cannot read this file or mutants.json: its hook only allows
// reads inside demo/textkit. An agent that can see the bugs would write tests for the
// bugs instead of for the behaviour.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || 'demo/textkit');
const srcPath = path.join(dir, 'textkit.js');
const testPath = path.join(dir, 'textkit.test.js');

for (const p of [srcPath, testPath]) {
  if (!fs.existsSync(p)) { console.error(`Missing ${p}`); process.exit(2); }
}
const source = fs.readFileSync(srcPath, 'utf8');
const testText = fs.readFileSync(testPath, 'utf8');
const mutants = JSON.parse(fs.readFileSync(path.join(__dirname, 'mutants.json'), 'utf8'));

function run(sourceText) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mutation-'));
  try {
    fs.writeFileSync(path.join(tmp, 'textkit.js'), sourceText);
    fs.writeFileSync(path.join(tmp, 'textkit.test.js'), testText);
    const r = spawnSync(process.execPath, ['--test', 'textkit.test.js'], { cwd: tmp, encoding: 'utf8', timeout: 20000 });
    return { passed: r.status === 0, timedOut: r.error && r.error.code === 'ETIMEDOUT', out: `${r.stdout || ''}${r.stderr || ''}` };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const baseline = run(source);
const testCount = (/# tests (\d+)/.exec(baseline.out) || [])[1];
const results = [];
if (baseline.passed) {
  for (const m of mutants) {
    const hits = source.split(m.find).length - 1;
    if (hits !== 1) { results.push({ name: m.name, status: 'broken-mutant', detail: `find text matched ${hits} times` }); continue; }
    const r = run(source.replace(m.find, () => m.replace));
    results.push({ name: m.name, status: r.passed ? 'SURVIVED' : 'killed' });
  }
}

const killed = results.filter((r) => r.status === 'killed').length;
const valid = results.filter((r) => r.status !== 'broken-mutant').length;

if (asJson) {
  console.log(JSON.stringify({ dir, baselinePassed: baseline.passed, tests: testCount ? Number(testCount) : null, killed, total: valid, results }, null, 2));
} else {
  console.log(`Grading ${testPath}\n`);
  console.log(`${baseline.passed ? 'PASS' : 'FAIL'}  tests pass on the correct code${testCount ? `  (${testCount} tests)` : ''}`);
  if (!baseline.passed) {
    console.log('\nThe tests fail on the correct code, so nothing else was run. Output:\n');
    console.log(baseline.out.split('\n').slice(0, 25).join('\n'));
  } else {
    console.log('');
    for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
    console.log(`\nScore: ${killed}/${valid} bugs caught`);
  }
}
process.exit(baseline.passed ? 0 : 1);
