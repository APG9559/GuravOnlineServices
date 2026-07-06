import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marriagesApi, customersApi, affidavitsApi, settingsApi } from '@/api';
import { MarriageTicket, Marriage, MarriageAct, Affidavit, PaperType, AuthorizerType, PAPER_LABELS, AUTH_LABELS } from '@/types';
import { getTicketAffidavitPurposes, getTicketBreakdown, getEntryAmount } from './helpers';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [selectedAffidavits, setSelectedAffidavits] = useState<Affidavit[]>([]);
  const [linkedAffs, setLinkedAffs] = useState<Record<string, Affidavit>>({});
  const [activeSearchPurpose, setActiveSearchPurpose] = useState<string | null>(null);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);
  const [affidavitsPaidSeparately, setAffidavitsPaidSeparately] = useState(() => {
    return pricing.marriage_affidavits_paid_separately !== 0;
  });

  useEffect(() => {
    if (pricing.marriage_affidavits_paid_separately !== undefined) {
      setAffidavitsPaidSeparately(pricing.marriage_affidavits_paid_separately !== 0);
    }
  }, [pricing.marriage_affidavits_paid_separately]);

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<RecordFormValues>({
    defaultValues: { dateOfService: today, servicesProvided: ['Misc (Form, Xerox Copies)'], miscFee: pricing.marriage_misc_fee ?? 0, consultancyFee: pricing.marriage_consultancy_fee ?? 500, affidavitIds: [], affidavitDates: {}, isPrimaryContactSpouse: true, primaryContactSpouseType: 'husband', applicationNo: '' },
  });

  const requiredAffidavitPurposes = prefillTicket ? getTicketAffidavitPurposes(prefillTicket) : [];
  const isAffidavitDateRequired = requiredAffidavitPurposes.length > 0;
  const hasAllAffidavitDates = !isAffidavitDateRequired || requiredAffidavitPurposes.every(p => !!linkedAffs[p]);
  const isTicketOnlyUpdate = prefillMode === 'save_ticket';

  const estimatedAffidavitTotal = useMemo(() => {
    if (!prefillTicket || !prefillTicket.questionnaireData) return 0;
    const q = prefillTicket.questionnaireData;
    let affTotal = 0;
    if (q) {
      const getAmt = (entry: any) => getEntryAmount(entry, pricing);
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

  const watchSvcs = watch('servicesProvided') || [];
  const watchMiscFee = watch('miscFee') ?? 0;
  const watchConsultancyFee = watch('consultancyFee') ?? (pricing.marriage_consultancy_fee ?? 500);
  const phoneWatch = watch('phone');
  const watchIsPrimaryContactSpouse = watch('isPrimaryContactSpouse') ?? true;
  const watchContactName = watch('contactName');
  const watchPrimaryContactSpouseType = watch('primaryContactSpouseType');
  const watchMarriageDate = watch('marriageDate');
  const watchAppointmentDate = watch('appointmentDate');
  const watchDateOfService = watch('dateOfService');

  const [includeOfficialFee, setIncludeOfficialFee] = useState(true);
  const [includeCourtFeeTickets, setIncludeCourtFeeTickets] = useState(false);

  const officialFeeAmount = useMemo(() => {
    if (!watchMarriageDate) return 0;
    const endStr = watchAppointmentDate || watchDateOfService || today;
    const start = new Date(watchMarriageDate);
    const end = new Date(endStr);
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    
    // Add extra month if end date day is >= start date day? A rough month diff is usually enough.
    if (months < 0) months = 0;
    
    if (months <= 3) return pricing.marriage_official_fee_upto_3_months ?? 500;
    if (months <= 12) return pricing.marriage_official_fee_3_to_12_months ?? 600;
    return pricing.marriage_official_fee_after_12_months ?? 750;
  }, [watchMarriageDate, watchAppointmentDate, watchDateOfService, today, pricing]);

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
      let finalSvcs = includeConsultancy && !ticketSvcs.includes('Marriage Consultancy Fee') && !ticketSvcs.includes('Marriage Registration Consultancy Fee')
        ? [...ticketSvcs, 'Marriage Registration Consultancy Fee']
        : ticketSvcs;

      if (!finalSvcs.includes('Misc (Form, Xerox Copies)')) {
        finalSvcs = [...finalSvcs, 'Misc (Form, Xerox Copies)'];
      }

      setValue('servicesProvided', finalSvcs);
      setValue('miscFee', prefillTicket.questionnaireData?.miscFee?.amountCharged ?? pricing.marriage_misc_fee ?? 0);
      setValue('consultancyFee', prefillTicket.questionnaireData?.consultancyFee?.amountCharged ?? pricing.marriage_consultancy_fee ?? 500);
      setValue('ticketId', prefillTicket.id);
      setValue('dateOfService', today);

      setValue('spouse1Name', prefillTicket.questionnaireData?.spouse1Name || '');
      setValue('spouse2Name', prefillTicket.questionnaireData?.spouse2Name || '');
      setValue('marriageAct', (prefillTicket.questionnaireData?.marriageAct as MarriageAct) || '' as any);
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
      setValue('amountCharged', netVal);
    }
  }, [prefillTicket, affidavitsPaidSeparately, estimatedAffidavitTotal, setValue]);

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
  useEffect(() => {
    if (prefillTicket) return; // Don't override ticket prefill
    if (phoneWatch && /^\+?[0-9]{7,15}$/.test(phoneWatch)) {
      customersApi.lookup(phoneWatch)
        .then((res) => {
          if (res.data) {
            setValue('contactName', res.data.name);
            if (res.data.email) setValue('contactEmail', res.data.email);
            if (res.data.address) setValue('address', res.data.address);
            setShowAutoFillIndicator(true);
            setTimeout(() => setShowAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => { });
    }
  }, [phoneWatch, setValue, prefillTicket]);

  // Fetch affidavits for search dropdown
  const { data: affidavitResults = [] } = useQuery({
    queryKey: ['affidavits-search', affSearch],
    queryFn: () => affidavitsApi.getAll(affSearch ? { search: affSearch } : {}).then((r) => r.data),
    enabled: affSearch.length >= 1,
    staleTime: 30_000,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalAffAmount = selectedAffidavits.reduce((sum, aff) => sum + Number(aff.amountCharged), 0);

  // Sync amountCharged when services or affidavits change (only for non-ticket forms)
  useEffect(() => {
    if (prefillTicket) return;
    let total = 0;
    const svcs = watchSvcs;
    if (svcs.includes('Online form filling')) total += pricing.online_form;
    if (svcs.includes('Offline form filling')) total += pricing.offline_form;
    if (svcs.includes('Document true copy')) total += pricing.true_copy;
    if (svcs.includes('Misc (Form, Xerox Copies)')) total += Number(watchMiscFee) || 0;
    if (svcs.includes('Marriage Consultancy Fee') || svcs.includes('Marriage Registration Consultancy Fee')) total += Number(watchConsultancyFee) || 0;
    if (includeOfficialFee) total += officialFeeAmount;
    if (includeCourtFeeTickets) total += pricing.marriage_court_fee_tickets ?? 110;
    // Marriage doesn't add affidavit amount charged
    setValue('amountCharged', total);
  }, [watchSvcs, watchMiscFee, watchConsultancyFee, pricing, setValue, prefillTicket, includeOfficialFee, officialFeeAmount, includeCourtFeeTickets]);

  const selectAffidavit = (aff: Affidavit) => {
    if (selectedAffidavits.some((x) => x.id === aff.id)) {
      setAffSearch('');
      setShowAffDropdown(false);
      return;
    }
    const updated = [...selectedAffidavits, aff];
    setSelectedAffidavits(updated);
    setValue('affidavitIds', updated.map((x) => x.id));
    setAffSearch('');
    setShowAffDropdown(false);
  };

  const unlinkAffidavit = (id: string) => {
    const updated = selectedAffidavits.filter((x) => x.id !== id);
    setSelectedAffidavits(updated);
    setValue('affidavitIds', updated.map((x) => x.id));
  };

  const saveMutation = useMutation({
    mutationFn: (data: RecordFormValues) => marriagesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['marriages'] });
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSaveSuccess(data);
      reset({
        contactName: '',
        phone: '',
        contactEmail: '',
        address: '',
        isPrimaryContactSpouse: true,
        primaryContactSpouseType: 'husband',
        spouse1Name: '',
        spouse2Name: '',
        marriageAct: '' as any,
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
      setSelectedAffidavits([]);
      setLinkedAffs({});
      setActiveSearchPurpose(null);
      setAffidavitsPaidSeparately(true);
      setAffSearch('');
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => marriagesApi.updateTicket(payload.id, payload.data).then((r) => r.data),
    onSuccess: (updatedTicket: MarriageTicket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      if (prefillTicket) {
        qc.invalidateQueries({ queryKey: ['marriage-ticket', prefillTicket.id] });
      }
      reset({
        contactName: '',
        phone: '',
        contactEmail: '',
        address: '',
        isPrimaryContactSpouse: true,
        primaryContactSpouseType: 'husband',
        spouse1Name: '',
        spouse2Name: '',
        marriageAct: '' as any,
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
      setSelectedAffidavits([]);
      setLinkedAffs({});
      setActiveSearchPurpose(null);
      setAffidavitsPaidSeparately(true);
      setAffSearch('');
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
          ? (isTicketOnlyUpdate
              ? `Save Ticket State — ${prefillTicket.ticketNumber}`
              : `Complete Record — ${prefillTicket.ticketNumber}`)
          : 'New marriage registration record'}
      </div>

      {saveMutation.isError && <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>}

      {/* Ticket price breakdown (read-only) */}
      {prefillTicket && (
        <div className="price-box" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>Estimation breakdown (from ticket)</div>
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
              'Not Registered Anywhere Else'
            ];

            return getTicketBreakdown(prefillTicket, pricing, servicesDef).map((item, i) => {
              const isAff = AFFIDAVIT_LABELS.some(prefix => item.label.startsWith(prefix));
              const displayAmt = isAff && affidavitsPaidSeparately ? 0 : item.amount;

              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div className="price-row" style={{ marginBottom: 0 }}>
                    <span>{item.label}</span>
                    <span>
                      {isAff && affidavitsPaidSeparately ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>Paid separately</span>
                      ) : (
                        `₹${displayAmt.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                  {item.remark && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                      ↳ Remark: {item.remark}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Toggle checkbox for separate affidavit billing */}
          {estimatedAffidavitTotal > 0 && (
            <div className="checkbox-row" style={{ margin: '12px 0', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="f-affidavits-paid-separately"
                checked={affidavitsPaidSeparately}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAffidavitsPaidSeparately(checked);
                  settingsApi.updateMany({ marriage_affidavits_paid_separately: checked ? 1 : 0 })
                    .then(() => {
                      qc.invalidateQueries({ queryKey: ['pricing-map'] });
                    })
                    .catch((err) => {
                      console.error('Failed to save checkbox preference to DB', err);
                    });

                  if (prefillTicket) {
                    marriagesApi.updateTicket(prefillTicket.id, {
                      questionnaireData: {
                        ...prefillTicket.questionnaireData,
                        affidavitsPaidSeparately: checked,
                      },
                    })
                      .then(() => {
                        qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
                      })
                      .catch((err) => {
                        console.error('Failed to save ticket preference to DB', err);
                      });
                  }
                }}
                style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
              />
              <label htmlFor="f-affidavits-paid-separately" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                Affidavits executed & paid separately (excludes ₹{estimatedAffidavitTotal} from this ticket)
              </label>
            </div>
          )}

          <div className="price-total" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <span className="price-total-label">
              {affidavitsPaidSeparately ? 'Marriage Ticket amount' : 'Ticket amount'}
            </span>
            <span className="price-total-value">
              ₹{(Number(prefillTicket.amountCharged) - (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0)).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Payment summary & list */}
          {(() => {
            const payments = prefillTicket.payments || [];
            const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const amountCharged = Number(prefillTicket.amountCharged) - (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0);
            const balance = amountCharged - totalPaid;

            return (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--text)' }}>Payments & Balance</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', background: 'var(--bg)', padding: '8px', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                    <span style={{ fontWeight: 600, color: 'var(--success-text, #15803d)' }}>₹{totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Balance: </span>
                    <span style={{ fontWeight: 700, color: balance <= 0 ? 'var(--success-text, #15803d)' : '#dc2626' }}>
                      ₹{balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {payments.length > 0 && (
                  <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '4px 6px' }}>Date</th>
                          <th style={{ padding: '4px 6px' }}>Amt</th>
                          <th style={{ padding: '4px 6px' }}>Mode/Acc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '4px 6px', fontWeight: 600 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '4px 6px' }}>{p.paymentMode} ({p.account})</td>
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

      <form onSubmit={handleSubmit((d) => {
        const isTicketOnlyUpdate = prefillMode === 'save_ticket';

        if (!isTicketOnlyUpdate && requiredAffidavitPurposes.length > 0) {
          const missing = requiredAffidavitPurposes.filter(p => !linkedAffs[p]);
          if (missing.length > 0) return;
        }

        const officialFee = prefillTicket
          ? (prefillTicket.questionnaireData?.officialFee?.included
              ? Number(prefillTicket.questionnaireData?.officialFee?.amountCharged || 0)
              : 0)
          : (includeOfficialFee ? officialFeeAmount : 0);

        const courtFeeTickets = prefillTicket
          ? (prefillTicket.questionnaireData?.courtFeeTickets?.included
              ? Number(prefillTicket.questionnaireData?.courtFeeTickets?.amountCharged || 0)
              : 0)
          : (includeCourtFeeTickets ? (pricing.marriage_court_fee_tickets ?? 110) : 0);

        const miscFee = prefillTicket
          ? (prefillTicket.questionnaireData?.miscFee?.included
              ? Number(prefillTicket.questionnaireData?.miscFee?.amountCharged || 0)
              : 0)
          : (d.servicesProvided?.includes('Misc (Form, Xerox Copies)') ? Number(d.miscFee || 0) : 0);

        const consultancyFee = prefillTicket
          ? (prefillTicket.questionnaireData?.consultancyFee?.included
              ? Number(prefillTicket.questionnaireData?.consultancyFee?.amountCharged || 0)
              : 0)
          : (d.servicesProvided?.includes('Marriage Registration Consultancy Fee') || d.servicesProvided?.includes('Marriage Consultancy Fee')
              ? Number(d.consultancyFee || 0)
              : 0);

        if (isTicketOnlyUpdate && prefillTicket) {
          const ticketPayload = {
            contactName: d.contactName,
            phone: d.phone,
            contactEmail: d.contactEmail || undefined,
            address: d.address || undefined,
            isPrimaryContactSpouse: d.isPrimaryContactSpouse,
            primaryContactSpouseType: d.isPrimaryContactSpouse ? d.primaryContactSpouseType : null,
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
              }
            }
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
          saveMutation.mutate(payload);
        }
      })}>
        <div className="section-label">Contact details</div>
        <div className="grid-2">
          <div className="form-group">
            <label>Primary contact name *</label>
            <input {...register('contactName', { required: true })} placeholder="Bride or groom" />
            {showAutoFillIndicator && (
              <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled from customer profile</span>
            )}
          </div>
          <div className="form-group"><label>Phone number</label><input {...register('phone', { required: false })} placeholder="Mobile number" /></div>
        </div>
        <div className="form-group"><label>Email</label><input type="email" {...register('contactEmail')} placeholder="Contact email address" /></div>
        <div className="form-group"><label>Address</label><input {...register('address')} placeholder="Full address" /></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div className="checkbox-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              id="f-primary-contact-check"
              {...register('isPrimaryContactSpouse')}
            />
            <label htmlFor="f-primary-contact-check" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
              Primary contact is one of the spouses
            </label>
          </div>
          {watchIsPrimaryContactSpouse ? (
            <div style={{ display: 'flex', gap: 20, marginLeft: 24, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Spouse type:</span>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  value="husband"
                  {...register('primaryContactSpouseType')}
                />
                Husband
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  value="wife"
                  {...register('primaryContactSpouseType')}
                />
                Wife
              </label>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 24, fontStyle: 'italic' }}>
              ℹ Primary contact is someone who came to enquire for spouses
            </div>
          )}
        </div>

        <div className="section-label">Marriage details</div>
        <div className="grid-2">
          <div className="form-group"><label>Husband name *</label><input {...register('spouse1Name', { required: true })} /></div>
          <div className="form-group"><label>Wife name *</label><input {...register('spouse2Name', { required: true })} /></div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Marriage act *</label>
            <Controller
              control={control}
              name="marriageAct"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoSelect
                  value={value || ''}
                  onChange={onChange}
                  options={[
                    { value: 'Hindu Marriage Act', label: 'Hindu Marriage Act' },
                    { value: 'Muslim Personal Law (Shariat)', label: 'Muslim Personal Law (Shariat)' },
                    { value: 'Indian Christian Marriage Act', label: 'Indian Christian Marriage Act' }
                  ]}
                  placeholder="Select act"
                />
              )}
            />
          </div>
          <div className="form-group">
            <label>Date of marriage *</label>
            <Controller
              control={control}
              name="marriageDate"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoDatePicker
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Place of marriage</label><input {...register('marriagePlace')} placeholder="Venue / city" /></div>
          <div className="form-group"><label>Application No.</label><input {...register('applicationNo')} placeholder="e.g. application number" /></div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Date of our service *</label>
            <Controller
              control={control}
              name="dateOfService"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoDatePicker
                  value={value}
                  onChange={onChange}
                  max={today}
                />
              )}
            />
          </div>
          <div className="form-group">
            <label>Appointment Date</label>
            <Controller
              control={control}
              name="appointmentDate"
              render={({ field: { value, onChange } }) => (
                <NeoDatePicker
                  value={value || ''}
                  onChange={onChange}
                />
              )}
            />
          </div>
        </div>

        {isAffidavitDateRequired && (
          <>
            <div className="section-label" style={{ marginTop: 12 }}>Link Executed Affidavits *</div>
            {requiredAffidavitPurposes.map((purpose) => {
              const linked = linkedAffs[purpose];
              const isSearching = activeSearchPurpose === purpose;

              return (
                <div className="form-group" key={purpose} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{purpose} *</label>
                  {linked ? (
                    <div style={{
                      border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px',
                      background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{linked.customerName} — {linked.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {linked.affidavitNo ? `No: ${linked.affidavitNo} · ` : ''}{linked.dateOfService} · ₹{Number(linked.amountCharged).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          const next = { ...linkedAffs };
                          delete next[purpose];
                          setLinkedAffs(next);
                          setValue('affidavitIds', Object.values(next).map(a => a.id));
                        }}
                      >
                        ✕ Unlink
                      </button>
                    </div>
                  ) : isSearching ? (
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="Search by name or phone..."
                          value={affSearch}
                          onChange={(e) => { setAffSearch(e.target.value); setShowAffDropdown(true); }}
                          style={{ width: '100%' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setActiveSearchPurpose(null);
                            setAffSearch('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      {showAffDropdown && affidavitResults.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 8,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', marginTop: 4,
                        }}>
                          {affidavitResults.map((aff) => {
                            const isAlreadyLinked = Object.values(linkedAffs).some(a => a.id === aff.id) || selectedAffidavits.some(a => a.id === aff.id);
                            return (
                              <div
                                key={aff.id}
                                onClick={() => {
                                  if (!isAlreadyLinked) {
                                    const next = { ...linkedAffs, [purpose]: aff };
                                    setLinkedAffs(next);
                                    setValue('affidavitIds', Object.values(next).map(a => a.id));
                                    setActiveSearchPurpose(null);
                                    setAffSearch('');
                                  }
                                }}
                                style={{
                                  padding: '10px 14px', cursor: isAlreadyLinked ? 'not-allowed' : 'pointer',
                                  borderBottom: '1px solid var(--border)', fontSize: 13,
                                  opacity: isAlreadyLinked ? 0.5 : 1, background: isAlreadyLinked ? 'var(--bg)' : 'transparent',
                                }}
                                onMouseEnter={(e) => { if (!isAlreadyLinked) e.currentTarget.style.background = 'var(--bg, #f5f5f5)'; }}
                                onMouseLeave={(e) => { if (!isAlreadyLinked) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{aff.customerName} — {aff.phone}</span>
                                  {isAlreadyLinked && <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>Already Linked</span>}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  {aff.purpose} · ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {showAffDropdown && affSearch && affidavitResults.length === 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 8,
                          padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', marginTop: 4,
                        }}>
                          No affidavit records found.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => {
                          setActiveSearchPurpose(purpose);
                          // Default search to phone or contact name or spouse name
                          setAffSearch(phoneWatch || watchContactName || '');
                          setShowAffDropdown(true);
                        }}
                      >
                        <span>🔍 Search & link executed affidavit</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Services (only for non-ticket forms) */}
        {!prefillTicket && (
          <>
            <hr className="divider" />
            <div className="section-label">Services provided</div>
            {servicesDef.map((s) => {
              const isMisc = s.key === 'Misc (Form, Xerox Copies)';
              const isChecked = watchSvcs.includes(s.key);

              return (
                <div key={s.key} style={{ marginBottom: 12 }}>
                  <div className="checkbox-row" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      id={`f-${s.key}`}
                      value={s.key}
                      checked={isChecked}
                      onChange={(e) => {
                        const next = e.target.checked ? [...watchSvcs, s.key] : watchSvcs.filter((x) => x !== s.key);
                        setValue('servicesProvided', next);
                        if (isMisc) {
                          setValue('miscFee', e.target.checked ? (pricing.marriage_misc_fee ?? 0) : 0);
                        }
                      }}
                    />
                    <label htmlFor={`f-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                      {s.key} {isMisc ? '' : `(₹${s.cost})`}
                    </label>
                  </div>

                  {isMisc && isChecked && (
                    <div style={{ marginLeft: 24, marginTop: 6 }} className="form-group">
                      <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Misc Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        style={{ maxWidth: 150 }}
                        {...register('miscFee', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div key="consultancy" style={{ marginBottom: 12 }}>
              <div className="checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  id="f-consultancy"
                  checked={watchSvcs.includes('Marriage Registration Consultancy Fee') || watchSvcs.includes('Marriage Consultancy Fee')}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...watchSvcs.filter((x) => x !== 'Marriage Consultancy Fee'), 'Marriage Registration Consultancy Fee']
                      : watchSvcs.filter((x) => x !== 'Marriage Consultancy Fee' && x !== 'Marriage Registration Consultancy Fee');
                    setValue('servicesProvided', next);
                    if (e.target.checked) {
                      setValue('consultancyFee', pricing.marriage_consultancy_fee ?? 500);
                    } else {
                      setValue('consultancyFee', 0);
                    }
                  }}
                />
                <label htmlFor="f-consultancy" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                  Marriage Registration Consultancy Fee
                </label>
              </div>

              {(watchSvcs.includes('Marriage Registration Consultancy Fee') || watchSvcs.includes('Marriage Consultancy Fee')) && (
                <div style={{ marginLeft: 24, marginTop: 6 }} className="form-group">
                  <label style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Marriage Consultancy Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    style={{ maxWidth: 150 }}
                    {...register('consultancyFee', { valueAsNumber: true })}
                    placeholder="500"
                  />
                </div>
              )}
            </div>
            <div className="checkbox-row" key="official-fee">
              <input
                type="checkbox"
                id="f-official-fee"
                checked={includeOfficialFee}
                onChange={(e) => setIncludeOfficialFee(e.target.checked)}
              />
              <label htmlFor="f-official-fee" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                Official Fee {watchMarriageDate ? `(Auto-calculated: ₹${officialFeeAmount})` : '(Select Marriage Date to calculate)'}
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8, marginBottom: 8 }} key="court-fee-tickets">
              <span style={{ fontSize: 14, color: 'var(--text)' }}>Court Fee Tickets (₹{pricing.marriage_court_fee_tickets ?? 110}):</span>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="f-court-fee-tickets"
                  checked={includeCourtFeeTickets === true}
                  onChange={() => setIncludeCourtFeeTickets(true)}
                />
                Yes
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="f-court-fee-tickets"
                  checked={includeCourtFeeTickets === false}
                  onChange={() => setIncludeCourtFeeTickets(false)}
                />
                No
              </label>
            </div>
          </>
        )}

        {/* Affidavit linking (only for non-ticket forms; ticket auto-generates them) */}
        {!prefillTicket && (
          <>
            <hr className="divider" />
            <div className="section-label">Link affidavit records</div>

            {selectedAffidavits.map((aff) => (
              <div key={aff.id} style={{
                border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8,
                background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{aff.customerName} — {aff.phone}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{aff.purpose} · {PAPER_LABELS[aff.paperType]} · {AUTH_LABELS[aff.authorizerType]}</div>
                  <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}</div>
                </div>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => unlinkAffidavit(aff.id)} style={{ flexShrink: 0 }}>✕ Unlink</button>
              </div>
            ))}

            <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 14 }}>
              <input
                placeholder="Search affidavit by name or phone to link..."
                value={affSearch}
                onChange={(e) => { setAffSearch(e.target.value); setShowAffDropdown(true); }}
                onFocus={() => affSearch && setShowAffDropdown(true)}
                style={{ width: '100%' }}
              />
              {showAffDropdown && affidavitResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto', marginTop: 4,
                }}>
                  {affidavitResults.map((aff) => {
                    const isLinked = selectedAffidavits.some((x) => x.id === aff.id);
                    return (
                      <div key={aff.id} onClick={() => !isLinked && selectAffidavit(aff)} style={{
                        padding: '10px 14px', cursor: isLinked ? 'not-allowed' : 'pointer',
                        borderBottom: '1px solid var(--border)', fontSize: 13, transition: 'background 0.15s',
                        opacity: isLinked ? 0.5 : 1, background: isLinked ? 'var(--bg)' : 'transparent',
                      }}
                        onMouseEnter={(e) => { if (!isLinked) e.currentTarget.style.background = 'var(--bg, #f5f5f5)'; }}
                        onMouseLeave={(e) => { if (!isLinked) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{aff.customerName} — {aff.phone}</span>
                          {isLinked && <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>Already Linked</span>}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {aff.purpose} · ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {showAffDropdown && affSearch && affidavitResults.length === 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)', marginTop: 4,
                }}>
                  No affidavit records found.
                </div>
              )}
            </div>
          </>
        )}

        <div className="form-group">
          <label>Amount charged (₹) *</label>
          <input type="number" {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })} placeholder="Auto-calculated, can edit" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending || updateTicketMutation.isPending || (!isTicketOnlyUpdate && !hasAllAffidavitDates)}>
            {saveMutation.isPending || updateTicketMutation.isPending
              ? 'Saving…'
              : (isTicketOnlyUpdate ? 'Save Ticket State' : 'Save record')}
          </button>
          <button type="button" className="btn" onClick={() => {
            reset({
              contactName: '',
              phone: '',
              contactEmail: '',
              address: '',
              isPrimaryContactSpouse: true,
              primaryContactSpouseType: 'husband',
              spouse1Name: '',
              spouse2Name: '',
              marriageAct: '' as any,
              marriageDate: '',
              marriagePlace: '',
              appointmentDate: '',
              affidavitDates: {},
              dateOfService: today,
              servicesProvided: ['Misc (Form, Xerox Copies)'],
              affidavitIds: [],
              amountCharged: 0,
              miscFee: pricing.marriage_misc_fee ?? 0,
              consultancyFee: pricing.marriage_consultancy_fee ?? 500,
              ticketId: '',
              applicationNo: '',
            });
            setSelectedAffidavits([]);
            setLinkedAffs({});
            setActiveSearchPurpose(null);
            onClearPrefill();
          }}>Clear</button>
        </div>
      </form>
    </div>
  );
}
