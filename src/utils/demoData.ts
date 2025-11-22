/**
 * Demo data utilities for loading sample datasets
 */

import type { UploadedFile } from '../types';
import { extractZipMetadata } from '../features/dataUpload/utils';

export interface DemoDataset {
  id: string;
  name: string;
  filename: string;
  description: string;
}

/**
 * Available demo datasets
 * 
 * Data source attribution:
 * These datasets are derived from real-world Type 1 Diabetes data from the
 * AZT1D dataset (Khamesian et al., 2025), available under CC BY 4.0.
 * DOI: 10.17632/gk9m674wcx.1
 * https://arxiv.org/abs/2506.14789
 * 
 * Each dataset represents an anonymized subject from the AZT1D study,
 * showing authentic day-to-day variability in glucose control, insulin usage,
 * and diabetes management patterns. Subject selections verified against
 * published demographics (Table I).
 */
export const DEMO_DATASETS: DemoDataset[] = [
  {
    id: 'joshua',
    name: 'Joshua (Male, 25-45)',
    filename: 'joshua-demo-data.zip',
    description: 'Active lifestyle, moderate carb intake (Subject 7: Male, 36, A1c 6.8%)',
  },
  {
    id: 'charles',
    name: 'Charles (Male, 45-65)',
    filename: 'charles-demo-data.zip',
    description: 'Regular schedule, balanced diet (Subject 11: Male, 59, A1c 7.3%)',
  },
  {
    id: 'albert',
    name: 'Albert (Male, 65-85)',
    filename: 'albert-demo-data.zip',
    description: 'Retired, consistent routine (Subject 18: Male, 65, A1c 6.9%)',
  },
  {
    id: 'hannah',
    name: 'Hannah (Female, 25-45)',
    filename: 'hannah-demo-data.zip',
    description: 'Active lifestyle, varied schedule (Subject 14: Female, 32, A1c 5.0%)',
  },
  {
    id: 'nancy',
    name: 'Nancy (Female, 45-65)',
    filename: 'nancy-demo-data.zip',
    description: 'Professional, structured meals (Subject 20: Female, 61, A1c 6.7%)',
  },
  {
    id: 'dorothy',
    name: 'Dorothy (Female, 65-85)',
    filename: 'dorothy-demo-data.zip',
    description: 'Retired, regular meal times (Subject 6: Female, 77, A1c 6.6%)',
  },
];

/**
 * Load a demo dataset from the public folder
 * @param dataset - The demo dataset to load
 * @returns Promise resolving to the UploadedFile object
 */
export async function loadDemoDataset(dataset: DemoDataset): Promise<UploadedFile> {
  try {
    const response = await fetch(`/demo-data/${dataset.filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load demo data: ${response.statusText}`);
    }

    const blob = await response.blob();
    const file = new File([blob], dataset.filename, { type: 'application/zip' });

    // Extract metadata from the demo file
    const zipMetadata = await extractZipMetadata(file);

    const uploadedFile: UploadedFile = {
      id: `demo-${dataset.id}-${Date.now()}`,
      name: dataset.filename,
      size: file.size,
      uploadTime: new Date(),
      file: file,
      zipMetadata,
    };

    return uploadedFile;
  } catch (error) {
    console.error(`Failed to load demo dataset ${dataset.name}:`, error);
    throw error;
  }
}

/**
 * Get attribution text for demo data
 */
export function getDemoDataAttribution(): string {
  return `Demo datasets are inspired by real-world Type 1 Diabetes data patterns from the AZT1D dataset (Khamesian et al., 2025), available under CC BY 4.0 license. DOI: 10.17632/gk9m674wcx.1. For more information, see https://arxiv.org/abs/2506.14789`;
}
