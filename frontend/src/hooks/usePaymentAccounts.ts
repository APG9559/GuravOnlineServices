import { useState, useMemo, useCallback, useEffect } from 'react';
import { PAYMENT_ACCOUNTS_BY_MODE, PaymentMode } from '@/types';

export interface UsePaymentAccountsProps {
  initialMode?: string;
  initialAccount?: string;
}

export function usePaymentAccounts(props?: UsePaymentAccountsProps) {
  const [paymentMode, setPaymentMode] = useState(props?.initialMode || '');
  const [selectedAccount, setSelectedAccount] = useState(props?.initialAccount || '');
  const [customAccount, setCustomAccount] = useState('');

  // Determine if the initial account or current selected account is "Other" or not in predefined list
  const isOtherSelected = useMemo(() => {
    if (selectedAccount === 'Other') return true;
    if (!paymentMode) return false;
    const allowedAccounts = PAYMENT_ACCOUNTS_BY_MODE[paymentMode as PaymentMode] || [];
    // If we have a payment mode and selected account, but it's not in the list (e.g. legacy or typed other value)
    if (selectedAccount && !allowedAccounts.includes(selectedAccount)) {
      return true;
    }
    return false;
  }, [paymentMode, selectedAccount]);

  // When mode changes, reset account selection
  const handleModeChange = useCallback((mode: string) => {
    setPaymentMode(mode);
    setSelectedAccount('');
    setCustomAccount('');
  }, []);

  // Compute account options based on selected mode
  const accountOptions = useMemo(() => {
    if (!paymentMode) return [];
    const accounts = PAYMENT_ACCOUNTS_BY_MODE[paymentMode as PaymentMode] || [];
    return accounts.map((a) => ({ value: a, label: a }));
  }, [paymentMode]);

  // The final account string that gets submitted
  const resolvedAccount = useMemo(() => {
    if (isOtherSelected) {
      return customAccount.trim();
    }
    return selectedAccount;
  }, [isOtherSelected, customAccount, selectedAccount]);

  // If a custom value is loaded from props or isOtherSelected is true, initialize custom account
  useEffect(() => {
    if (props?.initialAccount && paymentMode) {
      const allowedAccounts = PAYMENT_ACCOUNTS_BY_MODE[paymentMode as PaymentMode] || [];
      if (!allowedAccounts.includes(props.initialAccount) || props.initialAccount === 'Other') {
        setSelectedAccount('Other');
        setCustomAccount(props.initialAccount === 'Other' ? '' : props.initialAccount);
      } else {
        setSelectedAccount(props.initialAccount);
      }
    }
  }, [props?.initialAccount, paymentMode]);

  const reset = useCallback(() => {
    setPaymentMode('');
    setSelectedAccount('');
    setCustomAccount('');
  }, []);

  return {
    paymentMode,
    setPaymentMode: handleModeChange,
    selectedAccount,
    setSelectedAccount,
    customAccount,
    setCustomAccount,
    isOtherSelected,
    accountOptions,
    resolvedAccount,
    reset,
  };
}
