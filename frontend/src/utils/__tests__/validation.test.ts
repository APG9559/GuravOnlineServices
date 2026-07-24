import { phoneSchema, createAffidavitSchema } from '../validation';
import { DEFAULT_PRICING_MAP } from '@/types';

describe('phoneSchema', () => {
  it('accepts undefined/empty (optional)', () => {
    const r1 = phoneSchema.safeParse(undefined);
    expect(r1.success).toBe(true);

    const r2 = phoneSchema.safeParse('');
    expect(r2.success).toBe(true);
  });

  it('accepts valid phone numbers', () => {
    const valid = [
      '1234567890',
      '+1 234 567 8900',
      '9876543210',
      '+91-98765-43210',
      '(555) 123-4567',
    ];
    for (const v of valid) {
      expect(phoneSchema.safeParse(v).success).toBe(true);
    }
  });

  it('rejects phone numbers with too few digits', () => {
    const r = phoneSchema.safeParse('123');
    expect(r.success).toBe(false);
  });

  it('rejects phone numbers with too many digits', () => {
    const r = phoneSchema.safeParse('1'.repeat(20));
    expect(r.success).toBe(false);
  });

  it('rejects invalid characters', () => {
    const r = phoneSchema.safeParse('123-abc-7890');
    expect(r.success).toBe(false);
  });
});

describe('createAffidavitSchema', () => {
  const schema = createAffidavitSchema(DEFAULT_PRICING_MAP);

  const validBaseData = {
    customerName: 'John Doe',
    phone: '9876543210',
    purpose: 'Income Proof',
    paperType: 'Plain' as const,
    authorizerType: 'magistrate' as const,
    dateOfService: '2026-07-23',
    amountCharged: 850, // standard Plain + magistrate = 850
  };

  it('validates a complete valid affidavit form', () => {
    const result = schema.safeParse(validBaseData);
    expect(result.success).toBe(true);
  });

  it('rejects missing customerName or purpose', () => {
    const r1 = schema.safeParse({ ...validBaseData, customerName: '' });
    expect(r1.success).toBe(false);

    const r2 = schema.safeParse({ ...validBaseData, purpose: '' });
    expect(r2.success).toBe(false);
  });

  it('requires customerBroughtStamp when paperType is stamp500', () => {
    const invalidData = {
      ...validBaseData,
      paperType: 'stamp500' as const,
      amountCharged: 1350,
    };
    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('customerBroughtStamp'))).toBe(true);
    }
  });

  it('requires notaryPublicFee when authorizerType is Notary', () => {
    const invalidData = {
      ...validBaseData,
      authorizerType: 'Notary' as const,
      amountCharged: 1100,
    };
    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('notaryPublicFee'))).toBe(true);
    }
  });

  it('requires remark (discount reason) if amountCharged is less than standard total', () => {
    const discountedDataWithoutRemark = {
      ...validBaseData,
      amountCharged: 500, // less than standard 850
    };
    const r1 = schema.safeParse(discountedDataWithoutRemark);
    expect(r1.success).toBe(false);

    const discountedDataWithRemark = {
      ...validBaseData,
      amountCharged: 500,
      remark: 'Special family discount',
    };
    const r2 = schema.safeParse(discountedDataWithRemark);
    expect(r2.success).toBe(true);
  });
});
