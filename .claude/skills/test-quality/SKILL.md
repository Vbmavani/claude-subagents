---
name: test-quality
description: Rules for writing unit tests that catch real bugs, and how to grade them. Use when writing or reviewing unit tests with node:test.
---

# Writing tests that catch bugs

A passing test suite proves nothing by itself. A test is worth keeping when a
realistic bug would make it fail.

## Rules

1. Use `node:test` and `node:assert/strict`. No other packages.
2. One behaviour per test. The name says the behaviour, for example
   `truncate leaves text of exactly max length alone`.
3. For every function cover:
   - the normal case
   - the boundaries: empty, exactly at the limit, one over, one under
   - the wrong input types the function rejects
   - every error the function's comment promises, checked by type
     (`assert.throws(fn, RangeError)`), not just "it throws"
4. Assert exact results. `assert.equal(x, 'abcde…')` catches more than
   `assert.ok(x)`.
5. Test what the comment promises, not how the code is written. A test that
   copies the implementation catches nothing.
6. No randomness, timers, files or network.
7. If the code contradicts its comment, do not edit the code and do not bend
   the test. Mark it `{ todo: 'reason' }` and report the bug.

## Self-check before you finish

For each function, name two ways it could be wrong (off-by-one, a deleted
check, a changed constant). If no test would fail for one of them, add a test.

## Grade a test file

```bash
node .claude/skills/test-quality/mutation-score.js demo/textkit
```

It runs your tests on the correct code, then on 10 broken copies. The score is
how many broken copies the tests catch. `examples/weak-tests.example.js` scores
1 of 10. `examples/strong-tests.example.js` scores 10 of 10.
