#!/usr/bin/env bash
# PreToolUse guard for the vuln-fixer agent (wired in its front matter).
#
# Claude Code sends the pending tool call as JSON on stdin.
#   exit 0 -> allow the call
#   exit 2 -> block it; whatever is on stderr is shown to the agent as the reason
#
# This is the "hard" version of a prompt rule: the agent can ignore a sentence
# in its prompt, but it cannot get past this script.

set -u

input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  echo "vuln-fixer-guard: jq is not installed, so every tool call is blocked. Install jq." >&2
  exit 2   # fail closed: no guard means no tools
fi

tool="$(jq -r '.tool_name // ""' <<<"$input")"

block() { echo "Blocked by vuln-fixer-guard: $1" >&2; exit 2; }

# A path is in scope if it is inside demo/app/ or the agent's own memory folder.
# Matches relative paths and absolute ones, including inside a worktree.
in_scope() {
  local p="$1"
  [[ "$p" == *".."* ]] && return 1
  [[ "$p" =~ (^|/)demo/app(/|$) ]] && return 0
  [[ "$p" =~ (^|/)\.claude/agent-memory/vuln-fixer(/|$) ]] && return 0
  return 1
}

case "$tool" in
  Read|Grep|Glob)
    p="$(jq -r '.tool_input.file_path // .tool_input.path // ""' <<<"$input")"
    pattern="$(jq -r '.tool_input.pattern // ""' <<<"$input")"
    [[ -z "$p" ]] && block "$tool needs an explicit path inside demo/app/ (for example path: demo/app)."
    [[ "$tool" == "Glob" && "$pattern" == *".."* ]] && block "Glob patterns may not contain '..'."
    in_scope "$p" || block "$p is out of scope. Only demo/app/ and your memory folder can be read."
    ;;

  Edit|Write|MultiEdit|NotebookEdit)
    p="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // ""' <<<"$input")"
    in_scope "$p" || block "$p is out of scope. Only files under demo/app/ (and your memory folder) can be changed."
    ;;

  Bash)
    cmd="$(jq -r '.tool_input.command // ""' <<<"$input")"
    # No chaining, pipes, redirects, subshells or variable expansion.
    if [[ "$cmd" =~ [\;\&\|\`\$\<\>] ]] || [[ "$cmd" == *$'\n'* ]]; then
      block "no chaining, pipes, redirects or substitutions. Run one plain command."
    fi
    if [[ "$cmd" =~ ^node\ --check\ [A-Za-z0-9_./-]*demo/app/[A-Za-z0-9_./-]+\.js$ ]] && [[ "$cmd" != *".."* ]]; then
      exit 0
    fi
    # --output would let git diff write a file anywhere.
    if [[ "$cmd" =~ ^git\ (diff|status)(\ [A-Za-z0-9_./=-]+)*$ ]] && [[ "$cmd" != *"--output"* ]]; then
      exit 0
    fi
    if [[ "$cmd" =~ ^ls(\ [A-Za-z0-9_./-]+)*$ ]] && [[ "$cmd" != *".."* ]]; then
      exit 0
    fi
    block "'$cmd' is not allowed. Allowed: node --check demo/app/<file>.js, git diff, git status, ls. Installing, running the server and network access are off limits."
    ;;
esac

exit 0
