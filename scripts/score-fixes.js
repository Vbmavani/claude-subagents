#!/usr/bin/env node
// Scores how many of the 15 seeded flaws in demo/app are gone.
//
//   node scripts/score-fixes.js [path/to/demo/app] [--json]
//
// It is a static check (regex over server.js and package.json), not proof of
// security. It answers "did the obvious vulnerable pattern go away, and is a
// fix pattern present?". Use the security-auditor agent for judgement.
//
// The vuln-fixer agent cannot read this file (its hook limits it to demo/app/).
// That is on purpose: an agent that can see the grader learns the grader.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const appDir = path.resolve(args.find((a) => !a.startsWith('--')) || 'demo/app');

const read = (f) => {
  try { return fs.readFileSync(path.join(appDir, f), 'utf8'); }
  catch { console.error(`Cannot read ${path.join(appDir, f)}`); process.exit(1); }
};

// Strip comments so "// no rate limiting" does not count as a fix.
const src = read('server.js')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');
const pkg = JSON.parse(read('package.json'));
const deps = { ...(pkg.dependencies || {}) };

// Text of one route handler: from `app.<method>('<route>'` to the next top-level `app.` line.
function route(method, p) {
  const re = new RegExp(`app\\.${method}\\(\\s*['"\`]${p.replace(/[/:]/g, (c) => '\\' + c)}['"\`]`);
  const m = re.exec(src);
  if (!m) return '';
  const rest = src.slice(m.index);
  const next = rest.slice(1).search(/\napp\.|\nfunction |\nconst /);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

// "4.21.2", "^4.21.2", "~4.21.2" -> [4,21,2]; anything else -> null
const ver = (v) => {
  const m = /^[~^]?(\d+)\.(\d+)\.(\d+)$/.exec(String(v || '').trim());
  return m ? m.slice(1).map(Number) : null;
};
const atLeast = (v, min) => {
  const a = ver(v);
  if (!a) return false;
  for (let i = 0; i < 3; i++) { if (a[i] !== min[i]) return a[i] > min[i]; }
  return true;
};

const signup = route('post', '/signup');
const login = route('post', '/login');
const notes = route('get', '/notes/:id');
const exportR = route('get', '/export');
const search = route('get', '/search');
const backup = route('post', '/admin/backup');
const redirect = route('get', '/redirect');

const checks = [
  ['Hardcoded JWT secret',
    !/JWT_SECRET\s*=\s*['"`]/.test(src) && !/hunter2/.test(src) && /process\.env/.test(src)],
  ['MD5 password hashing',
    !/createHash\(\s*['"]md5['"]/.test(src) && /scrypt|bcrypt|argon2|pbkdf2/i.test(src)],
  ['SQL injection (signup, login, notes)',
    !/db\.(run|get|all|exec|prepare)\(\s*`[^`]*\$\{/.test(src)],
  ['No auth on GET /notes/:id (IDOR)',
    notes !== '' && /owner|user_?id|userId|req\.user/i.test(notes)],
  ['Path traversal in /export',
    exportR !== '' && !/path\.join\([^)]*req\.query\.file\s*\)/.test(exportR) &&
      /basename|startsWith|allow/i.test(exportR)],
  ['Reflected XSS in /search',
    search !== '' && !/\$\{\s*req\.query\.q\s*\}/.test(search)],
  ['Trusting client-sent admin flag',
    !/req\.body\.admin/.test(src)],
  ['Shell command built from input',
    !/\bexec\(\s*`[^`]*\$\{/.test(src) && !/\bexec\([^)]*req\./.test(src)],
  ['Open redirect',
    redirect === '' || !/redirect\(\s*req\.(query|body|params)/.test(redirect)],
  ['Tokens never expire',
    /jwt\.sign\([\s\S]*?expiresIn/.test(src)],
  ['No login rate limiting',
    /rate.?limit|limiter|attempts|tooManyRequests|429/i.test(src)],
  ['CORS open to every origin',
    !/cors\(\s*\)/.test(src) && !/origin\s*:\s*['"]\*['"]/.test(src)],
  ['Stack traces leaked',
    !/\.stack\b/.test(src.split('\n').filter((l) => /res\./.test(l)).join('\n')) &&
      !/DEBUG\s*=\s*true/.test(src)],
  ['No input validation on signup',
    signup !== '' && /typeof|\.length|validate|test\(/.test(signup)],
  ['Old or unpinned dependencies',
    !('request' in deps) && !('left-pad' in deps) &&
      !Object.values(deps).some((v) => v === '*' || v === 'latest') &&
      atLeast(deps.express, [4, 21, 2]) &&
      (!('lodash' in deps) || atLeast(deps.lodash, [4, 17, 21])) &&
      (!('jsonwebtoken' in deps) || atLeast(deps.jsonwebtoken, [9, 0, 0]))],
];

// login is checked by the SQL injection rule; referenced so a missing route is visible.
if (!login) checks.push(['POST /login route still exists', false]);

const fixed = checks.filter(([, ok]) => ok).length;

if (asJson) {
  console.log(JSON.stringify({ appDir, fixed, total: checks.length,
    checks: checks.map(([name, ok]) => ({ name, fixed: ok })) }, null, 2));
} else {
  console.log(`Scoring ${appDir}\n`);
  checks.forEach(([name, ok], i) =>
    console.log(`${String(i + 1).padStart(2)}. ${ok ? 'FIXED  ' : 'OPEN   '} ${name}`));
  console.log(`\nScore: ${fixed}/${checks.length}`);
}
