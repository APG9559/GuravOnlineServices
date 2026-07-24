import { DEFAULT_PRICING_MAP, MarriageTicket } from '@/types';
import {
  defaultQuestionnaire,
  getEntryAmount,
  calcEstimationTotal,
  getTicketAffidavitPurposes,
  getTicketBreakdown,
} from '../helpers';

describe('Marriage Estimation Helpers', () => {
  describe('getEntryAmount', () => {
    it('returns 0 when entry is undefined or affidavit !== "Yes"', () => {
      expect(getEntryAmount(undefined, DEFAULT_PRICING_MAP)).toBe(0);
      expect(getEntryAmount({ affidavit: 'No' }, DEFAULT_PRICING_MAP)).toBe(0);
    });

    it('returns amountCharged directly when provided', () => {
      const entry = { affidavit: 'Yes', amountCharged: 450 };
      expect(getEntryAmount(entry, DEFAULT_PRICING_MAP)).toBe(450);
    });

    it('calculates total from paperType, authorizer and pricing map when amountCharged is undefined', () => {
      const entry = {
        affidavit: 'Yes',
        paperType: 'stamp500' as const,
        authorizer: 'magistrate' as const,
      };
      // stamp500 (500) + magistrate (850) = 1350
      expect(getEntryAmount(entry, DEFAULT_PRICING_MAP)).toBe(1350);
    });

    it('returns only authFee if customerBroughtStamp is true', () => {
      const entry = {
        affidavit: 'Yes',
        paperType: 'stamp500' as const,
        authorizer: 'magistrate' as const,
        customerBroughtStamp: true,
      };
      // magistrate fee only = 850
      expect(getEntryAmount(entry, DEFAULT_PRICING_MAP)).toBe(850);
    });
  });

  describe('calcEstimationTotal', () => {
    it('calculates total with default questionnaire and selected services', () => {
      const q = defaultQuestionnaire();
      // defaultQuestionnaire has notRegisteredAnywhereElse = { affidavit: 'Yes', paperType: 'stamp500', authorizer: 'magistrate', customerBroughtStamp: false } -> 1350
      // consultancyFee is not included by default
      // officialFee is not included by default
      // courtFeeTickets is not included by default
      const services = ['Online form filling'];
      const total = calcEstimationTotal(q, services, DEFAULT_PRICING_MAP);
      // 1350 + online_form (300) = 1650
      expect(total).toBe(1650);
    });

    it('includes consultancy fee, official fee, court fee tickets, and misc fee when checked', () => {
      const q = defaultQuestionnaire();
      q.consultancyFee = { included: true, amountCharged: 500 };
      q.officialFee = { included: true, duration: 'Upto 3 months', amountCharged: 500 };
      q.courtFeeTickets = { included: true, amountCharged: 110 };
      q.miscFee = { amountCharged: 50 };

      const services = ['Online form filling', 'Misc (Form - Xerox Copies)'];
      const total = calcEstimationTotal(q, services, DEFAULT_PRICING_MAP);

      // Not registered affidavit (1350) + consultancy (500) + official (500) + court fee (110) + online form (300) + miscFee (50) = 2810
      expect(total).toBe(2810);
    });
  });

  describe('getTicketAffidavitPurposes', () => {
    it('extracts affidavit purposes based on questionnaire flags', () => {
      const mockTicket: Partial<MarriageTicket> = {
        questionnaireData: {
          husband: {
            birthDateProof: { correct: false, affidavit: 'Yes' },
            residenceProof: { correct: true },
            identityProof: { correct: true },
          },
          wife: {
            birthDateProof: { correct: true },
            residenceProof: { correct: true },
            identityProof: { correct: true },
          },
          weddingInvitation: { available: false, affidavit: 'Yes' },
          firstMarriage: { yes: true, affidavit: 'No' },
          intercasteMarriage: { yes: true, affidavit: 'Yes' },
          notRegisteredAnywhereElse: { yes: true, affidavit: 'Yes' },
        },
      };

      const purposes = getTicketAffidavitPurposes(mockTicket as MarriageTicket);
      expect(purposes).toContain('Husband - Birth Date Proof Correction');
      expect(purposes).toContain('Wedding Invitation Affidavit');
      expect(purposes).toContain('Intercaste Marriage Affidavit');
      expect(purposes).toContain('Not Registered Anywhere Else Affidavit');
      expect(purposes.length).toBe(4);
    });
  });

  describe('getTicketBreakdown', () => {
    it('returns breakdown items for ticket', () => {
      const mockTicket: Partial<MarriageTicket> = {
        servicesProvided: ['Online form filling'],
        questionnaireData: {
          husband: {
            birthDateProof: {
              correct: false,
              affidavit: 'Yes',
              amountCharged: 500,
              customerName: 'Husband Name',
            },
          },
          consultancyFee: { included: true, amountCharged: 500 },
        },
      };

      const servicesDef = [
        { key: 'Online form filling', cost: 300 },
        { key: 'Offline form filling', cost: 300 },
      ];

      const breakdown = getTicketBreakdown(
        mockTicket as MarriageTicket,
        DEFAULT_PRICING_MAP,
        servicesDef,
      );

      expect(breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Husband - Birth Date Proof (Husband Name)', amount: 500 }),
          expect.objectContaining({ label: 'Marriage Registration Consultancy Fee', amount: 500 }),
          expect.objectContaining({ label: 'Online form filling', amount: 300 }),
        ]),
      );
    });
  });
});
