#!/usr/bin/env bash
# PreToolUse guard for the ai-news-briefer agent (wired in its front matter).
#
# The agent reads pages from the open web, and a page can contain text that
# tries to steer it. This hook limits where WebFetch may go, so a hostile page
# cannot push the agent toward local files or internal network addresses.
#   exit 0 -> allow    exit 2 -> block, with the reason on stderr for the agent
#
# Only WebFetch is checked here. WebSearch has no URL to inspect.

set -u
input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  echo "ai-news-guard: jq is not installed, so WebFetch is blocked. Install jq." >&2
  exit 2   # fail closed
fi

tool="$(jq -r '.tool_name // ""' <<<"$input")"
[[ "$tool" == "WebFetch" ]] || exit 0

url="$(jq -r '.tool_input.url // ""' <<<"$input")"
block() { echo "Blocked by ai-news-guard: $1" >&2; exit 2; }

[[ "$url" =~ ^https:// ]] || block "only https:// links may be fetched."

rest="${url#https://}"
authority="${rest%%[/?#]*}"

[[ "$authority" == *"@"* ]] && block "links with a username or password in them are not allowed."

[[ "$authority" == \[* ]] && block "IP addresses are not allowed. Use a normal site name."
host="${authority%%:*}"
[[ "$authority" == *:* && "$authority" != *:443 ]] && block "only the default https port is allowed."
[[ -z "$host" ]] && block "no host found in the link."

host_lc="$(tr '[:upper:]' '[:lower:]' <<<"$host")"
[[ "$host_lc" == "localhost" || "$host_lc" == *.localhost ]] && block "localhost is not allowed."
[[ "$host_lc" =~ \.(local|internal|lan|home|corp|intranet)$ ]] && block "internal host names are not allowed."
[[ "$host_lc" =~ ^[0-9.]+$ || "$host_lc" == \[* ]] && block "IP addresses are not allowed. Use a normal site name."
[[ "$host_lc" != *.* ]] && block "single-word host names are not allowed."

exit 0
