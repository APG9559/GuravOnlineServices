import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { panCardsApi } from '@/api';
import { PanCardRecord } from '@/types';
import { usePricing } from '@/hooks/usePricing';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';

interface FormValues {
  customerName: string;
  phone: string;
  applicationType: 'New' | 'Correction' | 'Reprint';
  ackNo: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;
}

interface PanCardFormProps {
  onSaveSuccess: (record: PanCardRecord) => void;
}

export default function PanCardForm({ onSaveSuccess }: PanCardFormProps) {
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
      ackNo: '',
      officialFee: 200,
      serviceFee: 0,
      amountCharged: 200,
    },
  });

  const applicationTypeWatch = watch('applicationType');
  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;

  const pricingKey =
    applicationTypeWatch === 'New'
      ? 'csc_pan_card_new_fee'
      : applicationTypeWatch === 'Correction'
        ? 'csc_pan_card_correction_fee'
        : 'csc_pan_card_reprint_fee';

  const defaultFee =
    pricing[pricingKey] ??
    (applicationTypeWatch === 'New' ? 200 : applicationTypeWatch === 'Correction' ? 150 : 120);

  useEffect(() => {
    setValue('officialFee', defaultFee);
    setValue('serviceFee', 0);
  }, [defaultFee, setValue]);

  useEffect(() => {
    setValue('amountCharged', Number(officialFeeWatch) + Number(serviceFeeWatch));
  }, [officialFeeWatch, serviceFeeWatch, setValue]);

  const { showAutoFillIndicator } = useCustomerLookup(phoneWatch, (data) =>
    setValue('customerName', data.name),
  );

  const mutation = useMutation({
    mutationFn: (data: FormValues) => panCardsApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pan-cards'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSaveSuccess(data);
      reset({
        customerName: '',
        phone: '',
        applicationType: 'New',
        ackNo: '',
        dateOfService: today,
        officialFee: pricing.csc_pan_card_new_fee ?? 200,
        serviceFee: 0,
        amountCharged: pricing.csc_pan_card_new_fee ?? 200,
      });
    },
  });

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New PAN Card Record</div>

      {mutation.isError && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          Failed to save. Please try again.
        </div>
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
                  { value: 'New', label: `New PAN Card (₹${pricing.csc_pan_card_new_fee ?? 200})` },
                  {
                    value: 'Correction',
                    label: `PAN Card Correction (₹${pricing.csc_pan_card_correction_fee ?? 150})`,
                  },
                  {
                    value: 'Reprint',
                    label: `PAN Reprint (₹${pricing.csc_pan_card_reprint_fee ?? 120})`,
                  },
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
            {errors.customerName && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
            )}
            {showAutoFillIndicator && (
              <span
                style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}
              >
                ✓ Auto-filled from customer profile
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Mobile number</label>
            <input {...register('phone', { required: false })} placeholder="Mobile number" />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Acknowledgement No.</label>
            <input {...register('ackNo')} placeholder="e.g. 88106xxxxxxxxxx (optional)" />
          </div>
          <div className="form-group">
            <label>Date of service *</label>
            <Controller
              control={control}
              name="dateOfService"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoDatePicker value={value} onChange={onChange} max={today} />
              )}
            />
          </div>
        </div>

        <div className="price-box" style={{ marginBottom: 14 }}>
          <div className="price-row">
            <span>Standard fee for PAN {applicationTypeWatch}</span>
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
            style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save record'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() =>
              reset({
                customerName: '',
                phone: '',
                applicationType: 'New',
                ackNo: '',
                dateOfService: today,
                officialFee: pricing.csc_pan_card_new_fee ?? 200,
                serviceFee: 0,
                amountCharged: pricing.csc_pan_card_new_fee ?? 200,
              })
            }
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
