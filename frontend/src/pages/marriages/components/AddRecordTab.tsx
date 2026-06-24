import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marriagesApi, customersApi, affidavitsApi } from '@/api';
import { MarriageTicket, Marriage, MarriageAct, Affidavit, PaperType, AuthorizerType, PAPER_LABELS, AUTH_LABELS } from '@/types';
import { getTicketAffidavitPurposes, getTicketBreakdown } from '../helpers';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface RecordFormValues {
  contactName: string;
  phone: string;
  contactEmail: string;
  address: string;
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
  ticketId?: string;
}

interface AddRecordTabProps {
  prefillTicket: MarriageTicket | null;
  onClearPrefill: () => void;
  onSaveSuccess: (record: Marriage) => void;
  pricing: Record<string, number>;
  servicesDef: { key: string; cost: number }[];
}

export default function AddRecordTab({
  prefillTicket,
  onClearPrefill,
  onSaveSuccess,
  pricing,
  servicesDef,
}: AddRecordTabProps) {
  const qc = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  const [selectedAffidavits, setSelectedAffidavits] = useState<Affidavit[]>([]);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDropdown, setShowAffDropdown] = useState(false);
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<RecordFormValues>({
    defaultValues: { dateOfService: today, servicesProvided: ['Misc (Form, Xerox Copies)'], affidavitIds: [], affidavitDates: {}, isPrimaryContactSpouse: true, primaryContactSpouseType: 'husband' },
  });

  const requiredAffidavitPurposes = prefillTicket ? getTicketAffidavitPurposes(prefillTicket) : [];
  const isAffidavitDateRequired = requiredAffidavitPurposes.length > 0;
  const watchAffidavitDates = watch('affidavitDates') || {};
  const hasAllAffidavitDates = !isAffidavitDateRequired || requiredAffidavitPurposes.every(p => !!watchAffidavitDates[p]);

  const watchSvcs = watch('servicesProvided') || [];
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
      let finalSvcs = includeConsultancy && !ticketSvcs.includes('Marriage Consultancy Fee')
        ? [...ticketSvcs, 'Marriage Consultancy Fee']
        : ticketSvcs;

      if (!finalSvcs.includes('Misc (Form, Xerox Copies)')) {
        finalSvcs = [...finalSvcs, 'Misc (Form, Xerox Copies)'];
      }

      setValue('servicesProvided', finalSvcs);
      setValue('amountCharged', Number(prefillTicket.amountCharged));
      setValue('ticketId', prefillTicket.id);
      setValue('dateOfService', today);
    }
  }, [prefillTicket, setValue, today]);

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
    if (svcs.includes('Marriage Consultancy Fee')) total += pricing.marriage_consultancy_fee ?? 500;
    if (includeOfficialFee) total += officialFeeAmount;
    if (includeCourtFeeTickets) total += pricing.marriage_court_fee_tickets ?? 110;
    total += totalAffAmount;
    setValue('amountCharged', total);
  }, [watchSvcs, totalAffAmount, pricing, setValue, prefillTicket, includeOfficialFee, officialFeeAmount, includeCourtFeeTickets]);

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
        ticketId: '',
      });
      setSelectedAffidavits([]);
      setAffSearch('');
    },
  });

  return (
    <div className="card" style={{ maxWidth: 680 }}>
      <div style={{ fontWeight: 500, marginBottom: '1rem' }}>
        {prefillTicket ? `Complete Record — ${prefillTicket.ticketNumber}` : 'New marriage registration record'}
      </div>

      {saveMutation.isError && <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>}

      {/* Ticket price breakdown (read-only) */}
      {prefillTicket && (
        <div className="price-box" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>Estimation breakdown (from ticket)</div>
          {getTicketBreakdown(prefillTicket, pricing, servicesDef).map((item, i) => (
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

      <form onSubmit={handleSubmit((d) => {
        if (requiredAffidavitPurposes.length > 0) {
          const dates = d.affidavitDates || {};
          const missing = requiredAffidavitPurposes.filter(p => !dates[p]);
          if (missing.length > 0) return;
        }

        const payload = {
          ...d,
          officialFee: prefillTicket
            ? (prefillTicket.questionnaireData?.officialFee?.included
                ? Number(prefillTicket.questionnaireData?.officialFee?.amountCharged || 0)
                : 0)
            : (includeOfficialFee ? officialFeeAmount : 0),
          courtFeeTickets: prefillTicket
            ? (prefillTicket.questionnaireData?.courtFeeTickets?.included
                ? Number(prefillTicket.questionnaireData?.courtFeeTickets?.amountCharged || 0)
                : 0)
            : (includeCourtFeeTickets ? (pricing.marriage_court_fee_tickets ?? 110) : 0),
        };

        saveMutation.mutate(payload);
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
          <div className="form-group"><label>Phone number *</label><input {...register('phone', { required: true })} placeholder="10-digit mobile" /></div>
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
        <div className="form-group"><label>Place of marriage</label><input {...register('marriagePlace')} placeholder="Venue / city" /></div>
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
            <div className="section-label" style={{ marginTop: 12 }}>Affidavit Execution Dates *</div>
            {requiredAffidavitPurposes.map((purpose) => (
              <div className="form-group" key={purpose} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13 }}>{purpose} *</label>
                <NeoDatePicker
                  value={watchAffidavitDates[purpose] || ''}
                  onChange={(val) => {
                    const updated = { ...watchAffidavitDates, [purpose]: val };
                    setValue('affidavitDates', updated, { shouldValidate: true });
                  }}
                  max={today}
                />
                {!watchAffidavitDates[purpose] && (
                  <span style={{ color: 'var(--danger)', fontSize: 11, display: 'block', marginTop: 4 }}>
                    ⚠ Required — date when this affidavit was executed
                  </span>
                )}
              </div>
            ))}
          </>
        )}

        {/* Services (only for non-ticket forms) */}
        {!prefillTicket && (
          <>
            <hr className="divider" />
            <div className="section-label">Services provided</div>
            {servicesDef.map((s) => (
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
            <div className="checkbox-row" key="consultancy">
              <input
                type="checkbox"
                id="f-consultancy"
                checked={watchSvcs.includes('Marriage Consultancy Fee')}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...watchSvcs, 'Marriage Consultancy Fee']
                    : watchSvcs.filter((x) => x !== 'Marriage Consultancy Fee');
                  setValue('servicesProvided', next);
                }}
              />
              <label htmlFor="f-consultancy" style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>
                Marriage Consultancy Fee (₹{pricing.marriage_consultancy_fee ?? 500})
              </label>
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
          <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending || !hasAllAffidavitDates}>
            {saveMutation.isPending ? 'Saving…' : 'Save record'}
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
              ticketId: '',
            });
            setSelectedAffidavits([]);
            onClearPrefill();
          }}>Clear</button>
        </div>
      </form>
    </div>
  );
}
