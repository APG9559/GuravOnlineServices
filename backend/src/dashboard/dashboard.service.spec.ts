import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { DASHBOARD_METRICS_PROVIDER, IDashboardMetrics } from '../common/interfaces/service-metrics.interface';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPricingRepo = {
    find: jest.fn().mockResolvedValue([
      { key: 'marriageOfficialFee', value: '500' },
      { key: 'marriageServiceFee', value: '200' },
    ]),
  };

  const mockProvider1: IDashboardMetrics = {
    getDashboardMetrics: jest.fn().mockResolvedValue({
      key: 'marriages',
      label: 'Marriages',
      category: 'KMC',
      count: 10,
      gross: 5000,
      net: 2000,
      daily: [{ date: '2026-07-01', net: 2000 }],
      userBreakdown: [{ userId: 'u1', userName: 'Admin', gross: 5000, net: 2000 }],
    }),
  };

  const mockProvider2: IDashboardMetrics = {
    getDashboardMetrics: jest.fn().mockResolvedValue({
      key: 'waterSupply',
      label: 'Water Supply',
      category: 'KMC',
      count: 5,
      gross: 3000,
      net: 1500,
      daily: [{ date: '2026-07-02', net: 1500 }],
      userBreakdown: [{ userId: 'u1', userName: 'Admin', gross: 3000, net: 1500 }],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(PricingSetting), useValue: mockPricingRepo },
        {
          provide: DASHBOARD_METRICS_PROVIDER,
          useValue: [mockProvider1, mockProvider2],
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getSummary', () => {
    it('aggregates metrics from all registered providers', async () => {
      const summary = await service.getSummary('2026-07-01', '2026-07-31');

      expect(summary.fromDate).toBe('2026-07-01');
      expect(summary.toDate).toBe('2026-07-31');
      expect(summary.totalEarnings).toBe(8000); // 5000 + 3000
      expect(summary.totalNetEarnings).toBe(3500); // 2000 + 1500
      expect(summary.modules.kmc.subServices.marriages).toEqual(
        expect.objectContaining({ count: 10, grossEarnings: 5000, netEarnings: 2000 }),
      );
      expect(summary.modules.kmc.subServices.waterSupply).toEqual(
        expect.objectContaining({ count: 5, grossEarnings: 3000, netEarnings: 1500 }),
      );
    });

    it('defaults from/to date parameters to current month range when omitted', async () => {
      const summary = await service.getSummary();

      expect(summary.fromDate).toBeDefined();
      expect(summary.toDate).toBeDefined();
      expect(mockProvider1.getDashboardMetrics).toHaveBeenCalled();
    });

    it('returns cached results on repeated calls within TTL window', async () => {
      await service.getSummary('2026-07-01', '2026-07-31');
      await service.getSummary('2026-07-01', '2026-07-31');

      // Providers should only be queried once due to caching
      expect(mockProvider1.getDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(mockProvider2.getDashboardMetrics).toHaveBeenCalledTimes(1);
    });
  });
});
