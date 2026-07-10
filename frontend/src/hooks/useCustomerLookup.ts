import { useState, useEffect, useRef } from 'react';
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
  const onAutoFillRef = useRef(onAutoFill);
  const lastFetchedPhoneRef = useRef<string | null>(null);

  // Keep ref up to date with the latest callback
  useEffect(() => {
    onAutoFillRef.current = onAutoFill;
  }, [onAutoFill]);

  useEffect(() => {
    if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
      lastFetchedPhoneRef.current = null;
      return;
    }

    // Skip if we already successfully fetched this phone number
    if (phone === lastFetchedPhoneRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      customersApi
        .lookup(phone)
        .then((res) => {
          if (res.data) {
            lastFetchedPhoneRef.current = phone;
            onAutoFillRef.current(res.data);
            setShowAutoFillIndicator(true);
            const indicatorTimer = setTimeout(() => setShowAutoFillIndicator(false), 3000);
            return () => clearTimeout(indicatorTimer);
          }
        })
        .catch(() => { });
    }, 500);

    return () => clearTimeout(timer);
  }, [phone]);

  const resetIndicator = () => {
    setShowAutoFillIndicator(false);
    lastFetchedPhoneRef.current = null;
  };

  return { showAutoFillIndicator, resetIndicator };
}
