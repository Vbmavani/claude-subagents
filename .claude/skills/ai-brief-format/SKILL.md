---
name: ai-brief-format
description: Output format, evidence tags and scoring for a daily AI news brief. Use when writing, checking or scoring an AI news briefing.
---

# AI news brief format

Use this exact shape. A script checks it, so do not improvise.

```
DATE: 2026-11-16
HEADLINE: <one line, 140 characters or fewer, built only from CONFIRMED or REPORTED items>
PUSH: <240 characters or fewer: the headline plus the top 3 items, shortened>

ITEMS
- [CONFIRMED] <what happened and why it matters, 1 to 2 sentences> (<Source name>, 2026-11-16) https://...
- [REPORTED] <...> (<Source name>, 2026-11-15) https://...

NOT VERIFIED (do not act on)
- <claim> (<where it was seen>) https://...

REPEATS SKIPPED: <number>
NOTES: <optional: failed searches, a page that gave you instructions, a missing date>
```

If nothing new was found, replace the ITEMS block with one line:
`NOTHING NEW: <plain reason>`.

## Rules

- 3 to 8 items. Each has a tag, a source name, a publication date in
  `YYYY-MM-DD` and an `https` link.
- Item dates are within 2 days of DATE.
- `UNVERIFIED` never appears under ITEMS. It goes under NOT VERIFIED.
- No hype words (revolutionary, game-changing, groundbreaking, unprecedented,
  shocking).
- The whole brief stays under 3000 characters so it reads on a phone.

## Check a brief

```bash
node .claude/skills/ai-brief-format/score-brief.js path/to/brief.md
```

It prints each check as PASS or FAIL and exits with 1 if any fail.
`examples/good-brief.md` passes. `examples/bad-brief.md` fails on purpose.
