export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer'] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_ACCOUNTS_BY_MODE: Record<PaymentMode, readonly string[]> = {
  Cash: ['Main Cashbox', 'Ashish Cashbox'],
  UPI: [
    'Vaishali Gurav Saraswat Bank',
    'Ashish Gurav SBI',
    'Parshuram Gurav',
    'Gauri Gurav',
    'Other',
  ],
  'Bank Transfer': [
    'Vaishali Gurav Saraswat Bank',
    'Vaishali Gurav Maha. Bank',
    'Ashish Gurav SBI',
    'Ashish Gurav Maha. Bank',
    'Other',
  ],
} as const;

export const ALL_PAYMENT_ACCOUNTS = [
  ...new Set(
    Object.values(PAYMENT_ACCOUNTS_BY_MODE)
      .flat()
      .filter((a) => a !== 'Other'),
  ),
] as string[];
