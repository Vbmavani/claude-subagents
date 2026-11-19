# test-writer

An agent that writes unit tests for a small module, runs them, and reports real
bugs without touching the code. Its tests are graded by how many deliberately
broken copies of the code they catch.

## The seven questions, answered

| # | Question | Decision |
|---|----------|----------|
| 1 | What result, for whom? | A passing `textkit.test.js` and a short report: tests added, bugs found, what it chose not to test. |
| 2 | An agent at all? | Yes. Write, run, fix is a loop that needs its own context and tools. A script cannot judge which edge cases matter. |
| 3 | What must it know? | The function comments are the specification. The rules for good tests come from the `test-quality` skill. |
| 4 | What may it touch? | It reads `demo/textkit/`, writes only `demo/textkit/*.test.js`, and runs only its own tests. A hook enforces this. |
| 5 | What should it remember? | Nothing. Project memory would be written inside the worktree and lost with it, and the rules already live in the skill. |
| 6 | How will I know it worked? | `mutation-score.js` runs the tests against 10 broken copies. The weak example scores 1 of 10 and the strong one 10 of 10. |
| 7 | How does it run, and what does it cost? | Sonnet, medium effort, 30 turns, in its own worktree. You review the branch. |

## Files

| File | Job |
|------|-----|
| `.claude/agents/test-writer.md` | The agent |
| `.claude/skills/test-quality/SKILL.md` | Rules for tests that catch bugs |
| `.claude/skills/test-quality/mutation-score.js`, `mutants.json` | The grader and the 10 bugs |
| `.claude/skills/test-quality/examples/` | A weak and a strong test file, to calibrate the grader |
| `.claude/hooks/test-writer-guard.sh` | The fence |
| `demo/textkit/textkit.js` | Six small functions to test. The code is correct. |

## Run it

1. **Commit first.** The agent runs in a worktree, which is built from your
   commits. Uncommitted files will not be in it.
2. Restart Claude Code in this folder so it loads the agent. Check `/agents`.
3. Ask:

```
Use the test-writer sub agent to write tests for demo/textkit
```

4. Grade the result. The agent reports its worktree path.

```bash
node .claude/skills/test-quality/mutation-score.js <worktree path>/demo/textkit
```

5. Read the diff before keeping anything.

## What the hook enforces

| Tool | Allowed |
|------|---------|
| Read, Grep, Glob | Paths inside `demo/textkit/` only, so it cannot see the grader or the bug list. |
| Write, Edit | `demo/textkit/<name>.test.js` only, so it cannot edit the code under test. |
| Test content | May load only `node:test`, `node:assert` and `./textkit.js`. No eval, fetch, child_process. |
| Bash | `node --test` on its test file, `node --check`, `git diff`, `git status`, `ls`. |

Known gap: the content check is a text search, not a sandbox. Determined
obfuscation could get past it. The bigger protection is that the agent runs in
a throwaway worktree.

## Experiments

1. Run it once, grade it, then ask the agent to improve its tests and grade
   again. Does the score move? That tells you whether the loop helps.
2. Swap `model: sonnet` for `haiku`. Compare scores and cost.
3. Add a bug to `textkit.js` that contradicts a comment. Does the agent report
   it instead of fixing it?
4. Lower `maxTurns` to 8. What does it skip, and does the report admit it?
5. Remove the hook, restart, and ask it to "also fix any bugs you find".

## Status

Tested: the grader on the weak and strong examples (1 of 10, then 10 of 10),
and the hook on 27 sample calls (8 allowed, 19 blocked as intended).

Not tested: a live run of the agent. Not verified: that the worktree
contains the files, which depends on how Claude Code branches it. If
`demo/textkit` is missing inside the worktree, commit and try again.
