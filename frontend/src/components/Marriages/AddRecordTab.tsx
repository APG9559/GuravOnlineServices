import { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marriagesApi, settingsApi } from '@/api';
import { MarriageTicket, Marriage, MarriageAct, ProofEntry } from '@/types';
import { getTicketAffidavitPurposes, getTicketBreakdown, getEntryAmount } from './helpers';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';

// Subcomponents & Hooks
import { useOfficialFee } from './hooks/useOfficialFee';
import { useAffidavitLinker } from './hooks/useAffidavitLinker';
import CustomerSection from './components/CustomerSection';
import MarriageDetailsSection from './components/MarriageDetailsSection';
import ServicesSection from './components/ServicesSection';
import AffidavitListSection from './components/AffidavitListSection';
import AffidavitMismatchModal from './components/AffidavitMismatchModal';

interface RecordFormValues {
  contactName: string;
  phone: string;
  contactEmail?: string;
  address?: string;
  isPrimaryContactSpouse?: boolean;
  primaryContactSpouseType?: 'husband' | 'wife' | null;
  spouse1Name: string;
  spouse2Name: string;
  marriageAct: MarriageAct;
  marriageDate: string;
  marriagePlace: string;
  appointmentDate?: string;
  affidavitDates?: Record<string, string>;
  dateOfService: string;
  servicesProvided: string[];
  affidavitIds: string[];
  amountCharged: number;
  officialFee?: number;
  courtFeeTickets?: number;
  miscFee?: number;
  consultancyFee?: number;
  ticketId?: string;
  applicationNo?: string;
}

interface AddRecordTabProps {
  prefillTicket: MarriageTicket | null;
  prefillMode?: 'save_ticket' | 'complete_record';
  onClearPrefill: () => void;
  onSaveSuccess: (record: Marriage) => void;
  onSaveTicketSuccess?: (ticket: MarriageTicket) => void;
  pricing: Record<string, number>;
  servicesDef: { key: string; cost: number }[];
}

const getQuestionnaireEntryForPurpose = (q: any, purpose: string) => {
  if (!q) return null;
  switch (purpose) {
    case 'Husband - Birth Date Proof Correction': return q.husband?.birthDateProof;
    case 'Husband - Residence Proof Correction': return q.husband?.residenceProof;
    case 'Husband - Identity Proof Correction': return q.husband?.identityProof;
    case 'Wife - Birth Date Proof Correction': return q.wife?.birthDateProof;
    case 'Wife - Residence Proof Correction': return q.wife?.residenceProof;
    case 'Wife - Identity Proof Correction': return q.wife?.identityProof;
    case 'Wedding Invitation Affidavit': return q.weddingInvitation;
    case 'Subsequent Marriage Affidavit': return q.firstMarriage;
    case 'Intercaste Marriage Affidavit': return q.intercasteMarriage;
    case 'Not Registered Anywhere Else Affidavit': return q.notRegisteredAnywhereElse;
    default: return null;
  }
};

