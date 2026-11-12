---
description: Run the three persona reviewers in parallel on any file or folder
argument-hint: <path to a file or folder>
---

Run the persona panel on this target: $ARGUMENTS

Steps:

1. If no path was given, ask which file or folder to review and stop.
2. Confirm the path exists. If it does not, say so and stop.
3. Launch these three sub agents IN PARALLEL (one message, three calls),
   passing each only the target path and nothing else. Do not summarize or
   pre-judge the target for them; the point is that they start with fresh,
   unbiased context:
   - panel-beginner
   - panel-senior-engineer
   - panel-skeptical-buyer
4. When all three return, show a short combined result:
   - A table with one row per persona: persona, verdict or score, single
     biggest problem.
   - Where two or more personas flagged the same issue (consensus).
   - Where they disagree, and why that is useful.
   - The top 3 fixes overall, in order.
5. Keep the final summary under 300 words. Offer to show any persona's full
   report instead of pasting all three.
