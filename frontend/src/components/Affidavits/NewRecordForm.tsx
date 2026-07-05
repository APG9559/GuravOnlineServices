import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { affidavitsApi } from '@/api';
import { PaperType, AuthorizerType, Affidavit } from '@/types';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  customerName: string;
  phone: string;
  purpose: string;
  affidavitNo?: string;
  paperType: PaperType;
  authorizerType: AuthorizerType;
  authorizerName: string;
  dateOfService: string;
  amountCharged: number;
  notaryPublicFee?: number;
  remark?: string;
  customerBroughtStamp?: 'Yes' | 'No';
}

interface NewRecordFormProps {
  onSaveSuccess: (record: Affidavit) => void;
}

const TODAY = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM: FormValues = {
  customerName: '',
  phone: '',
  purpose: '',
  affidavitNo: '',
  paperType: '' as any,
  authorizerType: '' as any,
  authorizerName: '',
  dateOfService: TODAY(),
  amountCharged: 0,
  notaryPublicFee: undefined,
  remark: '',
  customerBroughtStamp: undefined,
};

export default function NewRecordForm({ onSaveSuccess }: NewRecordFormProps) {
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = TODAY();

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: { ...EMPTY_FORM, dateOfService: today },
  });

  const paperWatch = watch('paperType');
  const authWatch = watch('authorizerType');
  const phoneWatch = watch('phone');
  const amountChargedWatch = watch('amountCharged');
  const customerBroughtStampWatch = watch('customerBroughtStamp');

  // ── Customer auto-fill ──
  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(
    phoneWatch,
    (name) => setValue('customerName', name),
  );

  // ── Stamp radio reset on paper type change ──
  useEffect(() => {
    if (paperWatch === 'stamp500') {
      setValue('customerBroughtStamp', 'No');
    } else {
      setValue('customerBroughtStamp', undefined);
    }
  }, [paperWatch, setValue]);

  // ── Price calculation ──
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

  // ── Mutation ──
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
      resetIndicator();
      onSaveSuccess(data);
      reset({ ...EMPTY_FORM, dateOfService: today });
    },
  });

  // ── Render ──
  return (
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
        <div className="form-group">
          <label>Affidavit No.</label>
          <input {...register('affidavitNo')} placeholder="e.g. 12345/2026 (Optional)" />
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
            <label>Stamp? *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 6 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  value="Yes"
                  {...register('customerBroughtStamp', { required: paperWatch === 'stamp500' })}
                />
                Without stamp
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  value="No"
                  {...register('customerBroughtStamp', { required: paperWatch === 'stamp500' })}
                />
                With Stamp
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save record'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              resetIndicator();
              reset({ ...EMPTY_FORM, dateOfService: today });
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
