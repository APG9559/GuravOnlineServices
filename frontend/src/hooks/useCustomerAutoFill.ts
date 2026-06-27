import { useState, useEffect } from 'react';
import { customersApi } from '@/api';

interface AutoFillData {
  name: string;
  address?: string;
  email?: string;
}

export function useCustomerAutoFill(
  phone: string,
  onAutoFill: (data: AutoFillData) => void
) {
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    if (phone && /^[6-9]\d{9}$/.test(phone)) {
      customersApi.lookup(phone)
        .then((res) => {
          if (res.data) {
            onAutoFill({
              name: res.data.name,
              address: res.data.address ?? undefined,
              email: res.data.email ?? undefined,
            });
            setShowAutoFillIndicator(true);
            const timer = setTimeout(() => setShowAutoFillIndicator(false), 3000);
            return () => clearTimeout(timer);
          }
        })
        .catch(() => {});
    }
  }, [phone, onAutoFill]);

  return { showAutoFillIndicator };
}
