#!/usr/bin/env bash
# PreToolUse guard for the test-writer agent (wired in its front matter).
#   exit 0 -> allow    exit 2 -> block, with the reason on stderr for the agent
#
# What it enforces:
#   - reads only inside demo/textkit/        (the agent cannot see the grader or the bugs)
#   - writes only to demo/textkit/*.test.js  (the agent cannot edit the code it tests)
#   - test code may load only node:test, node:assert and ./textkit.js, and may not call
#     eval, fetch or child_process (best effort: a text check, not a sandbox)
#   - bash only runs the tests, a syntax check, git diff, git status or ls

set -u
input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  echo "test-writer-guard: jq is not installed, so every tool call is blocked. Install jq." >&2
  exit 2   # fail closed
fi

tool="$(jq -r '.tool_name // ""' <<<"$input")"
block() { echo "Blocked by test-writer-guard: $1" >&2; exit 2; }

in_scope()   { [[ "$1" != *".."* && "$1" =~ (^|/)demo/textkit(/|$) ]]; }
is_testfile(){ [[ "$1" != *".."* && "$1" =~ (^|/)demo/textkit/[A-Za-z0-9_-]+\.test\.js$ ]]; }

check_content() {
  local text="$1" mods m
  mods="$(grep -oE "(require\(|from )[[:space:]]*['\"][^'\"]+['\"]" <<<"$text" | sed -E "s/.*['\"]([^'\"]+)['\"]/\1/")"
  while IFS= read -r m; do
    [[ -z "$m" ]] && continue
    case "$m" in
      node:test|node:assert|node:assert/strict|./textkit.js) ;;
      *) block "test files may only load node:test, node:assert and ./textkit.js, not '$m'." ;;
    esac
  done <<<"$mods"
  if grep -qE "child_process|eval\(|new Function|import\(|fetch\(|XMLHttpRequest|process\.(exit|kill|env)" <<<"$text"; then
    block "test files may not use eval, fetch, child_process or process controls."
  fi
}

case "$tool" in
  Read|Grep|Glob)
    p="$(jq -r '.tool_input.file_path // .tool_input.path // ""' <<<"$input")"
    pattern="$(jq -r '.tool_input.pattern // ""' <<<"$input")"
    [[ -z "$p" ]] && block "$tool needs an explicit path inside demo/textkit/."
    [[ "$tool" == "Glob" && "$pattern" == *".."* ]] && block "Glob patterns may not contain '..'."
    in_scope "$p" || block "$p is out of scope. Only demo/textkit/ can be read."
    ;;

  Write|Edit|MultiEdit)
    p="$(jq -r '.tool_input.file_path // ""' <<<"$input")"
    is_testfile "$p" || block "$p cannot be changed. You may only write demo/textkit/<name>.test.js, never the code under test."
    text="$(jq -r '(.tool_input.content // .tool_input.new_string // ([.tool_input.edits[]?.new_string] | join("\n"))) // ""' <<<"$input")"
    check_content "$text"
    ;;

  Bash)
    cmd="$(jq -r '.tool_input.command // ""' <<<"$input")"
    if [[ "$cmd" =~ [\;\&\|\`\$\<\>] ]] || [[ "$cmd" == *$'\n'* ]]; then
      block "no chaining, pipes, redirects or substitutions. Run one plain command."
    fi
    [[ "$cmd" == *".."* ]] && block "no '..' in commands."
    [[ "$cmd" =~ ^node\ --test\ [A-Za-z0-9_./-]*demo/textkit/[A-Za-z0-9_-]+\.test\.js$ ]] && exit 0
    [[ "$cmd" =~ ^node\ --check\ [A-Za-z0-9_./-]*demo/textkit/[A-Za-z0-9_.-]+\.js$ ]] && exit 0
    [[ "$cmd" =~ ^git\ (diff|status)(\ [A-Za-z0-9_./=-]+)*$ && "$cmd" != *"--output"* ]] && exit 0
    [[ "$cmd" =~ ^ls(\ [A-Za-z0-9_./-]+)*$ ]] && exit 0
    block "'$cmd' is not allowed. Allowed: node --test demo/textkit/<name>.test.js, node --check demo/textkit/<file>.js, git diff, git status, ls."
    ;;
esac

exit 0
