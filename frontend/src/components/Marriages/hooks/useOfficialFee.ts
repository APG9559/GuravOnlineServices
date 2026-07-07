import { useMemo } from 'react';

interface UseOfficialFeeParams {
  marriageDate: string;
  appointmentDate?: string;
  dateOfService: string;
  today: string;
  pricing: Record<string, number>;
}

export function useOfficialFee({
  marriageDate,
  appointmentDate,
  dateOfService,
  today,
  pricing,
}: UseOfficialFeeParams) {
  return useMemo(() => {
    if (!marriageDate) return 0;
    const endStr = appointmentDate || dateOfService || today;
    const start = new Date(marriageDate);
    const end = new Date(endStr);
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    
    if (months < 0) months = 0;
    
    if (months <= 3) return pricing.marriage_official_fee_upto_3_months ?? 500;
    if (months <= 12) return pricing.marriage_official_fee_3_to_12_months ?? 600;
    return pricing.marriage_official_fee_after_12_months ?? 750;
  }, [marriageDate, appointmentDate, dateOfService, today, pricing]);
}