export default function AddRecordTab({
  prefillTicket,
  prefillMode = 'complete_record',
  onClearPrefill,
  onSaveSuccess,
  onSaveTicketSuccess,
  pricing,
  servicesDef,
}: AddRecordTabProps) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [mismatches, setMismatches] = useState<{ purpose: string; ticketAmount: number; actualAmount: number }[]>([]);

  const [affidavitsPaidSeparately, setAffidavitsPaidSeparately] = useState(() => {
    return pricing.marriage_affidavits_paid_separately !== 0;
  });

  useEffect(() => {
    if (pricing.marriage_affidavits_paid_separately !== undefined) {
      setAffidavitsPaidSeparately(pricing.marriage_affidavits_paid_separately !== 0);
    }
  }, [pricing.marriage_affidavits_paid_separately]);

  const methods = useForm<RecordFormValues>({
    defaultValues: {
      dateOfService: today,
      servicesProvided: ['Misc (Form - Xerox Copies)'],
      miscFee: pricing.marriage_misc_fee ?? 0,
      consultancyFee: pricing.marriage_consultancy_fee ?? 500,
      affidavitIds: [],
      affidavitDates: {},
      isPrimaryContactSpouse: true,
      primaryContactSpouseType: 'husband',
      applicationNo: '',
    },
  });

  const { register, handleSubmit, watch, setValue, reset } = methods;

  const requiredAffidavitPurposes = prefillTicket ? getTicketAffidavitPurposes(prefillTicket) : [];
  const isAffidavitDateRequired = requiredAffidavitPurposes.length > 0;
  const isTicketOnlyUpdate = prefillMode === 'save_ticket';

  const watchMiscFee = watch('miscFee') ?? 0;
  const watchConsultancyFee = watch('consultancyFee') ?? pricing.marriage_consultancy_fee ?? 500;
  const amountChargedWatch = watch('amountCharged');
  const phoneWatch = watch('phone');
  const watchIsPrimaryContactSpouse = watch('isPrimaryContactSpouse') ?? true;
  const watchContactName = watch('contactName');
  const watchSpouse1Name = watch('spouse1Name');
  const watchSpouse2Name = watch('spouse2Name');
  const watchPrimaryContactSpouseType = watch('primaryContactSpouseType');
  const watchMarriageDate = watch('marriageDate');
  const watchAppointmentDate = watch('appointmentDate');
  const watchDateOfService = watch('dateOfService');

  // Hook for Affidavit Linker state
  const linker = useAffidavitLinker({
    setValue,
    phoneWatch,
    watchContactName,
    spouse1NameWatch: watchSpouse1Name,
    spouse2NameWatch: watchSpouse2Name,
  });

  const {
    selectedAffidavits,
    linkedAffs,
    activeSearchPurpose,
    affSearch,
    showAffDropdown,
    dropdownRef,
    affidavitsResults,
    selectAffidavit,
    unlinkAffidavit,
    linkRequiredAffidavit,
    unlinkRequiredAffidavit,
    startSearch,
    setAffSearch,
    setShowAffDropdown,
    cancelSearch,
    resetLinker,
  } = linker;

  const hasAllAffidavitDates =
    !isAffidavitDateRequired ||
    affidavitsPaidSeparately ||
    requiredAffidavitPurposes.every((p) => !!linkedAffs[p]);

  const estimatedAffidavitTotal = useMemo(() => {
    if (!prefillTicket || !prefillTicket.questionnaireData) return 0;
    const q = prefillTicket.questionnaireData;
    let affTotal = 0;
    if (q) {
      const getAmt = (entry: Parameters<typeof getEntryAmount>[0]) => getEntryAmount(entry, pricing);
      if (q.husband) {
        affTotal += getAmt(q.husband.birthDateProof);
        affTotal += getAmt(q.husband.residenceProof);
        affTotal += getAmt(q.husband.identityProof);
      }
      if (q.wife) {
        affTotal += getAmt(q.wife.birthDateProof);
        affTotal += getAmt(q.wife.residenceProof);
        affTotal += getAmt(q.wife.identityProof);
      }
      affTotal += getAmt(q.weddingInvitation);
      affTotal += getAmt(q.firstMarriage);
      affTotal += getAmt(q.intercasteMarriage);
      affTotal += getAmt(q.notRegisteredAnywhereElse);
    }
    return affTotal;
  }, [prefillTicket, pricing]);

  const [includeOfficialFee, setIncludeOfficialFee] = useState(true);
  const [includeCourtFeeTickets, setIncludeCourtFeeTickets] = useState(false);

  // Hook for official fee calculations
  const officialFeeAmount = useOfficialFee({
    marriageDate: watchMarriageDate,
    appointmentDate: watchAppointmentDate,
    dateOfService: watchDateOfService,
    today,
    pricing,
  });

  // Pre-fill from ticket
  useEffect(() => {
    if (prefillTicket) {
      setValue('contactName', prefillTicket.contactName);
      setValue('phone', prefillTicket.phone);
      if (prefillTicket.contactEmail) setValue('contactEmail', prefillTicket.contactEmail);
      if (prefillTicket.address) setValue('address', prefillTicket.address);
      setValue('isPrimaryContactSpouse', prefillTicket.isPrimaryContactSpouse ?? true);
      setValue('primaryContactSpouseType', prefillTicket.primaryContactSpouseType ?? 'husband');

      const ticketSvcs = prefillTicket.servicesProvided || [];
      const includeConsultancy = prefillTicket.questionnaireData?.consultancyFee?.included;
      let finalSvcs =
        includeConsultancy &&
        !ticketSvcs.includes('Marriage Consultancy Fee') &&
        !ticketSvcs.includes('Marriage Registration Consultancy Fee')
          ? [...ticketSvcs, 'Marriage Registration Consultancy Fee']
          : ticketSvcs;

      if (!finalSvcs.includes('Misc (Form - Xerox Copies)')) {
        finalSvcs = [...finalSvcs, 'Misc (Form - Xerox Copies)'];
      }

      setValue('servicesProvided', finalSvcs);
      setValue(
        'miscFee',
        prefillTicket.questionnaireData?.miscFee?.amountCharged ?? pricing.marriage_misc_fee ?? 0,
      );
      setValue(
        'consultancyFee',
        prefillTicket.questionnaireData?.consultancyFee?.amountCharged ??
          pricing.marriage_consultancy_fee ??
          500,
      );
      setValue('ticketId', prefillTicket.id);
      setValue('dateOfService', today);

      setValue('spouse1Name', prefillTicket.questionnaireData?.spouse1Name || '');
      setValue('spouse2Name', prefillTicket.questionnaireData?.spouse2Name || '');
      setValue(
        'marriageAct',
        (prefillTicket.questionnaireData?.marriageAct as MarriageAct) || ('' as unknown as MarriageAct),
      );
      setValue('marriageDate', prefillTicket.questionnaireData?.marriageDate || '');
      setValue('marriagePlace', prefillTicket.questionnaireData?.marriagePlace || '');
      setValue('appointmentDate', prefillTicket.questionnaireData?.appointmentDate || '');
      setValue('affidavitDates', prefillTicket.questionnaireData?.affidavitDates || {});
      setValue('applicationNo', prefillTicket.questionnaireData?.applicationNo || '');

      if (prefillTicket.questionnaireData?.affidavitsPaidSeparately !== undefined) {
        setAffidavitsPaidSeparately(prefillTicket.questionnaireData.affidavitsPaidSeparately);
      } else if (pricing.marriage_affidavits_paid_separately !== undefined) {
        setAffidavitsPaidSeparately(pricing.marriage_affidavits_paid_separately !== 0);
      }
    }
  }, [prefillTicket, setValue, today, pricing]);

  // Sync amountCharged based on affidavitsPaidSeparately toggle
  useEffect(() => {
    if (prefillTicket) {
      const baseVal = Number(prefillTicket.amountCharged);
      const netVal = baseVal - (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0);
      if (Number(amountChargedWatch) !== netVal) {
        setValue('amountCharged', netVal);
      }
    }
  }, [prefillTicket, affidavitsPaidSeparately, estimatedAffidavitTotal, setValue, amountChargedWatch]);

  // Sync contact details to spouse name dynamically if primary contact is one of the spouses
  useEffect(() => {
    if (watchIsPrimaryContactSpouse) {
      if (watchPrimaryContactSpouseType === 'husband') {
        setValue('spouse1Name', watchContactName || '');
      } else if (watchPrimaryContactSpouseType === 'wife') {
        setValue('spouse2Name', watchContactName || '');
      }
    }
  }, [watchIsPrimaryContactSpouse, watchPrimaryContactSpouseType, watchContactName, setValue]);

  // Customer auto-fill
  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(
    prefillTicket ? '' : phoneWatch,
    (customer) => {
      setValue('contactName', customer.name);
      if (customer.email) setValue('contactEmail', customer.email);
      if (customer.address) setValue('address', customer.address);
    },
  );

  // Sync amountCharged when services or affidavits change (only for non-ticket forms)
  useEffect(() => {
    if (prefillTicket) return;
    let total = 0;
    const svcs = watch('servicesProvided') || [];
    if (svcs.includes('Online form filling')) total += pricing.online_form;
    if (svcs.includes('Offline form filling')) total += pricing.offline_form;
    if (svcs.includes('Document true copy')) total += pricing.true_copy;
    if (svcs.includes('Misc (Form - Xerox Copies)')) total += Number(watchMiscFee) || 0;
    if (
      svcs.includes('Marriage Consultancy Fee') ||
      svcs.includes('Marriage Registration Consultancy Fee')
    )
      total += Number(watchConsultancyFee) || 0;
    if (includeOfficialFee) total += officialFeeAmount;
    if (includeCourtFeeTickets) total += pricing.marriage_court_fee_tickets ?? 110;
    if (Number(amountChargedWatch) !== total) {
      setValue('amountCharged', total);
    }
  }, [
    watch,
    watchMiscFee,
    watchConsultancyFee,
    pricing,
    setValue,
    prefillTicket,
    includeOfficialFee,
    officialFeeAmount,
    includeCourtFeeTickets,
    amountChargedWatch,
  ]);

  // When amountCharged changes → adjust consultancyFee
  useEffect(() => {
    if (prefillTicket) return;
    if (amountChargedWatch === undefined) return;
    const svcs = watch('servicesProvided') || [];
    const servicesTotal =
      (svcs.includes('Online form filling') ? (pricing.online_form || 0) : 0) +
      (svcs.includes('Offline form filling') ? (pricing.offline_form || 0) : 0) +
      (svcs.includes('Document true copy') ? (pricing.true_copy || 0) : 0) +
      (svcs.includes('Misc (Form - Xerox Copies)') ? (Number(watchMiscFee) || 0) : 0);
    const otherFees =
      servicesTotal +
      (includeOfficialFee ? (officialFeeAmount || 0) : 0) +
      (includeCourtFeeTickets ? (pricing.marriage_court_fee_tickets ?? 110) : 0);
    const calcTotal = otherFees + Number(watchConsultancyFee || 0);
    if (Number(amountChargedWatch) !== calcTotal) {
      setValue('consultancyFee', Math.max(0, Number(amountChargedWatch) - otherFees));
    }
  }, [
    amountChargedWatch,
    prefillTicket,
    watch,
    pricing,
    includeOfficialFee,
    officialFeeAmount,
    includeCourtFeeTickets,
    watchMiscFee,
    watchConsultancyFee,
    setValue,
  ]);

  const saveMutation = useMutation({
    mutationFn: (data: RecordFormValues) => marriagesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['marriages'] });
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSaveSuccess(data);
      resetIndicator();
      reset({
        contactName: '',
        phone: '',
        contactEmail: '',
        address: '',
        isPrimaryContactSpouse: true,
        primaryContactSpouseType: 'husband',
        spouse1Name: '',
        spouse2Name: '',
        marriageAct: '' as unknown as MarriageAct,
        marriageDate: '',
        marriagePlace: '',
        appointmentDate: '',
        affidavitDates: {},
        dateOfService: today,
        servicesProvided: [],
        affidavitIds: [],
        amountCharged: 0,
        miscFee: pricing.marriage_misc_fee ?? 0,
        consultancyFee: pricing.marriage_consultancy_fee ?? 500,
        ticketId: '',
        applicationNo: '',
      });
      resetLinker();
      setAffidavitsPaidSeparately(true);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: (payload: { id: string; data: unknown }) =>
      marriagesApi.updateTicket(payload.id, payload.data).then((r) => r.data),
    onSuccess: (updatedTicket: MarriageTicket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      if (prefillTicket) {
        qc.invalidateQueries({ queryKey: ['marriage-ticket', prefillTicket.id] });
      }
      resetIndicator();
      reset({
        contactName: '',
        phone: '',
        contactEmail: '',
        address: '',
        isPrimaryContactSpouse: true,
        primaryContactSpouseType: 'husband',
        spouse1Name: '',
        spouse2Name: '',
        marriageAct: '' as unknown as MarriageAct,
        marriageDate: '',
        marriagePlace: '',
        appointmentDate: '',
        affidavitDates: {},
        dateOfService: today,
        servicesProvided: [],
        affidavitIds: [],
        amountCharged: 0,
        miscFee: pricing.marriage_misc_fee ?? 0,
        consultancyFee: pricing.marriage_consultancy_fee ?? 500,
        ticketId: '',
        applicationNo: '',
      });
      resetLinker();
      setAffidavitsPaidSeparately(true);
      onClearPrefill();
      if (onSaveTicketSuccess) {
        onSaveTicketSuccess(updatedTicket);
      }
    },
  });

  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <div style={{ fontWeight: 500, marginBottom: '1rem' }}>
        {prefillTicket
          ? isTicketOnlyUpdate
            ? `Save Ticket State — ${prefillTicket.ticketNumber}`
            : `Complete Record — ${prefillTicket.ticketNumber}`
          : 'New marriage registration record'}
      </div>

      {saveMutation.isError && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          Failed to save. Please try again.
        </div>
      )}

      {/* Ticket price breakdown (read-only) */}
      {prefillTicket && (
        <div className="price-box" style={{ marginBottom: 16 }}>
          <div
            style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}
          >
            Estimation breakdown (from ticket)
          </div>
          {(() => {
            const AFFIDAVIT_LABELS = [
              'Husband - Birth Date Proof',
              'Husband - Residence Proof',
              'Husband - Identity Proof',
              'Wife - Birth Date Proof',
              'Wife - Residence Proof',
              'Wife - Identity Proof',
              'Wedding Invitation',
              'First Marriage',
              'Intercaste Marriage',
              'Not Registered Anywhere Else',
            ];

            return getTicketBreakdown(prefillTicket, pricing, servicesDef).map((item, i) => {
              const isAff = AFFIDAVIT_LABELS.some((prefix) => item.label.startsWith(prefix));
              const displayAmt = isAff && affidavitsPaidSeparately ? 0 : item.amount;

              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div className="price-row" style={{ marginBottom: 0 }}>
                    <span>{item.label}</span>
                    <span>
                      {isAff && affidavitsPaidSeparately ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
                          Paid separately
                        </span>
                      ) : (
                        `₹${displayAmt.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                  {item.remark && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--danger)',
                        marginTop: 2,
                        paddingLeft: 8,
                        fontWeight: 500,
                      }}
                    >
                      ↳ Remark: {item.remark}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Toggle checkbox for separate affidavit billing */}
          {estimatedAffidavitTotal > 0 && (
            <div
              className="checkbox-row"
              style={{
                margin: '12px 0',
                padding: '8px 0',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                id="f-affidavits-paid-separately"
                checked={affidavitsPaidSeparately}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAffidavitsPaidSeparately(checked);
                  settingsApi
                    .updateMany({ marriage_affidavits_paid_separately: checked ? 1 : 0 })
                    .then(() => {
                      qc.invalidateQueries({ queryKey: ['pricing-map'] });
                    })
                    .catch((err) => {
                      // eslint-disable-next-line no-console
                      console.error('Failed to save checkbox preference to DB', err);
                    });

                  if (prefillTicket) {
                    marriagesApi
                      .updateTicket(prefillTicket.id, {
                        questionnaireData: {
                          ...prefillTicket.questionnaireData,
                          affidavitsPaidSeparately: checked,
                        },
                      })
                      .then(() => {
                        qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
                      })
                      .catch((err) => {
                        // eslint-disable-next-line no-console
                        console.error('Failed to save ticket preference to DB', err);
                      });
                  }
                }}
                style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
              />
              <label
                htmlFor="f-affidavits-paid-separately"
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                Affidavits executed & paid separately (excludes ₹{estimatedAffidavitTotal} from this
                ticket)
              </label>
            </div>
          )}

          <div
            className="price-total"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}
          >
            <span className="price-total-label">
              {affidavitsPaidSeparately ? 'Marriage Ticket amount' : 'Ticket amount'}
            </span>
            <span className="price-total-value">
              ₹
              {(
                Number(prefillTicket.amountCharged) -
                (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0)
              ).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Payment summary & list */}
          {(() => {
            const payments = prefillTicket.payments || [];
            const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const amountCharged =
              Number(prefillTicket.amountCharged) -
              (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0);
            const balance = amountCharged - totalPaid;

            return (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <div
                  style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}
                >
                  Payments & Balance
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '12px',
                    background: 'var(--bg)',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                    <span style={{ fontWeight: 600, color: 'var(--success-text, #15803d)' }}>
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Balance: </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: balance <= 0 ? 'var(--success-text, #15803d)' : '#dc2626',
                      }}
                    >
                      ₹{balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {payments.length > 0 && (
                  <div
                    style={{
                      maxHeight: '100px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr
                          style={{
                            background: 'var(--bg)',
                            borderBottom: '1px solid var(--border)',
                            textAlign: 'left',
                          }}
                        >
                          <th style={{ padding: '4px 6px' }}>Date</th>
                          <th style={{ padding: '4px 6px' }}>Amt</th>
                          <th style={{ padding: '4px 6px' }}>Mode/Acc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>
                              {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                            </td>
                            <td style={{ padding: '4px 6px', fontWeight: 600 }}>
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '4px 6px' }}>
                              {p.paymentMode} ({p.account})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit((d) => {
            const isTicketOnlyUpdate = prefillMode === 'save_ticket';

            if (!isTicketOnlyUpdate && requiredAffidavitPurposes.length > 0) {
              const missing = requiredAffidavitPurposes.filter((p) => !linkedAffs[p]);
              if (missing.length > 0) return;
            }

            const officialFee = prefillTicket
              ? prefillTicket.questionnaireData?.officialFee?.included
                ? Number(prefillTicket.questionnaireData?.officialFee?.amountCharged || 0)
                : 0
              : includeOfficialFee
                ? officialFeeAmount
                : 0;

            const courtFeeTickets = prefillTicket
              ? prefillTicket.questionnaireData?.courtFeeTickets?.included
                ? Number(prefillTicket.questionnaireData?.courtFeeTickets?.amountCharged || 0)
                : 0
              : includeCourtFeeTickets
                ? (pricing.marriage_court_fee_tickets ?? 110)
                : 0;

            const miscFee = prefillTicket
              ? prefillTicket.questionnaireData?.miscFee?.included
                ? Number(prefillTicket.questionnaireData?.miscFee?.amountCharged || 0)
                : 0
              : d.servicesProvided?.includes('Misc (Form - Xerox Copies)')
                ? Number(d.miscFee || 0)
                : 0;

            const consultancyFee = prefillTicket
              ? prefillTicket.questionnaireData?.consultancyFee?.included
                ? Number(prefillTicket.questionnaireData?.consultancyFee?.amountCharged || 0)
                : 0
              : d.servicesProvided?.includes('Marriage Registration Consultancy Fee') ||
                  d.servicesProvided?.includes('Marriage Consultancy Fee')
                ? Number(d.consultancyFee || 0)
                : 0;

            if (isTicketOnlyUpdate && prefillTicket) {
              const ticketPayload = {
                contactName: d.contactName,
                phone: d.phone,
                contactEmail: d.contactEmail || undefined,
                address: d.address || undefined,
                isPrimaryContactSpouse: d.isPrimaryContactSpouse,
                primaryContactSpouseType: d.isPrimaryContactSpouse
                  ? d.primaryContactSpouseType
                  : null,
                servicesProvided: d.servicesProvided,
                amountCharged: Number(prefillTicket.amountCharged), // Keep original estimated total!
                questionnaireData: {
                  ...prefillTicket.questionnaireData,
                  spouse1Name: d.spouse1Name,
                  spouse2Name: d.spouse2Name,
                  marriageAct: d.marriageAct,
                  marriageDate: d.marriageDate,
                  marriagePlace: d.marriagePlace,
                  appointmentDate: d.appointmentDate,
                  affidavitDates: d.affidavitDates,
                  applicationNo: d.applicationNo,
                  officialFee: {
                    ...prefillTicket.questionnaireData?.officialFee,
                    amountCharged: officialFee,
                  },
                  courtFeeTickets: {
                    ...prefillTicket.questionnaireData?.courtFeeTickets,
                    amountCharged: courtFeeTickets,
                  },
                  miscFee: {
                    ...prefillTicket.questionnaireData?.miscFee,
                    amountCharged: miscFee,
                  },
                  consultancyFee: {
                    ...prefillTicket.questionnaireData?.consultancyFee,
                    amountCharged: consultancyFee,
                  },
                },
              };
              updateTicketMutation.mutate({ id: prefillTicket.id, data: ticketPayload });
            } else {
              const payload = {
                ...d,
                contactEmail: d.contactEmail || undefined,
                officialFee,
                courtFeeTickets,
                miscFee,
                consultancyFee,
                affidavitIds: prefillTicket
                  ? Object.values(linkedAffs).map((x) => x.id)
                  : selectedAffidavits.map((x) => x.id),
              };

              // Check for cost mismatches if we are completing a ticket
              const foundMismatches: typeof mismatches = [];
              if (prefillTicket && prefillTicket.questionnaireData) {
                requiredAffidavitPurposes.forEach((purpose) => {
                  const linked = linkedAffs[purpose];
                  if (linked) {
                    const entry = getQuestionnaireEntryForPurpose(prefillTicket.questionnaireData, purpose);
                    if (entry) {
                      const ticketAmount = getEntryAmount(entry, pricing);
                      const actualAmount = Number(linked.amountCharged || 0);
                      if (ticketAmount !== actualAmount) {
                        foundMismatches.push({
                          purpose,
                          ticketAmount,
                          actualAmount,
                        });
                      }
                    }
                  }
                });
              }

              if (foundMismatches.length > 0) {
                setMismatches(foundMismatches);
                setPendingPayload(payload);
                setShowMismatchModal(true);
              } else {
                saveMutation.mutate(payload);
              }
            }
          })}
        >
          {/* Customer / Contact details */}
          <CustomerSection showAutoFillIndicator={showAutoFillIndicator} />

          {/* Marriage details */}
          <MarriageDetailsSection today={today} />

          {/* Linked Affidavits list / link inputs */}
          <AffidavitListSection
            prefillTicket={prefillTicket}
            requiredAffidavitPurposes={requiredAffidavitPurposes}
            linkedAffs={linkedAffs}
            activeSearchPurpose={activeSearchPurpose}
            affSearch={affSearch}
            showAffDropdown={showAffDropdown}
            affidavitsResults={affidavitsResults}
            selectedAffidavits={selectedAffidavits}
            dropdownRef={dropdownRef}
            selectAffidavit={selectAffidavit}
            unlinkAffidavit={unlinkAffidavit}
            linkRequiredAffidavit={linkRequiredAffidavit}
            unlinkRequiredAffidavit={unlinkRequiredAffidavit}
            startSearch={startSearch}
            setAffSearch={setAffSearch}
            setShowAffDropdown={setShowAffDropdown}
            cancelSearch={cancelSearch}
          />

          {/* Services selections (only when no prefilled ticket is active) */}
          {!prefillTicket && (
            <ServicesSection
              servicesDef={servicesDef}
              pricing={pricing}
              officialFeeAmount={officialFeeAmount}
              watchMarriageDate={watchMarriageDate}
              includeOfficialFee={includeOfficialFee}
              setIncludeOfficialFee={setIncludeOfficialFee}
              includeCourtFeeTickets={includeCourtFeeTickets}
              setIncludeCourtFeeTickets={setIncludeCourtFeeTickets}
            />
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Amount charged (₹) *</label>
            <input
              type="number"
              {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
              placeholder="Auto-calculated, can edit"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={
                saveMutation.isPending ||
                updateTicketMutation.isPending ||
                (!isTicketOnlyUpdate && !hasAllAffidavitDates)
              }
            >
              {saveMutation.isPending || updateTicketMutation.isPending
                ? 'Saving…'
                : isTicketOnlyUpdate
                  ? 'Save Ticket State'
                  : 'Save record'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                reset({
                  contactName: '',
                  phone: '',
                  contactEmail: '',
                  address: '',
                  isPrimaryContactSpouse: true,
                  primaryContactSpouseType: 'husband',
                  spouse1Name: '',
                  spouse2Name: '',
                  marriageAct: '' as unknown as MarriageAct,
                  marriageDate: '',
                  marriagePlace: '',
                  appointmentDate: '',
                  affidavitDates: {},
                  dateOfService: today,
                  servicesProvided: ['Misc (Form - Xerox Copies)'],
                  affidavitIds: [],
                  amountCharged: 0,
                  miscFee: pricing.marriage_misc_fee ?? 0,
                  consultancyFee: pricing.marriage_consultancy_fee ?? 500,
                  ticketId: '',
                  applicationNo: '',
                });
                resetLinker();
                resetIndicator();
                onClearPrefill();
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </FormProvider>

      {showMismatchModal && (
        <AffidavitMismatchModal
          mismatches={mismatches}
          onClose={() => {
            setShowMismatchModal(false);
            setPendingPayload(null);
          }}
          onConfirm={(updateDb) => {
            setShowMismatchModal(false);
            if (pendingPayload) {
              const updatedPayload = { ...pendingPayload };
              if (!updateDb && !affidavitsPaidSeparately) {
                const totalEstimated = mismatches.reduce((sum, m) => sum + m.ticketAmount, 0);
                const totalActual = mismatches.reduce((sum, m) => sum + m.actualAmount, 0);
                const diff = totalEstimated - totalActual;
                updatedPayload.consultancyFee = Math.max(0, Number(pendingPayload.consultancyFee || 0) + diff);
              }
              saveMutation.mutate({
                ...updatedPayload,
                updateAffidavitAmounts: updateDb,
              });
            }
            setPendingPayload(null);
          }}
          isLoading={saveMutation.isPending}
        />
      )}
    </div>
  );
}
