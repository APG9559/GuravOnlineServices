import { phoneSchema } from '../validation';

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
