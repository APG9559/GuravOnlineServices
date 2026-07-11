export interface SyncPreviewRow {
  table: string;
  toInsert: number;
  alreadyExist: number;
  errors: string[];
}

export interface SyncPreviewResult {
  valid: boolean;
  summary: SyncPreviewRow[];
  totalNew: number;
  totalSkipped: number;
  totalErrors: number;
}

export interface SyncImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
  details: {
    table: string;
    inserted: number;
    skipped: number;
  }[];
}
