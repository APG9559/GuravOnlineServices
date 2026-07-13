import { calcAffidavitTotal, calcMarriageTotal, calcBirthDeathTotal } from '../usePricing';
import { DEFAULT_PRICING_MAP } from '@/types';

describe('calcAffidavitTotal', () => {
  it('calculates stamp500 + magistrate', () => {
    const result = calcAffidavitTotal('stamp500', 'magistrate', DEFAULT_PRICING_MAP);
    expect(result.paperCost).toBe(500);
    expect(result.authFee).toBe(850);
    expect(result.total).toBe(1350);
  });

  it('calculates stamp500 + Notary', () => {
    const result = calcAffidavitTotal('stamp500', 'Notary', DEFAULT_PRICING_MAP);
    expect(result.paperCost).toBe(500);
    expect(result.authFee).toBe(1100);
    expect(result.total).toBe(1600);
  });

  it('calculates Plain + magistrate', () => {
    const result = calcAffidavitTotal('Plain', 'magistrate', DEFAULT_PRICING_MAP);
    expect(result.paperCost).toBe(0);
    expect(result.authFee).toBe(850);
    expect(result.total).toBe(850);
  });

  it('calculates Plain + Notary', () => {
    const result = calcAffidavitTotal('Plain', 'Notary', DEFAULT_PRICING_MAP);
    expect(result.paperCost).toBe(0);
    expect(result.authFee).toBe(1100);
    expect(result.total).toBe(1100);
  });
});

describe('calcMarriageTotal', () => {
  it('returns affidavit amount only when no services', () => {
    const total = calcMarriageTotal([], 500, DEFAULT_PRICING_MAP);
    expect(total).toBe(500);
  });

  it('adds online form fee', () => {
    const total = calcMarriageTotal(['Online form filling'], 500, DEFAULT_PRICING_MAP);
    expect(total).toBe(500 + 300);
  });

  it('adds all service fees', () => {
    const total = calcMarriageTotal(
      ['Online form filling', 'Offline form filling', 'Document true copy'],
      500,
      DEFAULT_PRICING_MAP,
    );
    expect(total).toBe(500 + 300 + 300 + 100);
  });
});

describe('calcBirthDeathTotal', () => {
  it('charges first copy fee for 1 copy', () => {
    const result = calcBirthDeathTotal(1, DEFAULT_PRICING_MAP);
    expect(result.firstCopyFee).toBe(300);
    expect(result.extraCopies).toBe(0);
    expect(result.total).toBe(300);
  });

  it('charges extra for additional copies', () => {
    const result = calcBirthDeathTotal(3, DEFAULT_PRICING_MAP);
    expect(result.firstCopyFee).toBe(300);
    expect(result.extraCopyFee).toBe(50);
    expect(result.extraCopies).toBe(2);
    expect(result.total).toBe(300 + 2 * 50);
  });

  it('handles 0 copies gracefully', () => {
    const result = calcBirthDeathTotal(0, DEFAULT_PRICING_MAP);
    expect(result.extraCopies).toBe(0);
    expect(result.total).toBe(300);
  });
});
