import { Test, TestingModule } from '@nestjs/testing';
import { CustomerHistoryService } from './customer-history.service';
import { CustomersService } from '../customers/customers.service';
import { AffidavitsService } from '../affidavits/affidavits.service';
import { MarriagesService } from '../marriages/marriages.service';
import { BirthDeathCertificatesService } from '../birth-death-certificates/birth-death-certificates.service';
import { PropertyCardsService } from '../property-cards/property-cards.service';
import { ShopActLicensesService } from '../shop-act-licenses/shop-act-licenses.service';
import { TradeLicensesService } from '../trade-licenses/trade-licenses.service';
import { PanCardsService } from '../csc-services/pan-cards.service';
import { PassportsService } from '../csc-services/passports.service';
import { VoterCardsService } from '../csc-services/voter-cards.service';
import { GazettesService } from '../gazettes/gazettes.service';
import { WaterSupplyService } from '../water-supply/water-supply.service';
import { PropertyTaxService } from '../property-tax/property-tax.service';

describe('CustomerHistoryService', () => {
  let service: CustomerHistoryService;

  const mockCustomer = {
    id: 'cust-100',
    name: 'Amit Shinde',
    phone: '9822334455',
  };

  const createMockProvider = (historyItems: any[]) => ({
    getCustomerHistory: jest.fn().mockResolvedValue(historyItems),
  });

  const mockCustomersService = {
    findOne: jest.fn().mockResolvedValue(mockCustomer),
  };

  const mockAffidavitsService = createMockProvider([
    { id: 'aff-1', dateOfService: '2026-07-01', createdAt: '2026-07-01T10:00:00Z', typeName: 'Affidavit' },
  ]);
  const mockMarriagesService = createMockProvider([
    { id: 'mar-1', dateOfService: '2026-07-15', createdAt: '2026-07-15T12:00:00Z', typeName: 'Marriage' },
  ]);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerHistoryService,
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: AffidavitsService, useValue: mockAffidavitsService },
        { provide: MarriagesService, useValue: mockMarriagesService },
        { provide: BirthDeathCertificatesService, useValue: createMockProvider([]) },
        { provide: PropertyCardsService, useValue: createMockProvider([]) },
        { provide: ShopActLicensesService, useValue: createMockProvider([]) },
        { provide: TradeLicensesService, useValue: createMockProvider([]) },
        { provide: PanCardsService, useValue: createMockProvider([]) },
        { provide: PassportsService, useValue: createMockProvider([]) },
        { provide: VoterCardsService, useValue: createMockProvider([]) },
        { provide: GazettesService, useValue: createMockProvider([]) },
        { provide: WaterSupplyService, useValue: createMockProvider([]) },
        { provide: PropertyTaxService, useValue: createMockProvider([]) },
      ],
    }).compile();

    service = module.get<CustomerHistoryService>(CustomerHistoryService);
  });

  describe('getCustomerDetails', () => {
    it('aggregates history from all providers and sorts descending by dateOfService', async () => {
      const result = await service.getCustomerDetails('cust-100');

      expect(mockCustomersService.findOne).toHaveBeenCalledWith('cust-100');
      expect(result.id).toBe('cust-100');
      expect(result.services).toHaveLength(2);
      expect(result.services[0].id).toBe('mar-1'); // 2026-07-15 is newest
      expect(result.services[1].id).toBe('aff-1'); // 2026-07-01
    });
  });
});
