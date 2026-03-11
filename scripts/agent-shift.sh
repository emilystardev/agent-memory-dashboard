#!/usr/bin/env bash
set -euo pipefail
ROLE="${1:?Usage: agent-shift.sh ROLE FOCUS}"
FOCUS="${2:?FOCUS required}"
REPO="emilystardev/agent-memory-dashboard"
WORKDIR="/home/teamlead/agent-memory-dashboard"
CLAIMS_FILE="/tmp/amd-claims.json"
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
[[ -z "$TOKEN" ]] && { echo "ERROR: GITHUB_TOKEN not set" >&2; exit 1; }
cd "$WORKDIR"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}" 2>/dev/null
git pull --rebase 2>/dev/null || true
[[ -f "$CLAIMS_FILE" ]] || echo "{}" > "$CLAIMS_FILE"
CLAIMED_ISSUES=$(python3 -c "import json; d=json.load(open('$CLAIMS_FILE')); print(' '.join(str(v) for v in d.values()))" 2>/dev/null || echo "")
SPRINT_CONTEXT=""; [[ -f "${WORKDIR}/SPRINT.md" ]] && SPRINT_CONTEXT=$(cat "${WORKDIR}/SPRINT.md")
curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${REPO}/issues?state=open&per_page=10" > /tmp/amd-issues.json 2>/dev/null || echo "[]" > /tmp/amd-issues.json
PROMPT="You are the ${ROLE} on https://github.com/${REPO}. Focus: ${FOCUS}.
Stack: Next.js 15, TypeScript, Tailwind v4, pnpm, GitHub Pages (static export, basePath='/agent-memory-dashboard').
MCP tools: context7 (ALWAYS use for Next.js 15/Tailwind v4 before writing components), github (native ops), memory (store decisions).
Sprint: ${SPRINT_CONTEXT:-No sprint — start with issue #1 scaffold.}
Claimed (skip): ${CLAIMED_ISSUES:-none}
Issues: /tmp/amd-issues.json — read it, skip claimed, prioritise #1 first.
If unclaimed issue found:
1. Claim: python3 -c \"import json; d=json.load(open('${CLAIMS_FILE}')); d['${ROLE}']=NUMBER; open('${CLAIMS_FILE}','w').write(json.dumps(d))\"
2. gh issue assign NUMBER --assignee emilystardev -R ${REPO}
3. git checkout -b feat/issue-NUMBER-short-name
4. Use context7 to look up accurate APIs before implementing
5. pnpm tsc --noEmit && pnpm lint before committing
6. git commit -m 'feat: description (closes #NUMBER)' && git push -u origin BRANCH
7. gh pr create -R ${REPO} --title 'feat: description' --body 'Closes #NUMBER'
If no unclaimed issues: create 2 new ones.
GITHUB_TOKEN=\$GITHUB_TOKEN.
ENTIRE response ONLY:
[emoji] *[Role]* | agent-memory-dashboard
*Action:* 1 sentence
*PR:* link (omit if none)
*Issues:* link
*Files:* backtick paths (omit if none)
*Status:* ✅ PR open — ready for QA | 🔄 Issues created | ⚠️ Blocked: reason
*For:* 🧪 QA — please review | or 🏗️ Staff — blocked
Emoji: 🏗️ staff | ⚙️ backend | 🎨 frontend | 🚀 devops | 📊 data"
SLACK_MSG=$(env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-}" ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-}" claude --dangerously-skip-permissions --model claude-3-5-sonnet-20241022 -p "$PROMPT" < /dev/null 2>/dev/null)
MSG_JSON=$(openclaw message send --channel slack --target C0AK23JT7DK --message "$SLACK_MSG" --json 2>/dev/null || echo "{}")
MSG_TS=$(echo "$MSG_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('payload',{}).get('result',{}).get('messageId','') or '')" 2>/dev/null || echo "")
echo "{\"role\":\"${ROLE}\",\"ts\":\"${MSG_TS}\"}" > "/tmp/amd-msg-${ROLE//[ \/]/-}.json"
