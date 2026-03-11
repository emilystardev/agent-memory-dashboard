/**
 * Memory entry from OpenClaw agent semantic memory export
 * GitHub Actions exports ~/.openclaw/memory/*.sqlite to data/memory.json
 */
export interface MemoryRecord {
  id: string;
  agentRole: string;
  content: string;
  timestamp: string; // ISO 8601
  source: 'session' | 'cron' | 'user' | 'tool';
  metadata?: {
    sessionId?: string;
    toolName?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface MemoryExport {
  version: string;
  exportedAt: string;
  records: MemoryRecord[];
}

export interface MemoryFilterState {
  searchQuery: string;
  selectedAgents: string[];
  selectedSources: MemoryRecord['source'][];
  dateRange?: {
    start: string;
    end: string;
  };
}
