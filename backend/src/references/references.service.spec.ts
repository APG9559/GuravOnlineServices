import { Test, TestingModule } from '@nestjs/testing';
import { ReferencesService } from './references.service';
import { ReferenceProvider, ReferenceItem } from './interfaces/reference-provider.interface';

describe('ReferencesService', () => {
  let service: ReferencesService;

  const mockProvider1: ReferenceProvider = {
    getReferences: jest.fn().mockResolvedValue([
      {
        serviceType: 'Affidavit',
        applicationNo: 'APP-100',
        customerName: 'Sunil Kumar',
        status: 'Completed',
        applicationDate: '2026-07-10',
        contactPhone: '9876543210',
        contactName: 'Sunil Kumar',
        contactAddress: 'Shivaji Peth, Kolhapur',
        dateOfService: '2026-07-10',
      },
    ] as ReferenceItem[]),
  };

  const mockProvider2: ReferenceProvider = {
    getReferences: jest.fn().mockRejectedValue(new Error('Provider failure')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferencesService,
        {
          provide: 'ReferenceProvider',
          useValue: [mockProvider1, mockProvider2],
        },
      ],
    }).compile();

    service = module.get<ReferencesService>(ReferencesService);
  });

  describe('findAll', () => {
    it('gathers and groups references by normalized phone number while gracefully handling provider errors', async () => {
      const result = await service.findAll({});

      expect(mockProvider1.getReferences).toHaveBeenCalled();
      expect(mockProvider2.getReferences).toHaveBeenCalled();
      expect(result.total).toBe(1);
      expect(result.data[0].phone).toBe('9876543210');
      expect(result.data[0].name).toBe('Sunil Kumar');
    });

    it('filters grouped references by search query', async () => {
      const result = await service.findAll({ search: 'sunil' });

      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Sunil Kumar');
    });

    it('filters out non-matching search queries', async () => {
      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });
});
