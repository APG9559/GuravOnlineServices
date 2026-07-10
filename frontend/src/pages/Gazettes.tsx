import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { gazettesApi } from '../api';
import { Gazette } from '../types';
import { usePricing } from '../hooks/usePricing';
import { useCustomerLookup } from '../hooks/useCustomerLookup';
import { GazetteReceipt } from '../components/ReceiptModal/Receipt';
import NeoDatePicker from '../components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  oldName: string;
  newName: string;
  reasonToChangeName: string;
  tokenNo?: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
}

export default function GazettesPage() {
  const [savedRecord, setSavedRecord] = useState<Gazette | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const defaultOfficialFee = pricing.gazette_official_fee ?? 500;
  const defaultServiceFee = pricing.gazette_service_fee ?? 150;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      customerName: '',
      phone: '',
      oldName: '',
      newName: '',
      reasonToChangeName: '',
      tokenNo: '',
      dateOfService: today,
      officialFee: defaultOfficialFee,
      serviceFee: defaultServiceFee,
      amountCharged: defaultOfficialFee + defaultServiceFee,
    },
  });

  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;

  const { showAutoFillIndicator } = useCustomerLookup(
    phoneWatch,
    (customer) => setValue('customerName', customer.name),
  );

  // Set default pricing once pricing is loaded
  useEffect(() => {
    if (pricing.gazette_official_fee !== undefined) {
      setValue('officialFee', Number(pricing.gazette_official_fee));
    }
    if (pricing.gazette_service_fee !== undefined) {
      setValue('serviceFee', Number(pricing.gazette_service_fee));
    }
  }, [pricing, setValue]);

  // Recalculate amountCharged as officialFee + serviceFee
  useEffect(() => {
    setValue('amountCharged', Number(officialFeeWatch) + Number(serviceFeeWatch));
  }, [officialFeeWatch, serviceFeeWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => gazettesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['gazettes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      reset({
        customerName: '',
        phone: '',
        oldName: '',
        newName: '',
        reasonToChangeName: '',
        tokenNo: '',
        dateOfService: today,
        officialFee: pricing.gazette_official_fee ?? 500,
        serviceFee: pricing.gazette_service_fee ?? 150,
        amountCharged: (pricing.gazette_official_fee ?? 500) + (pricing.gazette_service_fee ?? 150),
      });
    },
  });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Gazette Name Change</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New Gazette Record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="grid-2">
            <div className="form-group">
              <label>Applicant Name *</label>
              <input
                {...register('customerName', { required: true })}
                placeholder="Full name of applicant"
              />
              {errors.customerName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              {showAutoFillIndicator && (
                <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled from customer profile</span>
              )}
            </div>
            <div className="form-group">
              <label>Mobile No.</label>
              <input
                {...register('phone', { required: false, pattern: /^\+?[0-9]{7,15}$/ })}
                placeholder="Mobile number"
              />
              {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Enter a valid mobile number</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Old Name *</label>
              <input
                {...register('oldName', { required: true })}
                placeholder="Applicant's current/old name"
              />
              {errors.oldName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
            <div className="form-group">
              <label>New Name *</label>
              <input
                {...register('newName', { required: true })}
                placeholder="Requested new name"
              />
              {errors.newName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Reason to Change Name *</label>
            <textarea
              {...register('reasonToChangeName', { required: true })}
              placeholder="e.g. Spelling correction, marriage, etc."
              rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
            />
            {errors.reasonToChangeName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Token No. (Optional)</label>
              <input
                {...register('tokenNo')}
                placeholder="e.g. TOK123456"
              />
            </div>
            <div className="form-group">
              <label>Date of Service *</label>
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

          <div className="price-box" style={{ marginBottom: 14 }}>
            <div className="price-row">
              <span>Standard Official Fee</span>
              <span style={{ fontWeight: 500 }}>₹{pricing.gazette_official_fee ?? 500}</span>
            </div>
            <div className="price-row">
              <span>Standard Service Fee</span>
              <span style={{ fontWeight: 500 }}>₹{pricing.gazette_service_fee ?? 150}</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Official Fees (₹) *</label>
              <input
                type="number"
                {...register('officialFee', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Government charge"
              />
            </div>
            <div className="form-group">
              <label>Service Fee Charged (₹) *</label>
              <input
                type="number"
                {...register('serviceFee', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Our service charge"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Total (₹) *</label>
            <input
              type="number"
              readOnly
              {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
              placeholder="Auto-calculated (Official + Service)"
              style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save record'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => reset({
                customerName: '',
                phone: '',
                oldName: '',
                newName: '',
                reasonToChangeName: '',
                dateOfService: today,
                officialFee: pricing.gazette_official_fee ?? 500,
                serviceFee: pricing.gazette_service_fee ?? 150,
                amountCharged: (pricing.gazette_official_fee ?? 500) + (pricing.gazette_service_fee ?? 150),
              })}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Gazette Record Saved!</h3>
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
          <GazetteReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
