import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { affidavitsApi, customersApi } from '@/api';
import { PaperType, AuthorizerType, PAPER_LABELS, AUTH_LABELS, Affidavit } from '@/types';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';
import { AffidavitReceipt } from '@/components/ReceiptModal/Receipt';

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
}

export default function AffidavitsPage() {
  const [tab, setTab] = useState<'calc' | 'add'>('calc');
  const [calcPaper, setCalcPaper] = useState<PaperType | ''>('');
  const [calcAuth, setCalcAuth] = useState<AuthorizerType | ''>('');
  const [savedRecord, setSavedRecord] = useState<Affidavit | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const calcResult =
    calcPaper && calcAuth
      ? calcAffidavitTotal(calcPaper, calcAuth, pricing)
      : null;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { dateOfService: today },
  });

  const paperWatch = watch('paperType');
  const authWatch = watch('authorizerType');
  const phoneWatch = watch('phone');
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
  const formCalc =
    paperWatch && authWatch
      ? calcAffidavitTotal(paperWatch, authWatch, pricing)
      : null;

  useEffect(() => {
    if (formCalc) {
      setValue('amountCharged', formCalc.total);
    }
  }, [formCalc?.total, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => affidavitsApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['affidavits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      reset({ dateOfService: today });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Affidavit / Notary</div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'calc' ? 'active' : ''}`} onClick={() => setTab('calc')}>Price calculator</button>
        <button className={`tab ${tab === 'add' ? 'active' : ''}`} onClick={() => setTab('add')}>Add record</button>
      </div>

      {/* ── Calculator tab ── */}
      {tab === 'calc' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Calculate charge</div>
          <div className="grid-2">
            <div className="form-group">
              <label>Paper type</label>
              <select value={calcPaper} onChange={(e) => setCalcPaper(e.target.value as PaperType)}>
                <option value="">Select</option>
                <option value="stamp500">₹{pricing.stamp500_cost} Stamp Paper</option>
                <option value="Plain">Plain Paper (₹{pricing.plain_cost})</option>
              </select>
            </div>
            <div className="form-group">
              <label>Authorized by</label>
              <select value={calcAuth} onChange={(e) => setCalcAuth(e.target.value as AuthorizerType)}>
                <option value="">Select</option>
                <option value="magistrate">Executive Magistrate (₹{pricing.magistrate_fee})</option>
                <option value="Notary">Notary Public (₹{pricing.notary_fee})</option>
              </select>
            </div>
          </div>
          {calcResult && (
            <div className="price-box">
              <div className="price-row">
                <span>Paper — {PAPER_LABELS[calcPaper as PaperType]}</span>
                <span>{calcResult.paperCost > 0 ? `₹${calcResult.paperCost}` : 'Included (₹0)'}</span>
              </div>
              <div className="price-row">
                <span>Service fee — {AUTH_LABELS[calcAuth as AuthorizerType]}</span>
                <span>₹{calcResult.authFee}</span>
              </div>
              <div className="price-total">
                <span className="price-total-label">Total to charge</span>
                <span className="price-total-value">₹{calcResult.total}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add record tab ── */}
      {tab === 'add' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New affidavit record</div>
          {mutation.isSuccess && savedRecord && (
            <div className="alert-success" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Record saved successfully!</span>
              <button className="btn btn-sm" onClick={handlePrint}>🖨 Print receipt</button>
            </div>
          )}
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
                <select {...register('paperType', { required: true })}>
                  <option value="">Select</option>
                  <option value="stamp500">₹{pricing.stamp500_cost} Stamp Paper</option>
                  <option value="Plain">Plain Paper</option>
                </select>
              </div>
              <div className="form-group">
                <label>Authorized by *</label>
                <select {...register('authorizerType', { required: true })}>
                  <option value="">Select</option>
                  <option value="magistrate">Executive Magistrate (₹{pricing.magistrate_fee})</option>
                  <option value="Notary">Notary Public (₹{pricing.notary_fee})</option>
                </select>
              </div>
            </div>
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
                <input type="date" {...register('dateOfService', { required: true })} max={today} />
              </div>
            </div>
            {formCalc && (
              <div className="price-box" style={{ marginBottom: 14 }}>
                <div className="price-row">
                  <span>Calculated amount</span>
                  <span style={{ fontWeight: 500, fontSize: 16 }}>₹{formCalc.total}</span>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Amount charged (₹) *</label>
              <input
                type="number"
                {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Auto-filled, can edit"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save record'}
              </button>
              <button type="button" className="btn" onClick={() => reset({ dateOfService: today })}>Clear</button>
            </div>
          </form>
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
