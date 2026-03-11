#!/usr/bin/env bash
set -euo pipefail
REPO="emilystardev/agent-memory-dashboard"
WORKDIR="/home/teamlead/agent-memory-dashboard"
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
[[ -z "$TOKEN" ]] && { echo "ERROR: GITHUB_TOKEN not set" >&2; exit 1; }
cd "$WORKDIR"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}" 2>/dev/null
git pull --rebase 2>/dev/null || true
echo "{}" > /tmp/amd-claims.json
SLACK_TOKEN=$(python3 -c "import json; c=json.load(open('${HOME}/.openclaw/openclaw.json')); print(c.get('channels',{}).get('slack',{}).get('botToken',''))" 2>/dev/null || echo "")
SLACK_HISTORY=""
if [[ -n "$SLACK_TOKEN" ]]; then
  curl -sf -H "Authorization: Bearer ${SLACK_TOKEN}" "https://slack.com/api/conversations.history?channel=C0AK23JT7DK&limit=20" > /tmp/amd-slack-history.json 2>/dev/null || echo '{"messages":[]}' > /tmp/amd-slack-history.json
  SLACK_HISTORY=$(python3 -c "import json; d=json.load(open('/tmp/amd-slack-history.json')); print('\n'.join(f'ts={m[\"ts\"]}: {m[\"text\"][:150]}' for m in reversed(d.get('messages',[])[:10])))" 2>/dev/null || echo "")
fi
curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${REPO}/issues?state=open&per_page=20" > /tmp/amd-open-issues.json 2>/dev/null || echo "[]" > /tmp/amd-open-issues.json
curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${REPO}/pulls?state=open&per_page=10" > /tmp/amd-open-prs.json 2>/dev/null || echo "[]" > /tmp/amd-open-prs.json
curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${REPO}/pulls?state=closed&per_page=5&sort=updated" > /tmp/amd-merged-prs.json 2>/dev/null || echo "[]" > /tmp/amd-merged-prs.json
SPRINT_CONTEXT=""; [[ -f "${WORKDIR}/SPRINT.md" ]] && SPRINT_CONTEXT=$(cat "${WORKDIR}/SPRINT.md")
PROMPT="You are the staff engineer for https://github.com/${REPO} — a Next.js + GitHub Pages dashboard visualising agent memory, inference analytics, session logs, sprint coordination.
MCP tools: context7 (Next.js 15/Tailwind v4 docs), github (native ops), memory (store decisions).
Read: /tmp/amd-open-issues.json, /tmp/amd-open-prs.json, /tmp/amd-merged-prs.json. Check: ls ${WORKDIR}/app/ 2>/dev/null
Recent Slack (ts for threading): ${SLACK_HISTORY:-[none]}
Jobs: 1) Review merged/open PRs 2) If PRs need QA: gh pr comment N --body 'Needs QA review' -R ${REPO} 3) If <4 open issues: create 2 new ones 4) Write SPRINT.md and push 5) Reply to blocked/QA threads.
GITHUB_TOKEN=\$GITHUB_TOKEN.
ENTIRE response ONLY:
🏗️ *Staff Engineer* | agent-memory-dashboard Sprint
*Shipped:* links or \"None yet\"
*In Progress:* links or \"None\"
*Backlog:* top issues by priority
*Blockers:* None or list
*Next:* 1 sentence"
SLACK_MSG=$(env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-}" ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-}" claude --dangerously-skip-permissions --model claude-3-5-sonnet-20241022 -p "$PROMPT" < /dev/null 2>/dev/null)
MSG_JSON=$(openclaw message send --channel slack --target C0AK23JT7DK --message "$SLACK_MSG" --json 2>/dev/null || echo "{}")
MSG_TS=$(echo "$MSG_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('payload',{}).get('result',{}).get('messageId','') or '')" 2>/dev/null || echo "")
echo "{\"role\":\"staff-engineer\",\"ts\":\"${MSG_TS}\"}" > /tmp/amd-msg-staff-engineer.json
