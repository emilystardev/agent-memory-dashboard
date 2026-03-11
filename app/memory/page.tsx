'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, Tag } from 'lucide-react';
import { MemoryRecord, MemoryFilterState } from '@/types/memory';
import {
  fetchMemoryData,
  filterMemories,
  getUniqueAgents,
  formatTimestamp,
  truncateContent,
} from '@/client/lib/fetch';

const SOURCE_LABELS: Record<string, string> = {
  session: 'Session',
  cron: 'Cron',
  user: 'User',
  tool: 'Tool',
};

const SOURCE_COLORS: Record<string, string> = {
  session: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  cron: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  user: 'bg-green-500/20 text-green-700 dark:text-green-300',
  tool: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
};

export default function MemoryExplorerPage() {
  const [rawData, setRawData] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<MemoryFilterState>({
    searchQuery: '',
    selectedAgents: [],
    selectedSources: [],
  });

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const exportData = await fetchMemoryData();
        if (exportData?.records) {
          setRawData(exportData.records);
        } else {
          setError('No memory data available. Check that GitHub Actions has exported data.');
        }
      } catch (err) {
        setError('Failed to load memory data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute filtered results
  const filteredRecords = useMemo(() => {
    return filterMemories(rawData, filters);
  }, [rawData, filters]);

  // Compute unique agents
  const uniqueAgents = useMemo(() => getUniqueAgents(rawData), [rawData]);

  // Toggle agent filter
  const toggleAgentFilter = (agent: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agent)
        ? prev.selectedAgents.filter((a) => a !== agent)
        : [...prev.selectedAgents, agent],
    }));
  };

  // Toggle source filter
  const toggleSourceFilter = (source: MemoryRecord['source']) => {
    setFilters((prev) => ({
      ...prev,
      selectedSources: prev.selectedSources.includes(source)
        ? prev.selectedSources.filter((s) => s !== source)
        : [...prev.selectedSources, source],
    }));
  };

  // Toggle card expansion
  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading memory data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure GitHub Actions has completed and exported data to /data/memory.json.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memory Explorer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and search agent semantic memories from OpenClaw export
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredRecords.length} of {rawData.length} memories
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search memories by content or tags..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Filter chips */}
        <div className="space-y-3">
          {/* Agent filters */}
          <div>
            <p className="mb-2 text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Agents
            </p>
            <div className="flex flex-wrap gap-2">
              {uniqueAgents.map((agent) => (
                <button
                  key={agent}
                  onClick={() => toggleAgentFilter(agent)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.selectedAgents.includes(agent)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {agent}
                  {filters.selectedAgents.includes(agent) && ' ×'}
                </button>
              ))}
              {uniqueAgents.length === 0 && (
                <span className="text-sm text-muted-foreground">No agents found</span>
              )}
            </div>
          </div>

          {/* Source filters */}
          <div>
            <p className="mb-2 text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {(['session', 'cron', 'user', 'tool'] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSourceFilter(source)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filters.selectedSources.includes(source)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {SOURCE_LABELS[source]}
                  {filters.selectedSources.includes(source) && ' ×'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            {rawData.length === 0
              ? 'No memory records available.'
              : 'No memories match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const isExpanded = expandedCards.has(record.id);
            return (
              <div
                key={record.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="cursor-pointer p-4"
                  onClick={() => toggleCardExpansion(record.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Agent badge and timestamp */}
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">
                          {record.agentRole}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatTimestamp(record.timestamp)}
                        </span>
                      </div>

                      {/* Content preview */}
                      <p className="text-sm leading-relaxed">
                        {truncateContent(record.content, isExpanded ? 500 : 150)}
                      </p>

                      {/* Tags and metadata */}
                      {record.metadata?.tags && record.metadata.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {record.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Source badge */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SOURCE_COLORS[record.source]}`}
                      >
                        {SOURCE_LABELS[record.source]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          {record.id}
                        </code>
                      </div>
                      {record.metadata?.sessionId && (
                        <div>
                          <span className="font-medium">Session:</span>{' '}
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
                            {record.metadata.sessionId}
                          </code>
                        </div>
                      )}
                      {record.metadata?.toolName && (
                        <div>
                          <span className="font-medium">Tool:</span>{' '}
                          <span className="text-muted-foreground">
                            {record.metadata.toolName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
