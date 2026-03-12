#!/usr/bin/env tsx

/**
 * Export sprint data from GitHub API to /public/data/sprint.json
 * This script is intended to be run during the GitHub Actions build workflow
 * or locally during `pnpm build`.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { fetchSprintData } from '../client/lib/github';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    const outputDir = join(__dirname, 'public', 'data');
    const outputPath = join(outputDir, 'sprint.json');

    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    console.log('Fetching sprint data from GitHub API...');
    const data = await fetchSprintData(token);

    await writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✓ Exported ${data.tasks.length} tasks to ${outputPath}`);
  } catch (error) {
    console.error('Failed to export sprint data:', error);
    process.exit(1);
  }
}

main();
