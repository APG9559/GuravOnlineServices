import { PaperType, AuthorizerType, QuestionnaireData, ProofEntry, MarriageTicket } from '@/types';
import { calcAffidavitTotal } from '@/hooks/usePricing';

export function defaultProof(): ProofEntry {
  return { correct: true };
}

export function defaultQuestionnaire(): QuestionnaireData {
  return {
    husband: { birthDateProof: defaultProof(), residenceProof: defaultProof(), identityProof: defaultProof() },
    wife: { birthDateProof: defaultProof(), residenceProof: defaultProof(), identityProof: defaultProof() },
    weddingInvitation: { available: true, affidavit: 'No' },
    firstMarriage: { yes: true, affidavit: 'No' },
    intercasteMarriage: { yes: false, affidavit: 'No' },
    notRegisteredAnywhereElse: { yes: true, affidavit: 'Yes', paperType: 'stamp500', authorizer: 'magistrate', customerBroughtStamp: false },
    consultancyFee: { included: false, amountCharged: 0 },
    officialFee: { included: false, duration: 'Upto 3 months', amountCharged: 0 },
    courtFeeTickets: { included: false, amountCharged: 0 }
  };
}

export function getEntryAmount(
  entry?: {
    affidavit?: string;
    amountCharged?: number;
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    customerBroughtStamp?: boolean;
  },
  pricing?: Record<string, number>
): number {
  if (!entry || entry.affidavit !== 'Yes') return 0;
  if (entry.amountCharged !== undefined) return entry.amountCharged;
  if (entry.paperType && entry.authorizer && pricing) {
    const res = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing);
    if (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) {
      return res.authFee;
    }
    return res.total;
  }
  return 0;
}

export function calcEstimationTotal(q: QuestionnaireData, services: string[], pricing: Record<string, number>): number {
  let total = 0;

  // Husband
  total += getEntryAmount(q.husband?.birthDateProof, pricing);
  total += getEntryAmount(q.husband?.residenceProof, pricing);
  total += getEntryAmount(q.husband?.identityProof, pricing);

  // Wife
  total += getEntryAmount(q.wife?.birthDateProof, pricing);
  total += getEntryAmount(q.wife?.residenceProof, pricing);
  total += getEntryAmount(q.wife?.identityProof, pricing);

  // Misc
  total += getEntryAmount(q.weddingInvitation, pricing);
  total += getEntryAmount(q.firstMarriage, pricing);
  total += getEntryAmount(q.intercasteMarriage, pricing);
  total += getEntryAmount(q.notRegisteredAnywhereElse, pricing);

  // Consultancy Fee
  if (q.consultancyFee?.included) {
    total += q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);
  }

  // Official Fee
  if (q.officialFee?.included) {
    if (q.officialFee.amountCharged !== undefined && q.officialFee.amountCharged !== null && q.officialFee.amountCharged > 0) {
      total += q.officialFee.amountCharged;
    } else {
      if (q.officialFee.duration === 'Upto 3 months') total += pricing.marriage_official_fee_upto_3_months ?? 500;
      else if (q.officialFee.duration === '3 - 12 months') total += pricing.marriage_official_fee_3_to_12_months ?? 600;
      else if (q.officialFee.duration === 'After 12 months') total += pricing.marriage_official_fee_after_12_months ?? 750;
    }
  }

  // Court Fee Tickets
  if (q.courtFeeTickets?.included) {
    const courtFeeAmt = q.courtFeeTickets?.amountCharged;
    total += (courtFeeAmt !== undefined && courtFeeAmt !== null && courtFeeAmt > 0)
      ? courtFeeAmt
      : (pricing.marriage_court_fee_tickets ?? 110);
  }

  // Services
  if (services.includes('Online form filling')) total += pricing.online_form ?? 0;
  if (services.includes('Offline form filling')) total += pricing.offline_form ?? 0;
  if (services.includes('Document true copy')) total += pricing.true_copy ?? 0;
  if (services.includes('Misc (Form, Xerox Copies)')) {
    total += q.miscFee?.amountCharged !== undefined ? q.miscFee.amountCharged : (pricing.marriage_misc_fee ?? 0);
  }

  return total;
}

