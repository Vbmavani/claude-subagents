# claude-subagents

Claude Code sub agents, plus a deliberately flawed demo project to test them
on. Built as a hands-on way to learn how sub agents work.

| Agent | Model | Tools | Job |
|-------|-------|-------|-----|
| `plan-roaster` | Haiku | Read, Grep, Glob | Adversarial review of a plan, with no memory of your conversation |
| `security-auditor` | Haiku | Read, Grep, Glob | Audits dependencies, auth, input validation, secrets |
| `vuln-fixer` | Sonnet | Read, Grep, Glob, Edit, Write, Bash (fenced by a hook) | Fixes `demo/app` in an isolated worktree, remembers what worked |
| `field-lab` | Haiku | Read, Grep, Glob | Sandbox for trying every front matter field |

`/fix-and-verify` chains them: `vuln-fixer` patches, `security-auditor`
re-checks with fresh eyes, and `scripts/score-fixes.js` counts how many of
the 15 seeded flaws are gone. See [docs/VULN-FIXER.md](docs/VULN-FIXER.md).

There is also a three-persona review panel (`panel-beginner`,
`panel-senior-engineer`, `panel-skeptical-buyer`) that runs in parallel on any
file or folder with `/persona-panel <path>`. See
[docs/PERSONA-PANEL.md](docs/PERSONA-PANEL.md).

## Why sub agents

- **Clean context.** Big file reads happen in the agent's window. Your main
  session only receives the short report.
- **Unbiased review.** The agent starts fresh, so it has not been talked into
  your plan.
- **Cheap models.** Reading and criticising can run on Haiku while a stronger
  model orchestrates.
- **Hard permissions.** `tools:` in the front matter is enforced by the tool
  layer. A line in the prompt saying "do not edit" is not.

## Layout

```
.claude/agents/plan-roaster.md      agent definition (YAML front matter + prompt)
.claude/agents/security-auditor.md
.claude/agents/panel-*.md           three persona reviewers
.claude/agents/vuln-fixer.md        the one agent that edits code
.claude/agents/field-lab.md         front matter sandbox
.claude/commands/persona-panel.md   /persona-panel slash command
.claude/commands/fix-and-verify.md  /fix-and-verify loop
.claude/hooks/vuln-fixer-guard.sh   PreToolUse fence for vuln-fixer
scripts/score-fixes.js              counts fixed flaws in demo/app
demo/plan.md                        a plan full of holes
demo/landing-page.md                an overhyped product page
demo/app/                           a tiny Express app full of vulnerabilities
docs/TESTING.md                     step-by-step experiments
```

## Quick start

```bash
git clone <this repo>
cd claude-subagents
claude
```

Then:

```
Use the plan-roaster sub agent to review demo/plan.md
Use the security-auditor sub agent on demo/app
```

See [docs/TESTING.md](docs/TESTING.md) for the full set of experiments.

## Use the agents in your own project

Copy the two files into your project's `.claude/agents/`, or into
`~/.claude/agents/` to use them everywhere. Tune each `description` until it
triggers when you want and not otherwise.

## Warning

`demo/app` is intentionally vulnerable. Never deploy it or run it on a public
network. The "secret" in it is fake. Nothing in it needs `npm install` to be
reviewed, and it should not be installed.

## License

MIT
