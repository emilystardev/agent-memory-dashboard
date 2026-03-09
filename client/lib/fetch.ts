import { MemoryExport, MemoryRecord } from '@/types/memory';

/**
 * Fetch memory data from the static export
 * In production, this will read from /data/memory.json
 */
export async function fetchMemoryData(): Promise<MemoryExport | null> {
  try {
    const response = await fetch('/data/memory.json');
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('No memory export found at /data/memory.json');
        return null;
      }
      throw new Error(`Failed to fetch memory data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching memory data:', error);
    return null;
  }
}

/**
 * Filter memories based on criteria
 */
export function filterMemories(
  records: MemoryRecord[],
  filters: {
    searchQuery?: string;
    selectedAgents?: string[];
    selectedSources?: MemoryRecord['source'][];
  }
): MemoryRecord[] {
  return records.filter((record) => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesContent = record.content.toLowerCase().includes(query);
      const matchesMetadata = record.metadata?.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );
      if (!matchesContent && !matchesMetadata) return false;
    }

    // Agent filter
    if (filters.selectedAgents?.length && !filters.selectedAgents.includes(record.agentRole)) {
      return false;
    }

    // Source filter
    if (filters.selectedSources?.length && !filters.selectedSources.includes(record.source)) {
      return false;
    }

    return true;
  });
}

/**
 * Get unique agent roles from memory records
 */
export function getUniqueAgents(records: MemoryRecord[]): string[] {
  const agents = new Set<string>();
  for (const record of records) {
    agents.add(record.agentRole);
  }
  return Array.from(agents).sort();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate content to max length
 */
export function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}
