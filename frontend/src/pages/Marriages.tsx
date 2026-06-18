import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { affidavitsApi, marriagesApi, customersApi } from '@/api';
import {
  PaperType, AuthorizerType, MarriageAct,
  PAPER_LABELS, AUTH_LABELS,
  Marriage, Affidavit, MarriageTicket, QuestionnaireData, ProofEntry,
} from '@/types';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';
import { MarriageReceipt } from '@/components/ReceiptModal/Receipt';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabType = 'estimation' | 'tickets' | 'add';

interface RecordFormValues {
  contactName: string;
  phone: string;
  contactEmail: string;
  address: string;
  spouse1Name: string;
  spouse2Name: string;
  marriageAct: MarriageAct;
  marriageDate: string;
  marriagePlace: string;
  witness1Name: string;
  witness2Name: string;
  witness3Name: string;
  priestDetails: string;
  dateOfService: string;
  servicesProvided: string[];
  affidavitIds: string[];
  amountCharged: number;
  ticketId?: string;
}

// ── Proof Block Sub-component ─────────────────────────────────────────────────

function ProofBlock({
  label,
  entry,
  onChange,
  pricing,
}: {
  label: string;
  entry: ProofEntry;
  onChange: (updated: ProofEntry) => void;
  pricing: Record<string, number>;
}) {
  const needsAffidavit = entry.correct === false;
  const affYes = entry.affidavit === 'Yes';

  const calcAmount = useMemo(() => {
    if (!affYes || !entry.paperType || !entry.authorizer) return 0;
    const res = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing);
    if (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) {
      return res.authFee;
    }
    return res.total;
  }, [affYes, entry.paperType, entry.authorizer, entry.customerBroughtStamp, pricing]);

  const isDiscounted = affYes && !!entry.paperType && !!entry.authorizer && entry.amountCharged !== undefined && entry.amountCharged < calcAmount;

  useEffect(() => {
    if (!isDiscounted && entry.remark) {
      onChange({ ...entry, remark: undefined });
    }
  }, [isDiscounted, entry.remark, entry, onChange]);

  return (
    <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
      <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>{label}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: needsAffidavit ? 10 : 0 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={entry.correct === true} onChange={() => onChange({ correct: true })} />
          Correct
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={entry.correct === false} onChange={() => onChange({ correct: false, affidavit: 'No' })} />
          Wrong
        </label>
      </div>

      {needsAffidavit && (
        <>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12 }}>Need affidavit?</label>
            <NeoSelect
              value={entry.affidavit || 'No'}
              onChange={(val) => {
                onChange({ ...entry, affidavit: val as ProofEntry['affidavit'], paperType: undefined, authorizer: undefined, amountCharged: undefined, customerBroughtStamp: undefined });
              }}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: 'Combined with other', label: 'Combined with other' }
              ]}
            />
          </div>

          {affYes && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Paper type</label>
                <NeoSelect
                  value={entry.paperType || ''}
                  onChange={(val) => {
                    const pt = val as PaperType;
                    const res = calcAffidavitTotal(pt, entry.authorizer || 'magistrate', pricing);
                    onChange({
                      ...entry,
                      paperType: pt,
                      customerBroughtStamp: pt === 'stamp500' ? false : undefined,
                      amountCharged: res.total
                    });
                  }}
                  options={[
                    { value: 'stamp500', label: '₹500 Stamp Paper' },
                    { value: 'Plain', label: 'Plain Paper' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Authorizer</label>
                <NeoSelect
                  value={entry.authorizer || ''}
                  onChange={(val) => {
                    const auth = val as AuthorizerType;
                    const res = calcAffidavitTotal(entry.paperType || 'stamp500', auth, pricing);
                    const newCalc = (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) ? res.authFee : res.total;
                    onChange({ ...entry, authorizer: auth, amountCharged: newCalc });
                  }}
                  options={[
                    { value: 'magistrate', label: 'Executive Magistrate' },
                    { value: 'Notary', label: 'Notary Public' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={entry.amountCharged ?? calcAmount}
                  onChange={(e) => onChange({ ...entry, amountCharged: Number(e.target.value) })}
                  style={{ fontSize: 13 }}
                />
              </div>
              {entry.paperType === 'stamp500' && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Customer brought stamp or was it ours? *</label>
                  <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp === true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: true, amountCharged: res.authFee });
                        }}
                      />
                      Customer brought stamp (excludes stamp cost)
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp !== true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: false, amountCharged: res.total });
                        }}
                      />
                      Ours
                    </label>
                  </div>
                </div>
              )}
              {isDiscounted && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Remark (Reason for discount) *</label>
                  <input
                    type="text"
                    value={entry.remark || ''}
                    onChange={(e) => onChange({ ...entry, remark: e.target.value })}
                    placeholder="Reason for charging less than standard rate"
                    style={{ fontSize: 13 }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Situation Block (Wedding/FirstMarriage/Intercaste) ────────────────────────

function SituationBlock({
  label,
  radioLabel,
  entry,
  triggerOnValue,
  onChange,
  pricing,
  showNameInput,
  nameInputLabel = "Affidavit Name *",
}: {
  label: string;
  radioLabel: [string, string];
  entry: {
    yes?: boolean;
    available?: boolean;
    affidavit?: string;
    paperType?: PaperType;
    authorizer?: AuthorizerType;
    amountCharged?: number;
    remark?: string;
    customerName?: string;
    customerBroughtStamp?: boolean;
  };
  triggerOnValue: boolean;
  onChange: (updated: any) => void;
  pricing: Record<string, number>;
  showNameInput?: boolean;
  nameInputLabel?: string;
}) {
  const currentVal = entry.yes !== undefined ? entry.yes : entry.available;
  const needsAffidavit = currentVal === triggerOnValue;
  const affYes = entry.affidavit === 'Yes';
  const fieldKey = entry.yes !== undefined ? 'yes' : 'available';

  const calcAmount = useMemo(() => {
    if (!affYes || !entry.paperType || !entry.authorizer) return 0;
    const res = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing);
    if (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) {
      return res.authFee;
    }
    return res.total;
  }, [affYes, entry.paperType, entry.authorizer, entry.customerBroughtStamp, pricing]);

  const isDiscounted = affYes && !!entry.paperType && !!entry.authorizer && entry.amountCharged !== undefined && entry.amountCharged < calcAmount;

  useEffect(() => {
    if (!isDiscounted && entry.remark) {
      onChange({ ...entry, remark: undefined });
    }
  }, [isDiscounted, entry.remark, entry, onChange]);

  return (
    <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
      <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>{label}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: needsAffidavit ? 10 : 0 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={currentVal === true} onChange={() => onChange({ [fieldKey]: true, affidavit: 'No' })} />
          {radioLabel[0]}
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
          <input type="radio" checked={currentVal === false} onChange={() => onChange({ [fieldKey]: false, affidavit: 'No' })} />
          {radioLabel[1]}
        </label>
      </div>

      {needsAffidavit && (
        <>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12 }}>Need affidavit?</label>
            <NeoSelect
              value={entry.affidavit || 'No'}
              onChange={(val) => onChange({ ...entry, affidavit: val, paperType: undefined, authorizer: undefined, amountCharged: undefined, customerName: undefined, customerBroughtStamp: undefined })}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: 'Combined with other', label: 'Combined with other' }
              ]}
            />
          </div>

          {affYes && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {showNameInput && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 8 }}>
                  <label style={{ fontSize: 12 }}>{nameInputLabel}</label>
                  <input
                    type="text"
                    value={entry.customerName || ''}
                    onChange={(e) => onChange({ ...entry, customerName: e.target.value })}
                    placeholder="Enter name for affidavit"
                    style={{ fontSize: 13 }}
                  />
                  {!entry.customerName?.trim() && (
                    <span style={{ color: 'var(--danger)', fontSize: 11, display: 'block', marginTop: 4 }}>
                      ⚠ Name is required for this affidavit.
                    </span>
                  )}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Paper type</label>
                <NeoSelect
                  value={entry.paperType || ''}
                  onChange={(val) => {
                    const pt = val as PaperType;
                    const res = calcAffidavitTotal(pt, entry.authorizer || 'magistrate', pricing);
                    onChange({
                      ...entry,
                      paperType: pt,
                      customerBroughtStamp: pt === 'stamp500' ? false : undefined,
                      amountCharged: res.total
                    });
                  }}
                  options={[
                    { value: 'stamp500', label: '₹500 Stamp Paper' },
                    { value: 'Plain', label: 'Plain Paper' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Authorizer</label>
                <NeoSelect
                  value={entry.authorizer || ''}
                  onChange={(val) => {
                    const auth = val as AuthorizerType;
                    const res = calcAffidavitTotal(entry.paperType || 'stamp500', auth, pricing);
                    const newCalc = (entry.paperType === 'stamp500' && entry.customerBroughtStamp === true) ? res.authFee : res.total;
                    onChange({ ...entry, authorizer: auth, amountCharged: newCalc });
                  }}
                  options={[
                    { value: 'magistrate', label: 'Executive Magistrate' },
                    { value: 'Notary', label: 'Notary Public' }
                  ]}
                  placeholder="Select"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={entry.amountCharged ?? calcAmount}
                  onChange={(e) => onChange({ ...entry, amountCharged: Number(e.target.value) })}
                  style={{ fontSize: 13 }}
                />
              </div>
              {entry.paperType === 'stamp500' && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Customer brought stamp or was it ours? *</label>
                  <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp === true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: true, amountCharged: res.authFee });
                        }}
                      />
                      Customer brought stamp (excludes stamp cost)
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="radio"
                        checked={entry.customerBroughtStamp !== true}
                        onChange={() => {
                          const res = calcAffidavitTotal(entry.paperType || 'stamp500', entry.authorizer || 'magistrate', pricing);
                          onChange({ ...entry, customerBroughtStamp: false, amountCharged: res.total });
                        }}
                      />
                      Ours
                    </label>
                  </div>
                </div>
              )}
              {isDiscounted && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: 8, marginBottom: 0 }}>
                  <label style={{ fontSize: 12 }}>Remark (Reason for discount) *</label>
                  <input
                    type="text"
                    value={entry.remark || ''}
                    onChange={(e) => onChange({ ...entry, remark: e.target.value })}
                    placeholder="Reason for charging less than standard rate"
                    style={{ fontSize: 13 }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEntryAmount(entry?: { affidavit?: string; amountCharged?: number }): number {
  if (!entry || entry.affidavit !== 'Yes') return 0;
  return entry.amountCharged ?? 0;
}

function calcEstimationTotal(q: QuestionnaireData, services: string[], pricing: Record<string, number>): number {
  let total = 0;

  // Husband
  total += getEntryAmount(q.husband?.birthDateProof);
  total += getEntryAmount(q.husband?.residenceProof);
  total += getEntryAmount(q.husband?.identityProof);

  // Wife
  total += getEntryAmount(q.wife?.birthDateProof);
  total += getEntryAmount(q.wife?.residenceProof);
  total += getEntryAmount(q.wife?.identityProof);

  // Misc
  total += getEntryAmount(q.weddingInvitation);
  total += getEntryAmount(q.firstMarriage);
  total += getEntryAmount(q.intercasteMarriage);

  // Consultancy Fee
  total += q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);

  // Services
  if (services.includes('Online form filling')) total += pricing.online_form ?? 0;
  if (services.includes('Offline form filling')) total += pricing.offline_form ?? 0;
  if (services.includes('Document true copy')) total += pricing.true_copy ?? 0;

  return total;
}

