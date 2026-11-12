# claude-subagents

Two read-only Claude Code sub agents, plus a deliberately flawed demo project
to test them on. Built as a hands-on way to learn how sub agents work.

| Agent | Model | Tools | Job |
|-------|-------|-------|-----|
| `plan-roaster` | Haiku | Read, Grep, Glob | Adversarial review of a plan, with no memory of your conversation |
| `security-auditor` | Sonnet | Read, Grep, Glob | Audits dependencies, auth, input validation, secrets |

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
demo/plan.md                        a plan full of holes
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
