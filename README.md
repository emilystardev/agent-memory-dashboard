# Agent Memory Dashboard

A webapp dashboard for visualizing OpenClaw agent semantic memory, inference analytics, session logs, and coordination patterns.

## Stack
- Next.js 16 + TypeScript + Tailwind v4
- GitHub Pages (static export)
- pnpm

## Data Sources
- OpenClaw semantic memory SQLite stores (`~/.openclaw/memory/*.sqlite`)
- Gateway logs (`/tmp/openclaw/*.log`)
- GitHub Actions workflow runs (via GitHub API)
- Agent session transcripts

## Architecture
GitHub Actions runs on schedule, reads local agent memory/logs, exports static JSON data files, deploys to GitHub Pages.

## Dashboards
- **Memory Explorer** — browse and search indexed agent memories by agent/topic
- **Inference Analytics** — token usage, cost estimates, model distribution per agent
- **Session Timeline** — chronological view of all agent sessions and actions
- **Coordination Graph** — visualize which agents interact, claim issues, open PRs
- **Sprint Board** — live view of SPRINT.md + GitHub issues/PRs status
