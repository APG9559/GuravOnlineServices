import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { propertyCardsApi, customersApi } from '../api';
import { PropertyCard, PropertyCardType } from '../types';
import { usePricing } from '../hooks/usePricing';
import { PropertyCardReceipt } from '../components/ReceiptModal/Receipt';
import NeoDatePicker from '../components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  recordType: PropertyCardType;
  propertyNumber: string;
  dateOfService: string;
  amountCharged: number;
}

export default function PropertyCardsPage() {
  const [savedRecord, setSavedRecord] = useState<PropertyCard | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const defaultFormValues = (): FormValues => ({
    customerName: '',
    phone: '',
    recordType: 'Property Card',
    propertyNumber: '',
    dateOfService: today,
    amountCharged: pricing.property_card_fee ?? 100,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      recordType: 'Property Card',
      dateOfService: today,
    },
  });

  const selectedType = watch('recordType');
  const phoneWatch = watch('phone');
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    if (phoneWatch && /^\+?[0-9]{7,15}$/.test(phoneWatch)) {
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

  const feeTotal = selectedType === 'Property Card'
    ? (pricing.property_card_fee ?? 100)
    : selectedType === '7/12 Card'
    ? (pricing.seven_twelve_fee ?? 100)
    : (pricing.eight_a_fee ?? 100);

  useEffect(() => {
    setValue('amountCharged', feeTotal);
  }, [feeTotal, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => propertyCardsApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['property-cards'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      setShowAutoFillIndicator(false);
      reset(defaultFormValues());
    },
  });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Property Card</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New property card record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* Record type — radio buttons like BirthDeath pattern */}
          <div className="form-group">
            <label>Record type *</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              {(['Property Card', '7/12 Card', '8A'] as PropertyCardType[]).map((type) => (
                <label
                  key={type}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', color: 'var(--text)', fontSize: 14 }}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('recordType', { required: true })}
                  />
                  {type}
                </label>
              ))}
            </div>
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
              <label>Mobile number</label>
              <input
                {...register('phone', { required: false })}
                placeholder="Mobile number"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Property number *</label>
              <input
                {...register('propertyNumber', { required: true })}
                placeholder={selectedType === 'Property Card' ? 'e.g. KMC/12345' : selectedType === '7/12 Card' ? 'e.g. 7/12-456/A' : 'e.g. 8A-789/B'}
              />
              {errors.propertyNumber && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
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

          {/* Fee hint based on pricing */}
          <div className="price-box" style={{ marginBottom: 14 }}>
            <div className="price-row">
              <span>Standard fee for {selectedType}</span>
              <span style={{ fontWeight: 500 }}>
                ₹{selectedType === 'Property Card'
                  ? (pricing.property_card_fee ?? 100)
                  : selectedType === '7/12 Card'
                  ? (pricing.seven_twelve_fee ?? 100)
                  : (pricing.eight_a_fee ?? 100)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Fee charged (₹) *</label>
            <input
              type="number"
              {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
              placeholder="Auto-filled from settings, can edit"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save record'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowAutoFillIndicator(false);
                reset(defaultFormValues());
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Property Card Saved!</h3>
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
          <PropertyCardReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}