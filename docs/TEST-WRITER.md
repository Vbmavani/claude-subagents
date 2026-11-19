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
| 7 | How does it run, and what does it cost? | Sonnet, medium effort, 30 turns. It writes into your checkout, so you review `git status` and the one new file. |

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

1. **Know the worktree rule.** A worktree is built from `main`, not from your
   current branch, and Claude Code refuses writes outside it. An isolated agent
   cannot see files that exist only on a feature branch. That is why this agent
   has `isolation: worktree` turned off.
2. Restart Claude Code in this folder so it loads the agent. Agent files are
   read at session start, so edits made mid-session do not apply. Check `/agents`.
3. Ask:

```
Use the test-writer sub agent to write tests for demo/textkit
```

4. Grade the result.

```bash
node .claude/skills/test-quality/mutation-score.js demo/textkit
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

Live runs on 2026-11-19, in order:
1. Isolated worktree: wrote nothing. The worktree was built from `main`, which
   has no `demo/textkit`. The agent said so instead of guessing.
2. Told to use the main checkout by absolute path: wrote nothing. Claude Code
   rejected the write because the agent was isolated to its worktree.
3. Same setup as run 1, after turning isolation off in the file mid-session:
   the edit did not apply (agent files load at session start), so it was still
   isolated. It wrote `textkit.test.js` into its worktree anyway. Graded in a
   scratch folder next to the real `textkit.js`: 55 tests pass on the correct
   code and catch 10 of 10 planted bugs.

Things the runs showed:
- The agent counted 63 tests by reading its file. The run counted 55. Agents
  cannot count their own output, so let a script do it.
- It reported no bugs and listed what it chose not to test, as instructed.
- The first run that actually ran with isolation off, in your checkout, has
  not happened yet. Restart Claude Code, then run it once to confirm.
