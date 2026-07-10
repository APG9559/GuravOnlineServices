import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { shopActLicensesApi } from '@/api';
import { ShopActLicense } from '@/types';
import { usePricing } from '@/hooks/usePricing';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import { ShopActLicenseReceipt } from '@/components/ReceiptModal/Receipt';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  businessName: string;
  email: string;
  dateOfService: string;
  amountCharged: number;
}

export default function ShopActLicensesPage() {
  const [savedRecord, setSavedRecord] = useState<ShopActLicense | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const defaultFormValues = (): FormValues => ({
    customerName: '',
    phone: '',
    businessName: '',
    email: '',
    dateOfService: today,
    amountCharged: pricing.shop_act_license_fee ?? 500,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dateOfService: today,
      amountCharged: pricing.shop_act_license_fee ?? 500,
    },
  });

  const phoneWatch = watch('phone');

  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(
    phoneWatch,
    (customer) => {
      setValue('customerName', customer.name);
      if (customer.email) setValue('email', customer.email);
    }
  );

  useEffect(() => {
    setValue('amountCharged', pricing.shop_act_license_fee ?? 500);
  }, [pricing.shop_act_license_fee, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => shopActLicensesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shop-act-licenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      resetIndicator();
      reset(defaultFormValues());
    },
  });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Shop Act License</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New Shop Act License record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="grid-2">
            <div className="form-group">
              <label>Customer name *</label>
              <input
                {...register('customerName', { required: true })}
                placeholder="Owner / applicant name"
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

          <div className="form-group">
            <label>Business name *</label>
            <input
              {...register('businessName', { required: true })}
              placeholder="Registered name of the shop / business"
            />
            {errors.businessName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="business@example.com (optional)"
              />
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

          {/* Fee hint */}
          <div className="price-box" style={{ marginBottom: 14 }}>
            <div className="price-row">
              <span>Standard Shop Act License fee</span>
              <span style={{ fontWeight: 500 }}>₹{pricing.shop_act_license_fee ?? 500}</span>
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
                resetIndicator();
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Shop Act License Saved!</h3>
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
          <ShopActLicenseReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
