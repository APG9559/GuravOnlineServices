import { useState, useEffect } from 'react';
import { customersApi } from '@/api';
import { Customer } from '@/types';

/**
 * Reusable hook that performs a customer lookup by phone number.
 *
 * When the phone value matches a valid mobile pattern,
 * it calls the customers API. If a match is found, `onAutoFill` is
 * invoked with the full Customer details.
 *
 * @param phone        The current phone field value to watch.
 * @param onAutoFill   Callback fired with the Customer profile on a successful lookup.
 * @returns            `showAutoFillIndicator` – whether to display the "auto-filled" hint.
 */
export function useCustomerLookup(
  phone: string | undefined,
  onAutoFill: (customer: Customer) => void,
) {
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    if (phone && /^\+?[0-9]{7,15}$/.test(phone)) {
      customersApi
        .lookup(phone)
        .then((res) => {
          if (res.data) {
            onAutoFill(res.data);
            setShowAutoFillIndicator(true);
            const timer = setTimeout(() => setShowAutoFillIndicator(false), 3000);
            return () => clearTimeout(timer);
          }
        })
        .catch(() => { });
    }
  }, [phone, onAutoFill]);

  const resetIndicator = () => setShowAutoFillIndicator(false);

  return { showAutoFillIndicator, resetIndicator };
}
