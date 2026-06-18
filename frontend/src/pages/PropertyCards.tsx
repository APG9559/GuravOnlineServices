import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { propertyCardsApi, customersApi } from '../api';
import { PropertyCard, PropertyCardType } from '../types';
import { usePricing } from '../hooks/usePricing';
import { PropertyCardReceipt } from '../components/ReceiptModal/Receipt';

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
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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

  const feeTotal = selectedType === 'Property Card'
    ? (pricing.property_card_fee ?? 100)
    : (pricing.seven_twelve_fee ?? 100);

  useEffect(() => {
    setValue('amountCharged', feeTotal);
  }, [feeTotal, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => propertyCardsApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['property-cards'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      reset({ recordType: 'Property Card', dateOfService: today });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Property Card</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New property card record</div>

        {mutation.isSuccess && savedRecord && (
          <div
            className="alert-success"
            style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Record saved successfully!</span>
            <button className="btn btn-sm" onClick={handlePrint}>🖨 Print receipt</button>
          </div>
        )}
        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* Record type — radio buttons like BirthDeath pattern */}
          <div className="form-group">
            <label>Record type *</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              {(['Property Card', '7/12 Card'] as PropertyCardType[]).map((type) => (
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
              <label>Mobile number *</label>
              <input
                {...register('phone', { required: true })}
                placeholder="10-digit mobile"
              />
              {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Property number *</label>
              <input
                {...register('propertyNumber', { required: true })}
                placeholder={selectedType === 'Property Card' ? 'e.g. KMC/12345' : 'e.g. 7/12-456/A'}
              />
              {errors.propertyNumber && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
            <div className="form-group">
              <label>Date of service *</label>
              <input
                type="date"
                {...register('dateOfService', { required: true })}
                max={today}
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
                  : (pricing.seven_twelve_fee ?? 100)}
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
              onClick={() => reset({ recordType: 'Property Card', dateOfService: today })}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PropertyCardReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
