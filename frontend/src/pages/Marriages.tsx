import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { affidavitsApi, marriagesApi } from '@/api';
import { PaperType, AuthorizerType, MarriageAct, PAPER_LABELS, AUTH_LABELS, Marriage, Affidavit } from '@/types';
import { usePricing, calcAffidavitTotal, calcMarriageTotal } from '@/hooks/usePricing';
import { MarriageReceipt } from '@/components/ReceiptModal/Receipt';

interface FormValues {
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
}

export default function MarriagesPage() {
  const [tab, setTab] = useState<'calc' | 'add'>('calc');
  const [calcServices, setCalcServices] = useState<string[]>([]);
  const [savedRecord, setSavedRecord] = useState<Marriage | null>(null);
  const [selectedAffidavits, setSelectedAffidavits] = useState<Affidavit[]>([]);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const SERVICES = [
    { key: 'Online form filling',  cost: pricing.online_form },
    { key: 'Offline form filling', cost: pricing.offline_form },
    { key: 'Document true copy',   cost: pricing.true_copy },
  ];

  // Calculator state
  const calcServicesTotal = SERVICES.filter((s) => calcServices.includes(s.key)).reduce((t, s) => t + s.cost, 0);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { dateOfService: today, servicesProvided: [], affidavitIds: [] },
  });

  const watchSvcs  = watch('servicesProvided') || [];

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

  const recalc = (svcs?: string[], affList?: Affidavit[]) => {
    const s = svcs ?? watchSvcs;
    const list = affList ?? selectedAffidavits;
    const totalAffAmount = list.reduce((sum, aff) => sum + Number(aff.amountCharged), 0);
    setValue('amountCharged', calcMarriageTotal(s, totalAffAmount, pricing));
  };

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
    recalc(undefined, updated);
  };

  const unlinkAffidavit = (id: string) => {
    const updated = selectedAffidavits.filter((x) => x.id !== id);
    setSelectedAffidavits(updated);
    setValue('affidavitIds', updated.map((x) => x.id));
    recalc(undefined, updated);
  };

  const mutation = useMutation({
    mutationFn: (data: FormValues) => marriagesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['marriages'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      reset({ dateOfService: today, servicesProvided: [], affidavitIds: [] });
      setSelectedAffidavits([]);
      setAffSearch('');
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Marriage Registration</div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'calc' ? 'active' : ''}`} onClick={() => setTab('calc')}>Price calculator</button>
        <button className={`tab ${tab === 'add'  ? 'active' : ''}`} onClick={() => setTab('add')}>Add record</button>
      </div>

      {/* ── Calculator tab ── */}
      {tab === 'calc' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Calculate charge</div>
          <div className="section-label">Services</div>
          {SERVICES.map((s) => (
            <div className="checkbox-row" key={s.key}>
              <input
                type="checkbox"
                id={`calc-${s.key}`}
                checked={calcServices.includes(s.key)}
                onChange={(e) =>
                  setCalcServices(e.target.checked
                    ? [...calcServices, s.key]
                    : calcServices.filter((x) => x !== s.key))
                }
              />
              <label htmlFor={`calc-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                {s.key} (₹{s.cost})
              </label>
            </div>
          ))}
          {calcServicesTotal > 0 && (
            <div className="price-box">
              {SERVICES.filter((s) => calcServices.includes(s.key)).map((s) => (
                <div className="price-row" key={s.key}><span>{s.key}</span><span>₹{s.cost}</span></div>
              ))}
              <div className="price-total">
                <span className="price-total-label">Services total</span>
                <span className="price-total-value">₹{calcServicesTotal}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                + linked affidavits amount will be added separately
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add record tab ── */}
      {tab === 'add' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New marriage registration record</div>
          {mutation.isSuccess && savedRecord && (
            <div className="alert-success" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Record saved successfully!</span>
              <button className="btn btn-sm" onClick={handlePrint}>🖨 Print receipt</button>
            </div>
          )}
          {mutation.isError && <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>}

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div className="section-label">Contact details</div>
            <div className="grid-2">
              <div className="form-group"><label>Primary contact name *</label><input {...register('contactName', { required: true })} placeholder="Bride or groom" /></div>
              <div className="form-group"><label>Phone number *</label><input {...register('phone', { required: true })} placeholder="10-digit mobile" /></div>
            </div>
            <div className="form-group"><label>Email</label><input type="email" {...register('contactEmail')} placeholder="Contact email address" /></div>
            <div className="form-group"><label>Address</label><input {...register('address')} placeholder="Full address" /></div>

            <div className="section-label">Marriage details</div>
            <div className="grid-2">
              <div className="form-group"><label>Spouse 1 name *</label><input {...register('spouse1Name', { required: true })} /></div>
              <div className="form-group"><label>Spouse 2 name *</label><input {...register('spouse2Name', { required: true })} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Marriage act *</label>
                <select {...register('marriageAct', { required: true })}>
                  <option value="">Select act</option>
                  <option value="Hindu Marriage Act">Hindu Marriage Act</option>
                  <option value="Muslim Personal Law (Shariat)">Muslim Personal Law (Shariat)</option>
                  <option value="Indian Christian Marriage Act">Indian Christian Marriage Act</option>
                </select>
              </div>
              <div className="form-group"><label>Date of marriage *</label><input type="date" {...register('marriageDate', { required: true })} /></div>
            </div>
            <div className="form-group"><label>Place of marriage</label><input {...register('marriagePlace')} placeholder="Venue / city" /></div>
            <div className="grid-3">
              <div className="form-group"><label>Witness 1 name</label><input {...register('witness1Name')} /></div>
              <div className="form-group"><label>Witness 2 name</label><input {...register('witness2Name')} /></div>
              <div className="form-group"><label>Witness 3 name</label><input {...register('witness3Name')} /></div>
            </div>
            <div className="form-group"><label>Priest / officiant details</label><input {...register('priestDetails')} placeholder="Name, designation" /></div>
            <div className="form-group"><label>Date of our service *</label><input type="date" {...register('dateOfService', { required: true })} max={today} /></div>

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
                    const next = e.target.checked
                      ? [...watchSvcs, s.key]
                      : watchSvcs.filter((x) => x !== s.key);
                    setValue('servicesProvided', next);
                    recalc(next);
                  }}
                />
                <label htmlFor={`f-${s.key}`} style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                  {s.key} (₹{s.cost})
                </label>
              </div>
            ))}

            <hr className="divider" />
            <div className="section-label">Link affidavit records</div>
            
            {/* Display list of selected/linked affidavits */}
            {selectedAffidavits.map((aff) => (
              <div key={aff.id} style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 8,
                background: 'var(--bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <div style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {aff.customerName} — {aff.phone}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {aff.purpose} · {PAPER_LABELS[aff.paperType]} · {AUTH_LABELS[aff.authorizerType]}
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: 4 }}>
                    ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => unlinkAffidavit(aff.id)}
                  style={{ flexShrink: 0 }}
                >✕ Unlink</button>
              </div>
            ))}

            {/* Always visible Search Dropdown to add more affidavits */}
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
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  maxHeight: 220,
                  overflowY: 'auto',
                  marginTop: 4,
                }}>
                  {affidavitResults.map((aff) => {
                    const isLinked = selectedAffidavits.some((x) => x.id === aff.id);
                    return (
                      <div
                        key={aff.id}
                        onClick={() => !isLinked && selectAffSimple(aff)}
                        style={{
                          padding: '10px 14px',
                          cursor: isLinked ? 'not-allowed' : 'pointer',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 13,
                          transition: 'background 0.15s',
                          opacity: isLinked ? 0.5 : 1,
                          background: isLinked ? 'var(--bg)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isLinked) e.currentTarget.style.background = 'var(--bg, #f5f5f5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isLinked) e.currentTarget.style.background = 'transparent';
                        }}
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
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'var(--card-bg, #fff)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                }}>
                  No affidavit records found.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Amount charged (₹) *</label>
              <input type="number" {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })} placeholder="Auto-calculated, can edit" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save record'}
              </button>
              <button type="button" className="btn" onClick={() => { reset({ dateOfService: today, servicesProvided: [], affidavitIds: [] }); setSelectedAffidavits([]); }}>Clear</button>
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

  // Helper helper simple function inside or outside component, let's keep it accessible
  function selectAffSimple(aff: Affidavit) {
    selectAffidavitsList(aff);
  }

  function selectAffidavitsList(aff: Affidavit) {
    const updated = [...selectedAffidavits, aff];
    setSelectedAffidavits(updated);
    setValue('affidavitIds', updated.map((x) => x.id));
    setAffSearch('');
    setShowAffDropdown(false);
    recalc(undefined, updated);
  }
}
