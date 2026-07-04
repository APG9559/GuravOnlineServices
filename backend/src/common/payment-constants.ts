export const PAYMENT_MODES = [
  'Cash',
  'UPI',
  'Bank Transfer',
] as const;

export const PAYMENT_ACCOUNTS_BY_MODE = {
  Cash: ['Main Cashbox', 'Ashish Cashbox'],
  UPI: ['Vaishali Gurav', 'Ashish Gurav', 'Other'],
  'Bank Transfer': [
    'Vaishali Gurav Saraswat Bank',
    'Vaishali Gurav Maha. Bank',
    'Ashish Gurav SBI',
    'Ashish Gurav Maha. Bank',
    'Other',
  ],
} as const;

export type PaymentMode = typeof PAYMENT_MODES[number];
export type PaymentAccount = string;

