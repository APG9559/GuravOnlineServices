import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncHandlerRegistry } from './sync-handler.registry';

describe('SyncService', () => {
  let service: SyncService;

  const mockRegistry = {
    hasHandler: jest.fn((t: string) => ['affidavits', 'marriages'].includes(t)),
    exportEntities: jest.fn().mockResolvedValue({
      records: { affidavits: [{ id: 'a1' }], marriages: [{ id: 'm1' }] },
    }),
    previewImport: jest.fn().mockResolvedValue({
      valid: true,
      summary: [{ table: 'affidavits', toInsert: 1, alreadyExist: 0, errors: [] }],
      totalNew: 1,
      totalSkipped: 0,
      totalErrors: 0,
    }),
    importRecords: jest.fn().mockResolvedValue({
      inserted: 1,
      skipped: 0,
      errors: [],
      details: [{ table: 'affidavits', inserted: 1, skipped: 0 }],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: SyncHandlerRegistry, useValue: mockRegistry },
      ],
    }).compile();
    service = module.get<SyncService>(SyncService);
  });

  describe('exportRecords', () => {
    it('exports records for valid table names', async () => {
      const result = await service.exportRecords(['affidavits', 'marriages']);
      expect(result.version).toBe('2');
      expect(result.tables).toEqual(['affidavits', 'marriages']);
      expect(result.records).toBeDefined();
      expect(mockRegistry.exportEntities).toHaveBeenCalled();
    });

    it('filters out invalid table names', async () => {
      const result = await service.exportRecords(['affidavits', 'bogus']);
      expect(result.tables).toEqual(['affidavits']);
    });

    it('throws if no valid tables specified', async () => {
      await expect(service.exportRecords(['bogus']))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('previewImport', () => {
    const validPayload: any = {
      version: '2',
      exportedAt: '2026-07-10',
      tables: ['affidavits'],
      records: { affidavits: [{ id: 'a1' }] },
    };

    it('validates payload and returns preview result', async () => {
      const result = await service.previewImport(validPayload);
      expect(result.valid).toBe(true);
      expect(result.totalNew).toBe(1);
      expect(mockRegistry.previewImport).toHaveBeenCalled();
    });

    it('rejects wrong version', async () => {
      await expect(service.previewImport({ ...validPayload, version: '3' }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects missing records', async () => {
      await expect(service.previewImport({ ...validPayload, records: null }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects empty tables array', async () => {
      await expect(service.previewImport({ ...validPayload, tables: [] }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('importRecords', () => {
    const validPayload: any = {
      version: '2',
      exportedAt: '2026-07-10',
      tables: ['affidavits'],
      records: { affidavits: [{ id: 'a1' }] },
    };

    it('validates and imports records', async () => {
      const result = await service.importRecords(validPayload);
      expect(result.inserted).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockRegistry.importRecords).toHaveBeenCalled();
    });

    it('rejects null payload', async () => {
      await expect(service.importRecords(null as any))
        .rejects.toThrow(BadRequestException);
    });
  });
});
