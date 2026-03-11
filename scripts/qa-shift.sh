#!/usr/bin/env bash
set -euo pipefail
REPO="emilystardev/agent-memory-dashboard"
WORKDIR="/home/teamlead/agent-memory-dashboard"
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
[[ -z "$TOKEN" ]] && { echo "ERROR: GITHUB_TOKEN not set" >&2; exit 1; }
cd "$WORKDIR"
git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${REPO}" 2>/dev/null
git fetch --all 2>/dev/null || true
WORKER_THREADS=""
for f in /tmp/amd-msg-*.json; do [[ -f "$f" ]] || continue; INFO=$(python3 -c "import json; d=json.load(open('$f')); print(d.get('role','?'), d.get('ts',''))" 2>/dev/null || echo ""); [[ -n "$INFO" ]] && WORKER_THREADS+="  $INFO\n"; done
curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${REPO}/pulls?state=open&per_page=10" > /tmp/amd-prs.json 2>/dev/null || echo "[]" > /tmp/amd-prs.json
PROMPT="You are qa-engineer on https://github.com/${REPO}.
MCP: playwright (E2E smoke test live app after merge), github (native PR ops), context7 (testing patterns).
PRs: /tmp/amd-prs.json — read it.
Worker threads: $(printf '%b' "${WORKER_THREADS:-[none]}")
For each non-draft PR: 1) git worktree add /tmp/amd-review-N BRANCH 2) pnpm install && pnpm tsc --noEmit && pnpm build && pnpm lint 3) gh pr checks N -R ${REPO}
If all pass: gh pr review N --approve && gh pr merge N --squash --delete-branch && reply thread: openclaw message send --channel slack --target C0AK23JT7DK --reply-to TS --message '🧪 QA: ✅ merged #N'
If fails: gh pr review N --request-changes -b 'FINDINGS' && reply thread with findings.
Cleanup: git worktree remove /tmp/amd-review-N --force 2>/dev/null; true
No PRs: git checkout main && git pull && pnpm build
GITHUB_TOKEN=\$GITHUB_TOKEN.
ENTIRE response ONLY:
🧪 *QA Engineer* | agent-memory-dashboard
*Reviewed:* link or \"No PRs — verified main\"
*Build:* ✅/❌ · *Lint:* ✅/⚠️ · *Types:* ✅/❌
*Verdict:* ✅ Approved & merged | 🔄 Changes requested — reason | ✅ Main healthy
*Threads:* replied to [role] or \"No threads\""
SLACK_MSG=$(env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-}" ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-}" claude --dangerously-skip-permissions --model claude-3-5-sonnet-20241022 -p "$PROMPT" < /dev/null 2>/dev/null)
MSG_JSON=$(openclaw message send --channel slack --target C0AK23JT7DK --message "$SLACK_MSG" --json 2>/dev/null || echo "{}")
MSG_TS=$(echo "$MSG_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('payload',{}).get('result',{}).get('messageId','') or '')" 2>/dev/null || echo "")
echo "{\"role\":\"qa-engineer\",\"ts\":\"${MSG_TS}\"}" > /tmp/amd-msg-qa-engineer.json
