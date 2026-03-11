'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Calendar, User, AlertCircle } from 'lucide-react';
import { SprintTask, KanbanColumnId, KANBAN_COLUMNS, AGENT_COLORS } from '@/types/sprint';
import { fetchSprintData } from '@/client/lib/github';

function StatusBadge({ status }: { status: SprintTask['status'] }) {
  const styles: Record<string, string> = {
    'backlog': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'in-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  const labels: Record<string, string> = {
    'backlog': 'Backlog',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    'done': 'Done',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TaskCard({ task }: { task: SprintTask }) {
  const [expanded, setExpanded] = useState(false);

  const isIssue = task.type === 'issue';
  const iconColor = isIssue ? 'text-red-500' : 'text-purple-500';

  const assigneeAgent = task.assignees[0]?.login || 'unassigned';
  const agentColor = AGENT_COLORS[assigneeAgent] || 'bg-gray-100 text-gray-800';

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={iconColor}>
            {isIssue ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                <path d="M5.25 3.75A1.75 1.75 0 007 2h2a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H7a1.75 1.75 0 00-1.75 1.75v3.25A1.75 1.75 0 007 10h2a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H7a1.75 1.75 0 00-1.75-1.75V5.25z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 3.5a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-2a.5.5 0 00-1 0v2A1.5 1.5 0 014 11h7a1.5 1.5 0 001.5-1.5v-8a1.5 1.5 0 00-1.5-1.5h-7a1.5 1.5 0 00-1.5 1.5v2a.5.5 0 00-1 0v-2z" />
                <path d="M4.634 8.495a.75.75 0 00-.987-.087.75.75 0 00-.51.047l-.939.535a.75.75 0 00-.535.087l-.501.201a.75.75 0 00-.316-.049l-.196-.165a.75.75 0 00-.25-.057L1 7.614v.315l.21.177.406.339.406.339.406.339a.75.75 0 00.927-.316z" />
              </svg>
            )}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{isIssue ? 'issue' : 'pr'}</span>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <h4 className="font-medium text-sm mb-2 line-clamp-2">
        <a
          href={task.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          {task.title}
        </a>
      </h4>

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        {task.assignees.length > 0 && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${agentColor}`}>
            <User className="w-3 h-3" />
            {task.assignees[0].login}
            {task.assignees.length > 1 && `+${task.assignees.length - 1}`}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.updated_at).toLocaleDateString()}
        </span>
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `#${label.color}20`,
                color: `#${label.color}`,
              }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-xs text-muted-foreground">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      {task.hasBlocker && (
        <div className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-2">
          <AlertCircle className="w-3 h-3" />
          <span>Blocker</span>
        </div>
      )}

      {task.milestone && (
        <div className="text-xs text-muted-foreground mb-2">
          <strong>Milestone:</strong> {task.milestone.title}
        </div>
      )}

      {expanded && task.body && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {task.body.slice(0, 500)}
            {task.body.length > 500 && '...'}
          </p>
          {task.reviews && task.reviews.length > 0 && (
            <div className="mt-2 space-y-1">
              {task.reviews.map((review) => (
                <div key={review.id} className="text-xs flex items-center gap-2">
                  <span className="text-muted-foreground">{review.user.login}:</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    review.state === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    review.state === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {review.state.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Show less' : 'Details'}
        </button>
        <a
          href={task.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {isIssue ? `#${task.number}` : `PR #${task.number}`}
        </a>
      </div>
    </div>
  );
}

export default function SprintBoard() {
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumnId | 'all'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSprintData();
        setTasks(data.tasks);
      } catch (err) {
        console.error('Failed to fetch sprint data:', err);
        setError('Failed to load sprint data. Make sure GitHub Actions has exported data to /data/sprint.json.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    if (selectedColumn === 'all') return tasks;
    return tasks.filter(task => task.status === selectedColumn);
  }, [tasks, selectedColumn]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanColumnId, SprintTask[]> = {
      'backlog': [],
      'in-progress': [],
      'in-review': [],
      'done': [],
    };

    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading sprint data from GitHub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The GitHub API may require authentication or rate limits may be exceeded.
        </p>
      </div>
    );
  }

  const totalCount = tasks.length;
  const backlogCount = tasksByColumn.backlog.length;
  const inProgressCount = tasksByColumn['in-progress'].length;
  const inReviewCount = tasksByColumn['in-review'].length;
  const doneCount = tasksByColumn.done.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Sprint Board</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban view of issues and PRs
            {totalCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Backlog: {backlogCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  In Progress: {inProgressCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  In Review: {inReviewCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Done: {doneCount}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value as KanbanColumnId | 'all')}
            className="rounded-md border border-border bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Columns</option>
            {KANBAN_COLUMNS.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = tasksByColumn[column.id];
          return (
            <div
              key={column.id}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <div className="mb-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider">
                  {column.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {column.description}
                </p>
                <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
