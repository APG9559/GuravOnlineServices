import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api';
import { PricingMap, DEFAULT_PRICING_MAP } from '@/types';

export function usePricing() {
  const { data, isLoading } = useQuery({
    queryKey: ['pricing-map'],
    queryFn: () => settingsApi.getPricingMap().then((r) => r.data),
    staleTime: 60_000, // re-fetch at most once per minute
    refetchOnWindowFocus: false,
  });

  // Fall back to hardcoded defaults while loading — never blocks the UI
  const pricing: PricingMap = data ?? DEFAULT_PRICING_MAP;

  return { pricing, isLoading };
}

// Pure calculation helpers that take a pricing map as input
export function calcAffidavitTotal(
  paperType: 'stamp500' | 'Plain',
  authorizerType: 'magistrate' | 'Notary',
  pricing: PricingMap,
): { paperCost: number; authFee: number; total: number } {
  const paperCost = paperType === 'stamp500' ? pricing.stamp500_cost : pricing.plain_cost;
  const authFee = authorizerType === 'magistrate' ? pricing.magistrate_fee : pricing.notary_fee;
  return { paperCost, authFee, total: paperCost + authFee };
}

export function calcMarriageTotal(
  services: string[],
  affidavitAmount: number,
  pricing: PricingMap,
): number {
  let total = 0;
  if (services.includes('Online form filling')) total += pricing.online_form;
  if (services.includes('Offline form filling')) total += pricing.offline_form;
  if (services.includes('Document true copy')) total += pricing.true_copy;
  total += affidavitAmount;
  return total;
}

export function calcBirthDeathTotal(
  copies: number,
  pricing: PricingMap,
): { firstCopyFee: number; extraCopyFee: number; extraCopies: number; total: number } {
  const firstCopyFee = pricing.birth_death_first_copy ?? 300;
  const extraCopyFee = pricing.birth_death_extra_copy ?? 50;
  const extraCopies = Math.max(0, copies - 1);
  return {
    firstCopyFee,
    extraCopyFee,
    extraCopies,
    total: firstCopyFee + extraCopies * extraCopyFee,
  };
}
