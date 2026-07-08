import { z } from 'zod';
import { PricingMap } from '@/types';
import { calcAffidavitTotal } from '@/hooks/usePricing';

export const phoneSchema = z
  .string()
  .optional()
  .transform((val) => (val === '' ? undefined : val))
  .refine((val) => {
    if (!val) return true;
    // Allow digits, spaces, dashes, parentheses, and leading plus.
    // Ensure the total number of digits is between 7 and 15 (E.164 international standard limit)
    const digitsOnly = val.replace(/\D/g, '');
    const validChars = /^\+?[\d\s\-()]+$/.test(val);
    return validChars && digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }, {
    message: "Invalid phone number format. Must contain between 7 and 15 digits.",
  });

export const createAffidavitSchema = (pricing: PricingMap) => {
  return z
    .object({
      customerName: z.string().min(1, 'Customer name is required'),
      phone: phoneSchema,
      purpose: z.string().min(1, 'Purpose / type is required'),
      affidavitNo: z.string().optional(),
      paperType: z.enum(['stamp500', 'Plain'] as const, {
        errorMap: () => ({ message: 'Paper type is required' }),
      }),
      authorizerType: z.enum(['magistrate', 'Notary'] as const, {
        errorMap: () => ({ message: 'Authorized by is required' }),
      }),
      authorizerName: z.string().optional(),
      dateOfService: z.string().min(1, 'Date of service is required'),
      amountCharged: z
        .number({ invalid_type_error: 'Amount charged is required' })
        .min(0, 'Amount must be positive'),
      notaryPublicFee: z
        .number()
        .min(0, 'Fee must be positive')
        .optional()
        .nullable(),
      remark: z.string().optional(),
      customerBroughtStamp: z.enum(['Yes', 'No'] as const).optional(),
    })
    .superRefine((data, ctx) => {
      // 1. Stamp check
      if (data.paperType === 'stamp500' && !data.customerBroughtStamp) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customerBroughtStamp'],
          message: 'Stamp preference is required',
        });
      }

      // 2. Notary fee check
      if (data.authorizerType === 'Notary' && (data.notaryPublicFee === undefined || data.notaryPublicFee === null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['notaryPublicFee'],
          message: 'Notary fee is required',
        });
      }

      // 3. Discount remark check
      if (data.paperType && data.authorizerType) {
        const standardCalc = calcAffidavitTotal(data.paperType, data.authorizerType, pricing);
        let standardTotal = standardCalc.total;
        if (data.paperType === 'stamp500' && data.customerBroughtStamp === 'Yes') {
          standardTotal = standardCalc.authFee;
        }

        if (data.amountCharged < standardTotal && (!data.remark || data.remark.trim() === '')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['remark'],
            message: 'Reason for discount (Remark) is required',
          });
        }
      }
    });
};
