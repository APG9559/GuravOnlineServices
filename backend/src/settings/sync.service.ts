import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SyncHandlerRegistry } from './sync-handler.registry';
import {
  ALL_SYNC_TABLES,
  SyncTableName,
  SyncPayloadV2,
  SyncPreviewResult,
  SyncImportResult,
} from './sync-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly registry: SyncHandlerRegistry) {}

  // ── EXPORT ────────────────────────────────────────────────────────────────

  async exportRecords(tableNames: string[]): Promise<SyncPayloadV2> {
    const validTables = tableNames.filter((t) => this.registry.hasHandler(t));
    if (validTables.length === 0) {
      throw new BadRequestException('No valid tables specified for export.');
    }

    this.logger.log(`[Sync Export] Tables: ${validTables.join(', ')}`);

    const { records, m2m } = await this.registry.exportEntities(validTables);

    return {
      version: '2',
      exportedAt: new Date().toISOString(),
      tables: validTables,
      records: records as SyncPayloadV2['records'],
      m2m: m2m.length > 0 ? m2m : undefined,
    };
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────

  async previewImport(payload: SyncPayloadV2): Promise<SyncPreviewResult> {
    this.validatePayload(payload);
    this.logger.log(`[Sync Preview] Tables: ${payload.tables.join(', ')}`);

    return this.registry.previewImport(
      payload.records as unknown as Record<string, any[]>,
      payload.m2m,
    );
  }

  // ── IMPORT ────────────────────────────────────────────────────────────────

  async importRecords(payload: SyncPayloadV2): Promise<SyncImportResult> {
    this.validatePayload(payload);
    this.logger.log(`[Sync Import] Tables: ${payload.tables.join(', ')}`);

    return this.registry.importRecords(
      payload.records as unknown as Record<string, any[]>,
      payload.m2m,
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validatePayload(payload: SyncPayloadV2): void {
    if (!payload) {
      throw new BadRequestException('Invalid sync file: empty payload.');
    }
    if (payload.version !== '2') {
      throw new BadRequestException(
        `Unsupported sync version "${payload.version}". Expected "2".`,
      );
    }
    if (!payload.records || typeof payload.records !== 'object') {
      throw new BadRequestException('Invalid sync file: missing records section.');
    }
    if (!payload.tables || !Array.isArray(payload.tables) || payload.tables.length === 0) {
      throw new BadRequestException('Invalid sync file: no tables specified.');
    }

    const unknownTables = payload.tables.filter((t) => !ALL_SYNC_TABLES.includes(t as any));
    if (unknownTables.length > 0) {
      throw new BadRequestException(`Unknown tables: ${unknownTables.join(', ')}`);
    }
  }
}
