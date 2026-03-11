/**
 * GitHub API client utilities
 * Used both at build time (Node) and client-side (if needed)
 */

import { GitHubIssue, GitHubPullRequest, GitHubUser, SprintTask } from '@/types/sprint';

const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = 'emilystardev';
const REPO_NAME = 'agent-memory-dashboard';

export async function fetchGitHub(
  endpoint: string,
  token?: string
): Promise<any> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error.message || ''}`);
  }

  return response.json();
}

/**
 * Fetch all issues with pagination
 */
export async function fetchAllIssues(token?: string): Promise<GitHubIssue[]> {
  const allIssues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const data = await fetchGitHub(
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
      token
    );

    if (data.length === 0) break;
    allIssues.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return allIssues;
}

/**
 * Fetch all pull requests with pagination
 */
export async function fetchAllPullRequests(token?: string): Promise<GitHubPullRequest[]> {
  const allPRs: GitHubPullRequest[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const data = await fetchGitHub(
      `/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=all&per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
      token
    );

    if (data.length === 0) break;
    allPRs.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return allPRs;
}

/**
 * Fetch reviews for a specific PR
 */
export async function fetchPRReviews(
  prNumber: number,
  token?: string
): Promise<Array<{ id: number; user: GitHubUser; state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED'; submitted_at: string }>> {
  const data = await fetchGitHub(
    `/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/reviews`,
    token
  );
  return data as Array<{ id: number; user: GitHubUser; state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED'; submitted_at: string }>;
}

/**
 * Transform GitHub issue to SprintTask
 */
export function transformIssueToTask(issue: GitHubIssue): SprintTask {
  // Infer status from labels or body
  const status = inferTaskStatus(issue);
  const hasBlocker = detectBlocker(issue);

  return {
    id: `issue-${issue.number}`,
    type: 'issue',
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    html_url: issue.html_url,
    assignees: issue.assignees,
    labels: issue.labels,
    milestone: issue.milestone ? { title: issue.milestone.title } : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    closed_at: issue.closed_at,
    repository: issue.repository,
    status,
    hasBlocker,
  };
}

/**
 * Transform GitHub PR to SprintTask
 */
export async function transformPRToTask(
  pr: GitHubPullRequest,
  token?: string
): Promise<SprintTask> {
  // Fetch reviews for this PR (for review status)
  let reviews = pr.reviews;
  if (!reviews || reviews.length === 0) {
    try {
      reviews = await fetchPRReviews(pr.number, token);
    } catch {
      reviews = [];
    }
  }

  const status = inferPRStatus(pr, reviews);
  const hasBlocker = detectBlocker(pr);

  return {
    id: `pr-${pr.number}`,
    type: 'pr',
    number: pr.number,
    title: pr.title,
    body: pr.body,
    state: pr.state,
    html_url: pr.html_url,
    assignees: pr.assignees,
    labels: pr.labels,
    milestone: pr.milestone ? { title: pr.milestone.title } : null,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    closed_at: pr.closed_at,
    merged_at: pr.merged_at,
    repository: pr.repository,
    draft: pr.draft,
    requested_reviewers: pr.requested_reviewers,
    reviews: reviews,
    status,
    hasBlocker,
  };
}

/**
 * Infer task status from issue data
 */
function inferTaskStatus(issue: GitHubIssue): SprintTask['status'] {
  // Check labels first
  const labelNames = issue.labels.map(l => l.name.toLowerCase());
  if (labelNames.includes('done') || labelNames.includes('completed')) return 'done';
  if (labelNames.includes('in-progress') || labelNames.includes('in progress')) return 'in-progress';
  if (labelNames.includes('in-review') || labelNames.includes('review')) return 'in-review';

  // Check body for status markers
  if (issue.body) {
    const body = issue.body.toLowerCase();
    if (body.includes('status: done') || body.includes('status: completed')) return 'done';
    if (body.includes('status: in-progress') || body.includes('status: in progress')) return 'in-progress';
    if (body.includes('status: in-review') || body.includes('status: review')) return 'in-review';
  }

  // Default based on state
  if (issue.state === 'closed') return 'done';
  return 'backlog';
}

type Review = {
  id: number;
  user: GitHubUser;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
  submitted_at: string;
};

/**
 * Infer PR status from PR data and reviews
 */
function inferPRStatus(
  pr: GitHubPullRequest,
  reviews: Review[]
): SprintTask['status'] {
  // Draft PRs are considered in-progress
  if (pr.draft) return 'in-progress';

  // Check for any changes-requested reviews
  const hasChangesRequested = reviews.some(r => r.state === 'CHANGES_REQUESTED');
  if (hasChangesRequested) return 'in-review';

  // Check for approved reviews that haven't been merged yet
  const hasApproved = reviews.some(r => r.state === 'APPROVED');
  if (hasApproved && pr.state === 'open') return 'in-review';

  // If merged, it's done
  if (pr.merged_at) return 'done';

  // If closed without merge, also done (but differentiate?)
  if (pr.state === 'closed') return 'done';

  // Default: in-progress
  return 'in-progress';
}

/**
 * Detect if task has blocker indicators
 */
function detectBlocker(item: GitHubIssue | GitHubPullRequest): boolean {
  const labelNames = item.labels.map(l => l.name.toLowerCase());
  if (labelNames.includes('blocker') || labelNames.includes('blocked')) return true;

  if (item.body) {
    const body = item.body.toLowerCase();
    if (body.includes('blocker:') || body.includes('blocked:') || body.includes('blocked by')) return true;
  }

  return false;
}

/**
 * Fetch and combine all sprint data
 */
export async function fetchSprintData(token?: string): Promise<{ tasks: SprintTask[]; exportedAt: string }> {
  const [issues, prs] = await Promise.all([
    fetchAllIssues(token),
    fetchAllPullRequests(token),
  ]);

  // Transform issues to tasks
  const issueTasks: SprintTask[] = issues.map(transformIssueToTask);

  // Transform PRs (with async review fetch)
  const prTasks: SprintTask[] = await Promise.all(
    prs.map(pr => transformPRToTask(pr, token))
  );

  // Combine and sort by updated date (most recent first)
  const allTasks = [...issueTasks, ...prTasks].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return {
    tasks: allTasks,
    exportedAt: new Date().toISOString(),
  };
}
