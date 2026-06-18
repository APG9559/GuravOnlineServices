import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { shopActLicensesApi, customersApi } from '@/api';
import { ShopActLicense } from '@/types';
import { usePricing } from '@/hooks/usePricing';
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
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

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
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  useEffect(() => {
    setValue('amountCharged', pricing.shop_act_license_fee ?? 500);
  }, [pricing.shop_act_license_fee, setValue]);

  useEffect(() => {
    if (phoneWatch && /^[6-9]\d{9}$/.test(phoneWatch)) {
      customersApi.lookup(phoneWatch)
        .then((res) => {
          if (res.data) {
            setValue('customerName', res.data.name);
            if (res.data.email) setValue('email', res.data.email);
            setShowAutoFillIndicator(true);
            setTimeout(() => setShowAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => {});
    }
  }, [phoneWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => shopActLicensesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shop-act-licenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      reset({ dateOfService: today, amountCharged: pricing.shop_act_license_fee ?? 500 });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Shop Act License</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New Shop Act License record</div>

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
              <label>Mobile number *</label>
              <input
                {...register('phone', { required: true })}
                placeholder="10-digit mobile"
              />
              {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
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
              onClick={() => reset({ dateOfService: today, amountCharged: pricing.shop_act_license_fee ?? 500 })}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ShopActLicenseReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
