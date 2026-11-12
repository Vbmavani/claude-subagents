# Persona panel

Three separate, read-only reviewers that look at the same thing from
different seats. They are not tied to this repo's demo: give them any file or
folder, in this repo or another.

| Agent | Persona | Model | Judges |
|-------|---------|-------|--------|
| `panel-beginner` | Linda, retired teacher, new to the topic | Haiku | Can a newcomer follow it? |
| `panel-senior-engineer` | Priya, 15 years shipping systems | Sonnet | Is it technically sound and operable? |
| `panel-skeptical-buyer` | David, COO with a budget | Sonnet | Is it convincing and low-risk to buy? |

Each agent is its own file in `.claude/agents/`, so you can tune, swap the
model, or delete one without touching the others.

## Run it

Everything at once, in parallel:

```
/persona-panel demo/landing-page.md
```

One persona at a time:

```
Use the panel-beginner sub agent on README.md
```

## Try these targets

| Target | Expect |
|--------|--------|
| `demo/landing-page.md` | Buyer rejects "military-level secure" and "Contact us" pricing. Beginner is lost on "proprietary algorithm". |
| `demo/plan.md` | Engineer flags MD5 and no backups. Buyer asks about reliability. |
| `demo/app` | Engineer finds concrete code risks. Beginner has little to say, which is itself a result. |
| `README.md` | Beginner tests whether this repo is understandable. |

## Using it on another project

Agents here only exist for sessions started in this repo. To review another
project without copying anything, start Claude Code in this repo and pass the
other project's path:

```
/persona-panel ../some-other-project
```

The agents are read-only, so they can inspect that folder but cannot change it.
If a session can't read outside this repo, start Claude Code with the extra
directory allowed, or copy the three agent files and the command into that
project's `.claude/` folder.

## What to learn from it

1. **Parallel:** all three start at once and cannot see each other.
2. **Fresh context:** none of them know how the target was made.
3. **Separate files:** each persona is tuned independently.
4. **Cost split:** the beginner runs on Haiku, the others on Sonnet. Swap
   models and compare the reports.
5. **Consensus vs disagreement:** the command asks the main session to
   compare reports. Overlaps are the real problems; disagreements show who
   the document is actually written for.
