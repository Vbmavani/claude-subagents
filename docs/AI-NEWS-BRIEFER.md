# ai-news-briefer

One agent that uses every component a single agent can have. It turns your
daily AI news task into a briefing where each claim says how well it is
sourced.

A walkthrough of the thinking behind it, with a diagram, is in
[how-to-design-an-agent.html](how-to-design-an-agent.html). Open it in a browser.

## Why this agent

Your `daily-ai-news-research` task runs every day. In its last run:
- general queries returned old or conflicting pages, and only a date-specific
  query found current items
- big claims (a CEO resigning, an IPO price) came from newsletters, with no
  primary source
- the push notification was skipped, so the brief was the only delivery

Each of those became a rule in the agent.

## Components, and why each is there

| Component | Where | Decision |
|-----------|-------|----------|
| Job and trigger | `description` in `.claude/agents/ai-news-briefer.md` | Names the daily task so it is picked automatically. The caller must pass today's date. |
| Prompt | the body of the same file | Search with the date in every query. Tag claims by evidence. Skip repeats. |
| Tools | `tools: WebSearch, WebFetch` | Reads the web, nothing else. It cannot send the push or touch files. |
| Model and effort | `sonnet`, `medium` | Judging sources needs more than Haiku. Swap and compare scores. |
| Turn limit | `maxTurns: 25` | Cost guard. Agents use many times the tokens of chat. |
| Memory | `memory: user` | Remembers what it already reported and which outlets misled it. User scope so scheduled runs from any folder share it. |
| Skill | `skills: [ai-brief-format]` | The output format and checks live in a skill that bundles its own script and examples. |
| Hook | `.claude/hooks/ai-news-guard.sh` | Fetched pages are untrusted. Only plain `https` sites, no IPs, localhost or internal names. |
| Output contract | `.claude/skills/ai-brief-format/SKILL.md` | Fixed shape, including a `PUSH:` line sized for a phone. |
| Eval | `.claude/skills/ai-brief-format/score-brief.js` | 10 checks on shape and sourcing. A good and a bad example brief are included. |

Left out on purpose:
- `isolation: worktree`: it writes no code, so there is nothing to isolate.
- `mcpServers`: nothing it needs is behind an MCP server. Add one only if a
  source needs it (for example GitHub releases as a primary source).

## Try it

Restart Claude Code in this folder, then:

```
Use the ai-news-briefer sub agent. Today is <date>.
```

Check the result:

```bash
node .claude/skills/ai-brief-format/score-brief.js path/to/brief.md
```

## Use it in your scheduled task

The scheduled task runs from `~/Desktop`, so it cannot see this repo's
`.claude/` folder. To use the agent there, copy it to your user folder:

```bash
mkdir -p ~/.claude/agents ~/.claude/skills ~/.claude/hooks
cp .claude/agents/ai-news-briefer.md ~/.claude/agents/
cp -r .claude/skills/ai-brief-format ~/.claude/skills/
cp .claude/hooks/ai-news-guard.sh ~/.claude/hooks/
```

Then change the hook path in the copied agent to
`$HOME/.claude/hooks/ai-news-guard.sh`, and change the task so it calls the
agent with the date and sends the `PUSH:` line. Not done yet.

## Status

Tested:
- the scorer on the good and bad examples, and the hook on 14 URLs
- one live run on 2026-11-19: the brief scored 10/10, and `memory: user` wrote
  `MEMORY.md`, `seen.md` and `sources.md` to
  `~/.claude/agent-memory/ai-news-briefer/`

Not checked:
- whether the news claims in that brief are true. The scorer checks shape and
  sourcing rules only.
- whether the fetch guard hook fired. None of that run's fetches were blocked.
- a scheduled run. The task is unchanged and still needs the copy step above.

The agent estimated its own brief at about 2,100 characters. The scorer
counted 2,527. Let the scorer do the counting.
