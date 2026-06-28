import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { voterCardsApi, customersApi } from '@/api';
import { VoterCardRecord } from '@/types';
import { usePricing } from '@/hooks/usePricing';
import { VoterCardReceipt } from '@/components/ReceiptModal/Receipt';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  applicationType: 'New' | 'Correction' | 'Name Deletion' | 'Address Change';
  epicNo?: string;
  tokenNo?: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
}

export default function VoterCardsPage() {
  const [savedRecord, setSavedRecord] = useState<VoterCardRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

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
      applicationType: 'New',
      dateOfService: today,
      epicNo: '',
      tokenNo: '',
      officialFee: 200,
      serviceFee: 0,
      amountCharged: 200,
    },
  });

  const applicationTypeWatch = watch('applicationType');
  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  // Determine pricing key based on type
  const pricingKey =
    applicationTypeWatch === 'New'
      ? 'csc_voter_card_new_fee'
      : applicationTypeWatch === 'Correction'
        ? 'csc_voter_card_correction_fee'
        : applicationTypeWatch === 'Name Deletion'
          ? 'csc_voter_card_name_deletion_fee'
          : 'csc_voter_card_address_change_fee';

  const defaultFee = pricing[pricingKey] ?? (applicationTypeWatch === 'New' ? 200 : 150);

  // Set official fee default when type changes
  useEffect(() => {
    setValue('officialFee', defaultFee);
    setValue('serviceFee', 0);
  }, [defaultFee, setValue]);

  // Recalculate amountCharged as officialFee + serviceFee
  useEffect(() => {
    setValue('amountCharged', Number(officialFeeWatch) + Number(serviceFeeWatch));
  }, [officialFeeWatch, serviceFeeWatch, setValue]);

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
        .catch(() => { });
    }
  }, [phoneWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Clean up fields based on applicationType
      const payload = { ...data };
      if (payload.applicationType === 'New') {
        payload.epicNo = undefined;
      } else {
        payload.tokenNo = undefined;
      }
      return voterCardsApi.create(payload).then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['voter-cards'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      reset({
        customerName: '',
        phone: '',
        applicationType: 'New',
        epicNo: '',
        tokenNo: '',
        dateOfService: today,
        officialFee: pricing.csc_voter_card_new_fee ?? 200,
        serviceFee: 0,
        amountCharged: pricing.csc_voter_card_new_fee ?? 200,
      });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Voter Card Service</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New Voter Card Record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="form-group">
            <label>Application Type *</label>
            <Controller
              control={control}
              name="applicationType"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoSelect
                  value={value}
                  onChange={onChange}
                  options={[
                    { value: 'New', label: `New Voter Card (₹${pricing.csc_voter_card_new_fee ?? 200})` },
                    { value: 'Correction', label: `Voter Card Correction (₹${pricing.csc_voter_card_correction_fee ?? 150})` },
                    { value: 'Name Deletion', label: `Name Deletion (₹${pricing.csc_voter_card_name_deletion_fee ?? 150})` },
                    { value: 'Address Change', label: `Address Change (₹${pricing.csc_voter_card_address_change_fee ?? 150})` },
                  ]}
                  placeholder="Select Application Type"
                />
              )}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Customer name *</label>
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
              <label>Mobile number *</label>
              <input
                {...register('phone', { required: true })}
                placeholder="10-digit mobile"
              />
              {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
          </div>

          <div className="grid-2">
            {applicationTypeWatch === 'New' ? (
              <div className="form-group">
                <label>Token No. *</label>
                <input
                  {...register('tokenNo', { required: true })}
                  placeholder="Enter Token Number"
                />
                {errors.tokenNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
            ) : (
              <div className="form-group">
                <label>EPIC No. *</label>
                <input
                  {...register('epicNo', { required: true })}
                  placeholder="Enter EPIC Number"
                />
                {errors.epicNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
            )}
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

          <div className="price-box" style={{ marginBottom: 14 }}>
            <div className="price-row">
              <span>Standard fee for Voter Card {applicationTypeWatch}</span>
              <span style={{ fontWeight: 500 }}>₹{defaultFee}</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Official Fee (₹) *</label>
              <input
                type="number"
                {...register('officialFee', { required: true, min: 0, valueAsNumber: true })}
                placeholder="e.g. Government fee"
              />
            </div>
            <div className="form-group">
              <label>Service Fee (₹) *</label>
              <input
                type="number"
                {...register('serviceFee', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Our service charge"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Total Fee Charged (₹) *</label>
            <input
              type="number"
              readOnly
              {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
              placeholder="Auto-calculated (Official + Service)"
              style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save record'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => reset({
                customerName: '',
                phone: '',
                applicationType: 'New',
                epicNo: '',
                tokenNo: '',
                dateOfService: today,
                officialFee: pricing.csc_voter_card_new_fee ?? 200,
                serviceFee: 0,
                amountCharged: pricing.csc_voter_card_new_fee ?? 200,
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Voter Card Record Saved!</h3>
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
          <VoterCardReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
