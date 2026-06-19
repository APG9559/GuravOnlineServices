import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { affidavitsApi, customersApi } from '@/api';
import { PaperType, AuthorizerType, PAPER_LABELS, AUTH_LABELS, Affidavit } from '@/types';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';
import { AffidavitReceipt } from '@/components/ReceiptModal/Receipt';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  purpose: string;
  paperType: PaperType;
  authorizerType: AuthorizerType;
  authorizerName: string;
  dateOfService: string;
  amountCharged: number;
  notaryPublicFee?: number;
  remark?: string;
  customerBroughtStamp?: 'Yes' | 'No';
}

export default function AffidavitsPage() {
  const [savedRecord, setSavedRecord] = useState<Affidavit | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { dateOfService: today },
  });

  const paperWatch = watch('paperType');
  const authWatch = watch('authorizerType');
  const phoneWatch = watch('phone');
  const amountChargedWatch = watch('amountCharged');
  const customerBroughtStampWatch = watch('customerBroughtStamp');
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    if (phoneWatch && /^[6-9]\d{9}$/.test(phoneWatch)) {
      customersApi.lookup(phoneWatch)
        .then((res) => {
          if (res.data) {
            setValue('customerName', res.data.name);
            setShowAutoFillIndicator(true);
            setTimeout(() => setShowAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => {});
    }
  }, [phoneWatch, setValue]);

  useEffect(() => {
    if (paperWatch === 'stamp500') {
      setValue('customerBroughtStamp', 'No');
    } else {
      setValue('customerBroughtStamp', undefined);
    }
  }, [paperWatch, setValue]);

  const formCalc =
    paperWatch && authWatch
      ? (() => {
          const res = calcAffidavitTotal(paperWatch, authWatch, pricing);
          if (paperWatch === 'stamp500' && customerBroughtStampWatch === 'Yes') {
            return {
              ...res,
              paperCost: 0,
              total: res.authFee,
            };
          }
          return res;
        })()
      : null;

  const isDiscounted = !!formCalc && amountChargedWatch !== undefined && Number(amountChargedWatch) < formCalc.total;

  useEffect(() => {
    if (formCalc) {
      setValue('amountCharged', formCalc.total);
    }
  }, [formCalc?.total, setValue]);

  useEffect(() => {
    if (!isDiscounted) {
      setValue('remark', '');
    }
  }, [isDiscounted, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        customerBroughtStamp: data.customerBroughtStamp === 'Yes',
      };
      return affidavitsApi.create(payload as any).then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['affidavits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      setShowAutoFillIndicator(false);
      reset({
        customerName: '',
        phone: '',
        purpose: '',
        paperType: '' as any,
        authorizerType: '' as any,
        authorizerName: '',
        dateOfService: today,
        amountCharged: 0,
        notaryPublicFee: undefined,
        remark: '',
        customerBroughtStamp: undefined,
      });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Affidavit / Notary</div>
      </div>

      {/* ── Add record form ── */}
      <div className="card" style={{ maxWidth: 600, marginTop: '1.5rem' }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New affidavit record</div>
          {mutation.isError && (
            <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
          )}
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <div className="grid-2">
              <div className="form-group">
                <label>Customer name *</label>
                <input {...register('customerName', { required: true })} placeholder="Full name" />
                {errors.customerName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
                {showAutoFillIndicator && (
                  <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled from customer profile</span>
                )}
              </div>
              <div className="form-group">
                <label>Phone number *</label>
                <input {...register('phone', { required: true })} placeholder="10-digit mobile" />
                {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Affidavit purpose / type *</label>
              <input {...register('purpose', { required: true })} placeholder="e.g. Name correction, Income proof, Residence proof" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Paper type *</label>
                <Controller
                  control={control}
                  name="paperType"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value || ''}
                      onChange={onChange}
                      options={[
                        { value: 'stamp500', label: `₹${pricing.stamp500_cost} Stamp Paper` },
                        { value: 'Plain', label: 'Plain Paper' }
                      ]}
                      placeholder="Select"
                    />
                  )}
                />
              </div>
              <div className="form-group">
                <label>Authorized by *</label>
                <Controller
                  control={control}
                  name="authorizerType"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value || ''}
                      onChange={onChange}
                      options={[
                        { value: 'magistrate', label: `Executive Magistrate (₹${pricing.magistrate_fee})` },
                        { value: 'Notary', label: `Notary Public (₹${pricing.notary_fee})` }
                      ]}
                      placeholder="Select"
                    />
                  )}
                />
              </div>
            </div>

            {paperWatch === 'stamp500' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Customer brought stamp or was it ours? *</label>
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      value="Yes"
                      {...register('customerBroughtStamp', { required: paperWatch === 'stamp500' })}
                    />
                    Customer brought stamp (excludes stamp cost)
                  </label>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                    <input
                      type="radio"
                      value="No"
                      {...register('customerBroughtStamp', { required: paperWatch === 'stamp500' })}
                    />
                    Ours
                  </label>
                </div>
                {errors.customerBroughtStamp && (
                  <span style={{ color: 'var(--danger)', fontSize: 12, display: 'block', marginTop: 4 }}>Required</span>
                )}
              </div>
            )}

            {authWatch === 'Notary' && (
              <div className="form-group">
                <label>Notary Public fee to deduct (₹) *</label>
                <input
                  type="number"
                  {...register('notaryPublicFee', { required: authWatch === 'Notary', min: 0, valueAsNumber: true })}
                  placeholder="Amount paid to Notary Public"
                />
                {errors.notaryPublicFee && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required for Notary records</span>}
              </div>
            )}
            <div className="grid-2">
              <div className="form-group">
                <label>Authorizer name</label>
                <input {...register('authorizerName')} placeholder="Name of magistrate or notary" />
              </div>
              <div className="form-group">
                <label>Date of service *</label>
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
            </div>

            {/* Calculations Breakdown */}
            {formCalc && (
              <div className="price-box" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {formCalc.paperCost > 0 && (
                    <div className="price-row">
                      <span>Stamp paper cost</span>
                      <span>₹{formCalc.paperCost}</span>
                    </div>
                  )}
                  <div className="price-row">
                    <span>{authWatch === 'magistrate' ? 'Executive Magistrate' : 'Notary Public'} Fee</span>
                    <span>₹{formCalc.authFee}</span>
                  </div>
                  <div className="divider" style={{ margin: '8px 0' }} />
                  <div className="price-row" style={{ fontWeight: 700, fontSize: 15 }}>
                    <span>Calculated Total</span>
                    <span>₹{formCalc.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Charged Input */}
            <div className="form-group">
              <label>Amount charged (₹) *</label>
              <input
                type="number"
                {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Standard fee auto-filled"
              />
            </div>

            {/* Remark field for discounts */}
            {isDiscounted && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
                <label style={{ color: 'var(--danger)', fontWeight: 700 }}>Reason for discount (Remark) *</label>
                <input
                  {...register('remark', { required: isDiscounted })}
                  placeholder="e.g. Regular customer, special request"
                  style={{ borderColor: 'var(--danger)' }}
                />
                {errors.remark && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required for discounted rates</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save record'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowAutoFillIndicator(false);
                  reset({
                    customerName: '',
                    phone: '',
                    purpose: '',
                    paperType: '' as any,
                    authorizerType: '' as any,
                    authorizerName: '',
                    dateOfService: today,
                    amountCharged: 0,
                    notaryPublicFee: undefined,
                    remark: '',
                    customerBroughtStamp: undefined,
                  });
                }}
              >
                Clear
              </button>
            </div>
          </form>
      </div>

      {/* Success Modal Popup */}
      {showSuccessModal && savedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Affidavit Saved!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Record for {savedRecord.customerName} has been stored successfully.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { handlePrint(); setShowSuccessModal(false); }}>
                🖨 Print Receipt
              </button>
              <button className="btn" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <AffidavitReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