export function getTicketAffidavitPurposes(ticket: MarriageTicket): string[] {
  const q = ticket.questionnaireData;
  if (!q) return [];
  const purposes: string[] = [];

  const checkProof = (entry: any, purpose: string) => {
    if (entry && entry.correct === false && entry.affidavit === 'Yes') purposes.push(purpose);
  };

  const checkSituation = (entry: any, triggerOnValue: boolean, purpose: string) => {
    if (!entry || entry.affidavit !== 'Yes') return;
    const currentVal = entry.yes !== undefined ? entry.yes : entry.available;
    if (currentVal === triggerOnValue) purposes.push(purpose);
  };

  if (q.husband) {
    checkProof(q.husband.birthDateProof, 'Husband - Birth Date Proof Correction');
    checkProof(q.husband.residenceProof, 'Husband - Residence Proof Correction');
    checkProof(q.husband.identityProof, 'Husband - Identity Proof Correction');
  }
  if (q.wife) {
    checkProof(q.wife.birthDateProof, 'Wife - Birth Date Proof Correction');
    checkProof(q.wife.residenceProof, 'Wife - Residence Proof Correction');
    checkProof(q.wife.identityProof, 'Wife - Identity Proof Correction');
  }
  checkSituation(q.weddingInvitation, false, 'Wedding Invitation Affidavit');
  checkSituation(q.firstMarriage, false, 'Subsequent Marriage Affidavit');
  checkSituation(q.intercasteMarriage, true, 'Intercaste Marriage Affidavit');
  checkSituation(q.notRegisteredAnywhereElse, true, 'Not Registered Anywhere Else Affidavit');

  return purposes;
}

export function getTicketBreakdown(
  ticket: MarriageTicket,
  pricing: Record<string, number>,
  servicesDef: { key: string; cost: number }[]
) {
  const items: { label: string; amount: number; remark?: string }[] = [];
  const q = ticket.questionnaireData;
  if (!q) {
    (ticket.servicesProvided || []).forEach((svc) => {
      const svcDef = servicesDef.find((s) => s.key === svc);
      if (svcDef) items.push({ label: svc, amount: svcDef.cost });
    });
    return items;
  }
  const addEntry = (label: string, entry?: any) => {
    const amt = getEntryAmount(entry, pricing);
    if (amt > 0) {
      let finalLabel = label;
      if (entry?.customerName?.trim()) {
        finalLabel = `${label} (${entry.customerName.trim()})`;
      }
      items.push({ label: finalLabel, amount: amt, remark: entry?.remark });
    }
  };
  addEntry('Husband - Birth Date Proof', q.husband?.birthDateProof);
  addEntry('Husband - Residence Proof', q.husband?.residenceProof);
  addEntry('Husband - Identity Proof', q.husband?.identityProof);
  addEntry('Wife - Birth Date Proof', q.wife?.birthDateProof);
  addEntry('Wife - Residence Proof', q.wife?.residenceProof);
  addEntry('Wife - Identity Proof', q.wife?.identityProof);
  addEntry('Wedding Invitation', q.weddingInvitation);
  addEntry('First Marriage', q.firstMarriage);
  addEntry('Intercaste Marriage', q.intercasteMarriage);
  addEntry('Not Registered Anywhere Else', q.notRegisteredAnywhereElse);

  const consultancyAmt = q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);
  items.push({ label: 'Marriage Registration Consultancy Fee', amount: consultancyAmt });

  if (q.officialFee?.included) {
    let amt = q.officialFee.amountCharged;
    if (amt === undefined || amt === null || amt === 0) {
      if (q.officialFee.duration === 'Upto 3 months') amt = pricing.marriage_official_fee_upto_3_months ?? 500;
      else if (q.officialFee.duration === '3 - 12 months') amt = pricing.marriage_official_fee_3_to_12_months ?? 600;
      else if (q.officialFee.duration === 'After 12 months') amt = pricing.marriage_official_fee_after_12_months ?? 750;
    }
    items.push({ label: `Official Fee (${q.officialFee.duration})`, amount: amt || 0 });
  }

  if (q.courtFeeTickets?.included) {
    const courtFeeAmt = q.courtFeeTickets?.amountCharged;
    const finalCourtFeeAmt = (courtFeeAmt !== undefined && courtFeeAmt !== null && courtFeeAmt > 0)
      ? courtFeeAmt
      : (pricing.marriage_court_fee_tickets ?? 110);
    items.push({ label: 'Court Fee Tickets', amount: finalCourtFeeAmt });
  }

  const uniqueServices = Array.from(new Set(ticket.servicesProvided || []));
  uniqueServices.forEach((svc) => {
    const svcDef = servicesDef.find((s) => s.key === svc);
    if (svcDef) {
      const isMisc = svc === 'Misc (Form, Xerox Copies)';
      const amount = isMisc && q.miscFee?.amountCharged !== undefined
        ? q.miscFee.amountCharged
        : svcDef.cost;
      items.push({ label: svc, amount });
    }
  });
  return items;
}
