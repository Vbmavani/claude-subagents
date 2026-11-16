---
description: Fix demo/app with vuln-fixer, verify with security-auditor, score the result
argument-hint: "[max rounds, default 2]"
---

Run the fix-and-verify loop on `demo/app`. Max rounds: $ARGUMENTS (default 2,
never more than 3).

You are the orchestrator. Sub agents cannot start other sub agents, so you
pass results between them. Do not edit `demo/app` yourself.

1. **Baseline.** Run `node scripts/score-fixes.js demo/app` and note the score.

2. **Fix (round 1).** Launch the `vuln-fixer` sub agent. Tell it only:
   "Fix the security vulnerabilities in demo/app." It runs in its own git
   worktree. From its result, note the worktree path and branch. If it made
   no changes, say so and stop.

3. **Verify.** Launch the `security-auditor` sub agent on
   `<worktree path>/demo/app`. Do not pass it the fixer's report; it should
   judge the code with fresh eyes, not take the fixer's word for it.

4. **Score.** Run `node scripts/score-fixes.js <worktree path>/demo/app`.

5. **Next round, only if needed.** If the auditor still reports any critical
   or high finding and rounds remain, send the auditor's findings (just the
   FINDINGS section) back to the same vuln-fixer agent with SendMessage so it
   keeps its worktree and context. If resuming is not available, launch a new
   vuln-fixer and tell it to edit the files in `<worktree path>/demo/app`.
   Then repeat steps 3 and 4.

6. **Report** in under 300 words:
   - Score per round: baseline -> round 1 -> round 2.
   - Where the scorer and the auditor disagree (one says fixed, the other
     says open). These are the interesting cases.
   - What is still open, and the fixer's follow-ups for a human.
   - The branch name and how to review it: `git diff main...<branch>`.

Never merge, push, or delete the branch. The user reviews it.
