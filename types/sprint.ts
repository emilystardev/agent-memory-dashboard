/**
 * GitHub API data types for Sprint Board
 * Used for fetching issues and PRs from GitHub
 */

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: {
    id: number;
    name: string;
    color: string;
    description?: string;
  }[];
  milestone: {
    title: string;
    description: string;
    due_on: string | null;
    closed_at: string | null;
    state: 'open' | 'closed';
  } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  repository: {
    name: string;
    full_name: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: {
    id: number;
    name: string;
    color: string;
    description?: string;
  }[];
  milestone: {
    title: string;
    description: string;
    due_on: string | null;
    closed_at: string | null;
    state: 'open' | 'closed';
  } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  repository: {
    name: string;
    full_name: string;
  };
  draft: boolean;
  requested_reviewers: GitHubUser[];
  reviews: {
    id: number;
    user: GitHubUser;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
    submitted_at: string;
  }[];
}

export interface SprintTask {
  id: string; // Composite: "issue-${number}" or "pr-${number}"
  type: 'issue' | 'pr';
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  assignees: GitHubUser[];
  labels: Array<{ id: number; name: string; color: string; description?: string }>;
  milestone: { title: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  repository: { name: string; full_name: string };
  // PR-specific fields (optional, only present for PRs)
  draft?: boolean;
  requested_reviewers?: GitHubUser[];
  reviews?: Array<{ id: number; user: GitHubUser; state: string; submitted_at: string }>;
  merged_at?: string | null;
  // Computed / helper fields
  hasBlocker?: boolean;
  status: 'backlog' | 'in-progress' | 'in-review' | 'done';
}

// Column definitions for the Kanban board
export const KANBAN_COLUMNS = [
  { id: 'backlog', title: 'Backlog', description: 'To be started' },
  { id: 'in-progress', title: 'In Progress', description: 'Currently being worked on' },
  { id: 'in-review', title: 'In Review', description: 'Awaiting review or QA' },
  { id: 'done', title: 'Done', description: 'Completed' },
] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMNS)[number]['id'];

// Logger map for color coding
export const AGENT_COLORS: Record<string, string> = {
  'backend-engineer': 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'frontend-engineer': 'bg-green-500/20 text-green-700 dark:text-green-300',
  'staff-engineer': 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  'qa-engineer': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'devops-engineer': 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  'data-engineer': 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
};
