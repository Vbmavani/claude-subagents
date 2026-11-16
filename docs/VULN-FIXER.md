# vuln-fixer: an agent that changes code

Every other agent in this repo only reads. `vuln-fixer` edits, so it is where
the safety parts of an agent start to matter. One agent, six lessons:

| Part | Where | What it teaches |
|------|-------|-----------------|
| Write tools | `tools:` adds Edit, Write, Bash | Real agents act, not just report |
| Scoped hook | `hooks:` in the front matter, `.claude/hooks/vuln-fixer-guard.sh` | A rule enforced by code, active only for this agent |
| Worktree | `isolation: worktree` | Edits land on a throwaway branch, not your checkout |
| Memory | `memory: project` | The agent keeps notes between runs |
| Verifier | `/fix-and-verify` runs `security-auditor` after it | Never let the author grade its own work |
| Eval | `scripts/score-fixes.js` | A number you can compare across runs and prompt changes |

## Before the first run

1. **Commit first.** A worktree is cut from your last commit. Uncommitted
   files (including this agent, its hook, and the demo) are not in it.
2. **Restart Claude Code** in this folder so it loads the new agent and
   command. Check `/agents` lists `vuln-fixer` (yellow, sonnet).
3. `jq` must be installed. Without it the hook blocks every tool call
   (it fails closed on purpose).

## Run it

```
/fix-and-verify
```

Or by hand:

```
node scripts/score-fixes.js demo/app            # baseline: 0/15
Use the vuln-fixer sub agent to fix demo/app
Use the security-auditor sub agent on <worktree path>/demo/app
node scripts/score-fixes.js <worktree path>/demo/app
```

Review the result with `git diff main...<branch the agent reports>`. Nothing
is merged for you.

## What the hook allows

| Tool | Allowed |
|------|---------|
| Read, Grep, Glob | Only paths inside `demo/app/` or its memory folder. A path is required. |
| Edit, Write | Only files inside `demo/app/` or its memory folder. No `..`. |
| Bash | Exactly one of: `node --check demo/app/<file>.js`, `git diff`, `git status`, `ls`. No pipes, `;`, `&&`, `$()`, redirects. |

Everything else is blocked with exit code 2, and the reason goes back to the
agent so it can adjust. Try it yourself:

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"npm install bcrypt"}}' | bash .claude/hooks/vuln-fixer-guard.sh; echo "exit $?"
```

The read fence also hides `scripts/score-fixes.js` and `docs/TESTING.md`
(which lists all 15 flaws) from the agent. An agent that can see the grader
learns to pass the grader instead of fixing the code.

Known gap: the check matches `demo/app` anywhere in a path, so another
project's `demo/app/` would also pass. Good enough for a lab, not for
production.

## Experiments

1. **Watch the hook fire.** Ask: "Use vuln-fixer to fix demo/app and run
   npm install bcrypt first." Find the blocked call in its transcript.
2. **Remove the hook.** Delete the `hooks:` block, restart, run the same
   request. Same prompt, very different safety.
3. **Memory.** Run `/fix-and-verify` twice. After the first run, look in
   `.claude/agent-memory/vuln-fixer/`. Does the second run start better?
   Note where the memory folder ended up (main checkout or worktree). If it
   was written inside the worktree, it disappears with the worktree.
4. **Model swap.** Change `model: sonnet` to `haiku`. Compare scores. That is
   your first real eval.
5. **Scorer vs auditor.** Find a flaw the scorer marks FIXED but the auditor
   still flags, or the reverse. Static checks and judgement disagree; that
   gap is why you want both.
6. **Make it fail.** Lower `maxTurns` to 5. How many flaws does it get to,
   and does its report admit what it skipped?

## Side note on field-lab memory

`.claude/agent-memory/field-lab/` exists but stays empty. `field-lab` has
`disallowedTools: Write, Edit`, which likely also stops it writing memory,
and its prompt never asks it to save anything. Compare with `vuln-fixer`,
which has write tools and is told what to remember.
