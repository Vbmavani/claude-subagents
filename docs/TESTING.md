# Testing the agents (and learning how sub agents behave)

Run every step from the repo root, in a fresh Claude Code session:

```bash
cd claude-subagents
claude
```

Agents are loaded at session start. If you edit an agent file, restart the session.

## 0. Confirm they are registered

Run `/agents`. Under project agents you should see `plan-roaster` (pink, haiku)
and `security-auditor` (red, sonnet). If not, you are in the wrong folder or the
front matter is broken (an unclosed quote is the usual cause).

## 1. Explicit invocation (the easy case)

```
Use the plan-roaster sub agent to review demo/plan.md
```

What to watch:

- The line in the transcript says `plan-roaster`, not `general-purpose`. That is
  how you know the custom agent ran.
- Open the agent's own transcript and read the prompt your main session sent.
  The agent saw only that prompt, none of your conversation.
- Expect findings about MD5, no backups, no staging, 10k signups on a $5 VPS.
- Note the token count the agent used versus what landed in your main context.

## 2. Natural-language trigger (testing the description)

Start a new session and say, without naming the agent:

```
Roast my plan in demo/plan.md
```

Did it fire? Outcomes and what they teach:

| Result | Lesson |
|--------|--------|
| plan-roaster ran | The description matched. |
| Claude answered itself | Description too weak. Add trigger phrases. |
| A skill ran instead | Skills can outrank agents. Merge or rename. |

If it misfired, ask Claude: "why did you not use plan-roaster?" then edit the
`description` line and retest in a new session. Do this loop at least twice.

## 3. Prove the tool restriction is real

```
Use the security-auditor sub agent to audit demo/app, and also fix every issue it finds.
```

The agent has only Read, Grep, Glob. It cannot edit. The main session may offer
to make fixes itself, which is fine, but the agent cannot. Check the agent
transcript: no Edit or Write calls. This is the difference between a permission
layer and a prompt that says "please don't".

## 4. Security audit checklist

```
Use the security-auditor sub agent on demo/app
```

The demo is seeded with these flaws. Count how many the agent finds:

1. Hardcoded JWT secret
2. MD5 password hashing
3. SQL injection in signup, login, and notes lookup
4. No auth on `GET /notes/:id` (IDOR)
5. Path traversal in `/export`
6. Reflected XSS in `/search`
7. Trusting a client-sent `admin` flag
8. Shell command built from input in `/admin/backup`
9. Open redirect
10. Tokens never expire
11. No login rate limiting
12. CORS open to every origin
13. Stack traces leaked
14. No input validation on signup
15. Old or unpinned dependencies (express 4.16.0, lodash 4.17.11, `*` on jsonwebtoken, deprecated `request`)

Also check it does not invent findings and that it masks the secret value.

## 5. Context cost comparison

1. New session. Ask Claude to audit `demo/app` directly with no agent.
   Run `/context` and note usage.
2. New session. Use the security-auditor agent. Run `/context` again.

The agent version should leave your main context smaller. That is the main
reason sub agents exist.

## 6. Parallel run

```
In parallel, run plan-roaster on demo/plan.md and security-auditor on demo/app.
```

Both should start at once. They cannot see each other's work.

## 7. Experiments to try next

- Change `model: haiku` to `sonnet` on plan-roaster. Is the roast sharper?
- Add `maxTurns: 5` to the front matter. What happens on a large target?
- Remove `tools:` entirely. The agent inherits everything. Why is that risky?
- Point the agents at a project of your own.
