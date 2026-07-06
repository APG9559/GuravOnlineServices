import { useState, useEffect } from 'react';
import { customersApi } from '@/api';

/**
 * Reusable hook that performs a customer lookup by phone number.
 *
 * When the phone value matches a valid 10-digit Indian mobile pattern,
 * it calls the customers API. If a match is found, `onAutoFill` is
 * invoked with the customer's name and a brief indicator is shown.
 *
 * @param phone        The current phone field value to watch.
 * @param onAutoFill   Callback fired with the customer name on a successful lookup.
 * @returns            `showAutoFillIndicator` – whether to display the "auto-filled" hint.
 */
export function useCustomerLookup(
  phone: string | undefined,
  onAutoFill: (name: string) => void,
) {
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    if (phone && /^\+?[0-9]{7,15}$/.test(phone)) {
      customersApi
        .lookup(phone)
        .then((res) => {
          if (res.data) {
            onAutoFill(res.data.name);
            setShowAutoFillIndicator(true);
            setTimeout(() => setShowAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const resetIndicator = () => setShowAutoFillIndicator(false);

  return { showAutoFillIndicator, resetIndicator };
}