function defaultProof(): ProofEntry {
  return { correct: true };
}

function defaultQuestionnaire(): QuestionnaireData {
  return {
    husband: { birthDateProof: defaultProof(), residenceProof: defaultProof(), identityProof: defaultProof() },
    wife: { birthDateProof: defaultProof(), residenceProof: defaultProof(), identityProof: defaultProof() },
    weddingInvitation: { available: true, affidavit: 'No' },
    firstMarriage: { yes: true, affidavit: 'No' },
    intercasteMarriage: { yes: false, affidavit: 'No' },
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarriagesPage() {
  const [tab, setTab] = useState<TabType>('estimation');
  const [savedRecord, setSavedRecord] = useState<Marriage | null>(null);
  const [selectedAffidavits, setSelectedAffidavits] = useState<Affidavit[]>([]);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [prefillTicket, setPrefillTicket] = useState<MarriageTicket | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  // ── Estimation form state ─────────────────────────────────────────────────

  const [estName, setEstName] = useState('');
  const [estPhone, setEstPhone] = useState('');
  const [estEmail, setEstEmail] = useState('');
  const [estAddress, setEstAddress] = useState('');
  const [estServices, setEstServices] = useState<string[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(defaultQuestionnaire());
  const [estAmountOverride, setEstAmountOverride] = useState<number | null>(null);

  const SERVICES = [
    { key: 'Online form filling', cost: pricing.online_form },
    { key: 'Offline form filling', cost: pricing.offline_form },
    { key: 'Document true copy', cost: pricing.true_copy },
  ];

  const estimatedTotal = calcEstimationTotal(questionnaire, estServices, pricing);
  const ticketAmount = estAmountOverride ?? estimatedTotal;

  // ── Tickets query ─────────────────────────────────────────────────────────

  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['marriage-tickets', ticketStatusFilter],
    queryFn: () => marriagesApi.getAllTickets(ticketStatusFilter ? { status: ticketStatusFilter } : {}).then((r) => r.data),
    staleTime: 15_000,
  });

  // ── Create ticket mutation ────────────────────────────────────────────────

  const createTicketMut = useMutation({
    mutationFn: (data: any) => marriagesApi.createTicket(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      // Reset estimation form
      setEstName(''); setEstPhone(''); setEstEmail(''); setEstAddress('');
      setEstServices([]); setQuestionnaire(defaultQuestionnaire()); setEstAmountOverride(null);
      setTab('tickets');
    },
  });

  const confirmTicketMut = useMutation({
    mutationFn: (id: string) => marriagesApi.confirmTicket(id).then((r) => r.data),
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      setPrefillTicket(ticket);
      setTab('add');
    },
  });

  // ── Add Record form ───────────────────────────────────────────────────────

  const { register, handleSubmit, watch, setValue, reset, control } = useForm<RecordFormValues>({
    defaultValues: { dateOfService: today, servicesProvided: [], affidavitIds: [] },
  });

  const watchSvcs = watch('servicesProvided') || [];
  const phoneWatch = watch('phone');
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  // Pre-fill from ticket
  useEffect(() => {
    if (prefillTicket) {
      setValue('contactName', prefillTicket.contactName);
      setValue('phone', prefillTicket.phone);
      if (prefillTicket.contactEmail) setValue('contactEmail', prefillTicket.contactEmail);
      if (prefillTicket.address) setValue('address', prefillTicket.address);
      if (prefillTicket.servicesProvided?.length) setValue('servicesProvided', prefillTicket.servicesProvided);
      setValue('amountCharged', Number(prefillTicket.amountCharged));
      setValue('ticketId', prefillTicket.id);
      setValue('dateOfService', today);
    }
  }, [prefillTicket, setValue, today]);

  // Customer auto-fill
  useEffect(() => {
    if (prefillTicket) return; // Don't override ticket prefill
    if (phoneWatch && /^[6-9]\d{9}$/.test(phoneWatch)) {
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
    total += totalAffAmount;
    total += pricing.marriage_consultancy_fee ?? 500;
    setValue('amountCharged', total);
  }, [watchSvcs, totalAffAmount, pricing, setValue, prefillTicket]);

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
      setSavedRecord(data);
      reset({
        contactName: '',
        phone: '',
        contactEmail: '',
        address: '',
        spouse1Name: '',
        spouse2Name: '',
        marriageAct: '' as any,
        marriageDate: '',
        marriagePlace: '',
        witness1Name: '',
        witness2Name: '',
        witness3Name: '',
        priestDetails: '',
        dateOfService: today,
        servicesProvided: [],
        affidavitIds: [],
        amountCharged: 0,
        ticketId: '',
      });
      setSelectedAffidavits([]);
      setAffSearch('');
      setPrefillTicket(null);
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  // Questionnaire helpers
  const updateProof = (person: 'husband' | 'wife', field: keyof QuestionnaireData['husband'], entry: ProofEntry) => {
    setQuestionnaire((prev) => ({
      ...prev,
      [person]: { ...prev[person], [field]: entry },
    }));
    setEstAmountOverride(null); // Reset override when questionnaire changes
  };

  const isAnyAffidavitDiscountedWithoutRemark = () => {
    const checkEntry = (entry?: { affidavit?: string; amountCharged?: number; paperType?: PaperType; authorizer?: AuthorizerType; remark?: string }) => {
      if (!entry || entry.affidavit !== 'Yes' || !entry.paperType || !entry.authorizer) return false;
      const calcAmt = calcAffidavitTotal(entry.paperType, entry.authorizer, pricing).total;
      const charged = entry.amountCharged ?? calcAmt;
      return charged < calcAmt && !entry.remark?.trim();
    };

    const q = questionnaire;
    return (
      checkEntry(q.husband?.birthDateProof) ||
      checkEntry(q.husband?.residenceProof) ||
      checkEntry(q.husband?.identityProof) ||
      checkEntry(q.wife?.birthDateProof) ||
      checkEntry(q.wife?.residenceProof) ||
      checkEntry(q.wife?.identityProof) ||
      checkEntry(q.weddingInvitation) ||
      checkEntry(q.firstMarriage) ||
      checkEntry(q.intercasteMarriage)
    );
  };

  const isSubsequentMarriageNameMissing = () => {
    const q = questionnaire;
    return (
      q.firstMarriage &&
      q.firstMarriage.yes === false &&
      q.firstMarriage.affidavit === 'Yes' &&
      !q.firstMarriage.customerName?.trim()
    );
  };

  const handleGenerateTicket = () => {
    if (!estName.trim() || !estPhone.trim()) return;

    const finalQuestionnaire = {
      ...questionnaire,
      consultancyFee: {
        amountCharged: questionnaire.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500)
      }
    };

    createTicketMut.mutate({
      contactName: estName,
      phone: estPhone,
      contactEmail: estEmail || undefined,
      address: estAddress || undefined,
      servicesProvided: estServices,
      amountCharged: ticketAmount,
      questionnaireData: finalQuestionnaire,
    });
  };

  const handleProceed = (ticket: MarriageTicket) => {
    if (ticket.status === 'Inquired') {
      confirmTicketMut.mutate(ticket.id);
    } else if (ticket.status === 'Confirmed') {
      setPrefillTicket(ticket);
      setTab('add');
    }
  };

  // ── Price breakdown items ─────────────────────────────────────────────────

  const breakdownItems = useMemo(() => {
    const items: { label: string; amount: number; remark?: string }[] = [];
    const q = questionnaire;

    const addEntry = (label: string, entry?: { affidavit?: string; amountCharged?: number; remark?: string; customerName?: string }) => {
      const amt = getEntryAmount(entry);
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

    // Consultancy Fee
    const consultancyAmt = q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);
    items.push({ label: 'Marriage Consultancy Fee', amount: consultancyAmt });

    SERVICES.filter((s) => estServices.includes(s.key)).forEach((s) => {
      items.push({ label: s.key, amount: s.cost });
    });

    return items;
  }, [questionnaire, estServices, pricing]);

  // ── Ticket breakdown from questionnaireData ───────────────────────────────

  const ticketBreakdown = (ticket: MarriageTicket) => {
    const items: { label: string; amount: number; remark?: string }[] = [];
    const q = ticket.questionnaireData;
    const addEntry = (label: string, entry?: any) => {
      const amt = getEntryAmount(entry);
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

    // Consultancy Fee
    const consultancyAmt = q.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500);
    items.push({ label: 'Marriage Consultancy Fee', amount: consultancyAmt });

    (ticket.servicesProvided || []).forEach((svc) => {
      const svcDef = SERVICES.find((s) => s.key === svc);
      if (svcDef) items.push({ label: svc, amount: svcDef.cost });
    });
    return items;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Marriage Registration</div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'estimation' ? 'active' : ''}`} onClick={() => setTab('estimation')}>Estimation</button>
        <button className={`tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>Tickets</button>
        <button className={`tab ${tab === 'add' ? 'active' : ''}`} onClick={() => { setTab('add'); setPrefillTicket(null); }}>Add record</button>
      </div>

      {/* ═══════════════════════ TAB 1: ESTIMATION ═══════════════════════ */}
      {tab === 'estimation' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Marriage Registration Estimation</div>

          {createTicketMut.isError && <div className="alert-error" style={{ marginBottom: 16 }}>Failed to create ticket. Please try again.</div>}

          {/* Contact info */}
          <div className="section-label">Customer details</div>
          <div className="grid-2">
            <div className="form-group">
              <label>Customer name *</label>
              <input value={estName} onChange={(e) => setEstName(e.target.value)} placeholder="Customer name" />
            </div>
            <div className="form-group">
              <label>Phone number *</label>
              <input value={estPhone} onChange={(e) => setEstPhone(e.target.value)} placeholder="10-digit mobile" />
            </div>
          </div>
          <div className="form-group"><label>Email</label><input type="email" value={estEmail} onChange={(e) => setEstEmail(e.target.value)} placeholder="Email address" /></div>
          <div className="form-group"><label>Address</label><input value={estAddress} onChange={(e) => setEstAddress(e.target.value)} placeholder="Full address" /></div>

          <hr className="divider" />

          {/* Section 1: Husband */}
          <div className="section-label">Section 1 — Husband</div>
          <ProofBlock label="Birth Date Proof" entry={questionnaire.husband.birthDateProof} pricing={pricing}
            onChange={(e) => updateProof('husband', 'birthDateProof', e)} />
          <ProofBlock label="Residence Proof" entry={questionnaire.husband.residenceProof} pricing={pricing}
            onChange={(e) => updateProof('husband', 'residenceProof', e)} />
          <ProofBlock label="Identity Proof" entry={questionnaire.husband.identityProof} pricing={pricing}
            onChange={(e) => updateProof('husband', 'identityProof', e)} />

          {/* Section 2: Wife */}
          <div className="section-label">Section 2 — Wife</div>
          <ProofBlock label="Birth Date Proof" entry={questionnaire.wife.birthDateProof} pricing={pricing}
            onChange={(e) => updateProof('wife', 'birthDateProof', e)} />
          <ProofBlock label="Residence Proof" entry={questionnaire.wife.residenceProof} pricing={pricing}
            onChange={(e) => updateProof('wife', 'residenceProof', e)} />
          <ProofBlock label="Identity Proof" entry={questionnaire.wife.identityProof} pricing={pricing}
            onChange={(e) => updateProof('wife', 'identityProof', e)} />

          {/* Section 3: Wedding Invitation */}
          <div className="section-label">Section 3 — Wedding Invitation</div>
          <SituationBlock
            label="Do you have a wedding invitation card?"
            radioLabel={['Yes', 'No']}
            entry={questionnaire.weddingInvitation}
            triggerOnValue={false}
            pricing={pricing}
            onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, weddingInvitation: e })); setEstAmountOverride(null); }}
          />

          {/* Section 4: First Marriage */}
          <div className="section-label">Section 4 — First Marriage</div>
          <SituationBlock
            label="Is this the first marriage?"
            radioLabel={['Yes', 'No']}
            entry={questionnaire.firstMarriage}
            triggerOnValue={false}
            pricing={pricing}
            showNameInput={true}
            nameInputLabel="Name for subsequent marriage affidavit *"
            onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, firstMarriage: e })); setEstAmountOverride(null); }}
          />

          {/* Section 5: Intercaste Marriage */}
          <div className="section-label">Section 5 — Intercaste Marriage</div>
          <SituationBlock
            label="Is this an intercaste marriage?"
            radioLabel={['Yes', 'No']}
            entry={questionnaire.intercasteMarriage}
            triggerOnValue={true}
            pricing={pricing}
            onChange={(e: any) => { setQuestionnaire((prev) => ({ ...prev, intercasteMarriage: e })); setEstAmountOverride(null); }}
          />

          {/* Section 6: Consultancy Fee */}
          <div className="section-label">Section 6 — Consultancy Fee (Mandatory)</div>
          <div style={{ marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>
                Marriage Consultancy Fee is mandatory for all registrations.
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={questionnaire.consultancyFee?.amountCharged ?? (pricing.marriage_consultancy_fee ?? 500)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setQuestionnaire((prev) => ({
                      ...prev,
                      consultancyFee: { amountCharged: val }
                    }));
                    setEstAmountOverride(null);
                  }}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Section 7: Services */}
          <hr className="divider" />
          <div className="section-label">Section 7 — Services</div>
          {SERVICES.map((s) => (
            <div className="checkbox-row" key={s.key}>
              <input
                type="checkbox"
                id={`est-${s.key}`}
                checked={estServices.includes(s.key)}
                onChange={(e) => {
                  setEstServices(e.target.checked ? [...estServices, s.key] : estServices.filter((x) => x !== s.key));
                  setEstAmountOverride(null);
                }}
              />
              <label htmlFor={`est-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                {s.key} (₹{s.cost})
              </label>
            </div>
          ))}

          {/* Price breakdown */}
          {breakdownItems.length > 0 && (
            <div className="price-box" style={{ marginTop: 16 }}>
              {breakdownItems.map((item, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div className="price-row" style={{ marginBottom: 0 }}>
                    <span>{item.label}</span>
                    <span>₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {item.remark && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                      ↳ Remark: {item.remark}
                    </div>
                  )}
                </div>
              ))}
              <div className="price-total">
                <span className="price-total-label">Calculated total</span>
                <span className="price-total-value">₹{estimatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Editable amount charged */}
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Amount Charged (₹) *</label>
            <input
              type="number"
              min={0}
              value={ticketAmount}
              onChange={(e) => setEstAmountOverride(Number(e.target.value))}
              placeholder="Auto-calculated, can edit to charge more"
            />
          </div>

          {isAnyAffidavitDiscountedWithoutRemark() && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
              ⚠ Please provide a remark for all discounted affidavits before generating a ticket.
            </div>
          )}

          {isSubsequentMarriageNameMissing() && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, fontWeight: 500 }}>
              ⚠ Please provide the name for the subsequent marriage affidavit before generating a ticket.
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleGenerateTicket}
            disabled={
              createTicketMut.isPending ||
              !estName.trim() ||
              !estPhone.trim() ||
              isAnyAffidavitDiscountedWithoutRemark() ||
              isSubsequentMarriageNameMissing()
            }
            style={{ marginTop: 8 }}
          >
            {createTicketMut.isPending ? 'Creating…' : '📋 Generate Ticket'}
          </button>
        </div>
      )}

      {/* ═══════════════════════ TAB 2: TICKETS ═══════════════════════ */}
      {tab === 'tickets' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 500 }}>Estimation Tickets</div>
            <NeoSelect
              value={ticketStatusFilter}
              onChange={(val) => setTicketStatusFilter(val)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'Inquired', label: 'Inquired' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Completed', label: 'Completed' }
              ]}
              style={{ width: '160px' }}
            />
          </div>

          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ticket.ticketNumber}</td>
                      <td>{ticket.contactName}</td>
                      <td>{ticket.phone}</td>
                      <td>₹{Number(ticket.amountCharged).toLocaleString('en-IN')}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: ticket.status === 'Completed' ? 'var(--success)' : ticket.status === 'Confirmed' ? 'var(--warning, #f0ad4e)' : 'var(--primary)',
                          color: '#fff',
                        }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {ticket.status === 'Inquired' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleProceed(ticket)}
                            disabled={confirmTicketMut.isPending}
                          >
                            Proceed
                          </button>
                        )}
                        {ticket.status === 'Confirmed' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleProceed(ticket)}>
                            Complete
                          </button>
                        )}
                        {ticket.status === 'Completed' && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ TAB 3: ADD RECORD ═══════════════════════ */}
      {tab === 'add' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>
            {prefillTicket ? `Complete Record — ${prefillTicket.ticketNumber}` : 'New marriage registration record'}
          </div>

          {saveMutation.isSuccess && savedRecord && (
            <div className="alert-success" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Record saved successfully!</span>
              <button className="btn btn-sm" onClick={handlePrint}>🖨 Print receipt</button>
            </div>
          )}
          {saveMutation.isError && <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>}

          {/* Ticket price breakdown (read-only) */}
          {prefillTicket && (
            <div className="price-box" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>Estimation breakdown (from ticket)</div>
              {ticketBreakdown(prefillTicket).map((item, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div className="price-row" style={{ marginBottom: 0 }}>
                    <span>{item.label}</span>
                    <span>₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {item.remark && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                      ↳ Remark: {item.remark}
                    </div>
                  )}
                </div>
              ))}
              <div className="price-total">
                <span className="price-total-label">Ticket amount</span>
                <span className="price-total-value">₹{Number(prefillTicket.amountCharged).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <div className="section-label">Contact details</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Primary contact name *</label>
                <input {...register('contactName', { required: true })} placeholder="Bride or groom" />
                {showAutoFillIndicator && (
                  <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled from customer profile</span>
                )}
              </div>
              <div className="form-group"><label>Phone number *</label><input {...register('phone', { required: true })} placeholder="10-digit mobile" /></div>
            </div>
            <div className="form-group"><label>Email</label><input type="email" {...register('contactEmail')} placeholder="Contact email address" /></div>
            <div className="form-group"><label>Address</label><input {...register('address')} placeholder="Full address" /></div>

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
            <div className="form-group"><label>Place of marriage</label><input {...register('marriagePlace')} placeholder="Venue / city" /></div>
            <div className="grid-3">
              <div className="form-group"><label>Witness 1 name</label><input {...register('witness1Name')} /></div>
              <div className="form-group"><label>Witness 2 name</label><input {...register('witness2Name')} /></div>
              <div className="form-group"><label>Witness 3 name</label><input {...register('witness3Name')} /></div>
            </div>
            <div className="form-group"><label>Priest / officiant details</label><input {...register('priestDetails')} placeholder="Name, designation" /></div>
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

            {/* Services (only for non-ticket forms) */}
            {!prefillTicket && (
              <>
                <hr className="divider" />
                <div className="section-label">Services provided</div>
                {SERVICES.map((s) => (
                  <div className="checkbox-row" key={s.key}>
                    <input
                      type="checkbox"
                      id={`f-${s.key}`}
                      value={s.key}
                      checked={watchSvcs.includes(s.key)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...watchSvcs, s.key] : watchSvcs.filter((x) => x !== s.key);
                        setValue('servicesProvided', next);
                      }}
                    />
                    <label htmlFor={`f-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>{s.key} (₹{s.cost})</label>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>
                  <strong>Mandatory fee:</strong> Marriage Consultancy Fee (₹{pricing.marriage_consultancy_fee ?? 500}) is automatically included.
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
              <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save record'}
              </button>
              <button type="button" className="btn" onClick={() => {
                reset({
                  contactName: '',
                  phone: '',
                  contactEmail: '',
                  address: '',
                  spouse1Name: '',
                  spouse2Name: '',
                  marriageAct: '' as any,
                  marriageDate: '',
                  marriagePlace: '',
                  witness1Name: '',
                  witness2Name: '',
                  witness3Name: '',
                  priestDetails: '',
                  dateOfService: today,
                  servicesProvided: [],
                  affidavitIds: [],
                  amountCharged: 0,
                  ticketId: '',
                });
                setSelectedAffidavits([]);
                setPrefillTicket(null);
              }}>Clear</button>
            </div>
          </form>
        </div>
      )}

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <MarriageReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
