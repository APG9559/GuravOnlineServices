export const PAYMENT_MODES = [
  'Cash',
  'UPI - GPay',
  'UPI - PhonePe',
  'Bank Transfer',
] as const;

export const PAYMENT_ACCOUNTS = [
  'Owner GPay',
  'Business GPay',
  'Shop Cash Box',
  'Bank Account',
] as const;

export type PaymentMode = typeof PAYMENT_MODES[number];
export type PaymentAccount = typeof PAYMENT_ACCOUNTS[number];
