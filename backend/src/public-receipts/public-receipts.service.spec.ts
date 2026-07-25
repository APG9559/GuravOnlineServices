import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PublicReceiptsService } from './public-receipts.service';
import { Affidavit } from '../affidavits/affidavit.entity';
import { Marriage } from '../marriages/marriage.entity';
import { BirthDeathCertificate } from '../birth-death-certificates/birth-death-certificate.entity';
import { PropertyCard } from '../property-cards/property-card.entity';
import { ShopActLicense } from '../shop-act-licenses/shop-act-license.entity';
import { TradeLicenseRecord } from '../trade-licenses/trade-license-record.entity';
import { PanCardRecord } from '../csc-services/pan-card.entity';
import { PassportRecord } from '../csc-services/passport.entity';
import { Gazette } from '../gazettes/gazette.entity';
import { WaterServiceRecord } from '../water-supply/water-service-record.entity';
import { PropertyTaxRecord } from '../property-tax/property-tax-record.entity';
import { VoterCardRecord } from '../csc-services/voter-card.entity';

describe('PublicReceiptsService', () => {
  let service: PublicReceiptsService;

  const mockAffidavit = { id: 'aff-1', customerName: 'Test' };

  const createMockRepo = (data: any = null) => ({
    findOne: jest.fn().mockResolvedValue(data),
  });

  const affRepo = createMockRepo(mockAffidavit);
  const marRepo = createMockRepo();
  const bdRepo = createMockRepo();
  const pcRepo = createMockRepo();
  const salRepo = createMockRepo();
  const tlRepo = createMockRepo();
  const panRepo = createMockRepo();
  const passportRepo = createMockRepo();
  const gazetteRepo = createMockRepo();
  const wsRepo = createMockRepo();
  const ptRepo = createMockRepo();
  const voterRepo = createMockRepo();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicReceiptsService,
        { provide: getRepositoryToken(Affidavit), useValue: affRepo },
        { provide: getRepositoryToken(Marriage), useValue: marRepo },
        { provide: getRepositoryToken(BirthDeathCertificate), useValue: bdRepo },
        { provide: getRepositoryToken(PropertyCard), useValue: pcRepo },
        { provide: getRepositoryToken(ShopActLicense), useValue: salRepo },
        { provide: getRepositoryToken(TradeLicenseRecord), useValue: tlRepo },
        { provide: getRepositoryToken(PanCardRecord), useValue: panRepo },
        { provide: getRepositoryToken(PassportRecord), useValue: passportRepo },
        { provide: getRepositoryToken(Gazette), useValue: gazetteRepo },
        { provide: getRepositoryToken(WaterServiceRecord), useValue: wsRepo },
        { provide: getRepositoryToken(PropertyTaxRecord), useValue: ptRepo },
        { provide: getRepositoryToken(VoterCardRecord), useValue: voterRepo },
      ],
    }).compile();
    service = module.get<PublicReceiptsService>(PublicReceiptsService);
  });

  describe('getReceipt', () => {
    it('returns affidavit receipt by type and id', async () => {
      const result = await service.getReceipt('affidavit', 'aff-1');
      expect(affRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'aff-1' },
        relations: ['createdBy', 'customer'],
      });
      expect(result.id).toBe('aff-1');
    });

    it('throws NotFoundException for invalid receipt type', async () => {
      await expect(service.getReceipt('unknown', 'id-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when record not found', async () => {
      affRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getReceipt('affidavit', 'bad-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('handles case-insensitive type matching', async () => {
      await service.getReceipt('Affidavit', 'aff-1');
      expect(affRepo.findOne).toHaveBeenCalled();
    });
  });
});
