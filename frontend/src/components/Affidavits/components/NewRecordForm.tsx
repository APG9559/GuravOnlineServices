import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { affidavitsApi } from '@/api';
import { PaperType, AuthorizerType, Affidavit } from '@/types';
import { usePricing, calcAffidavitTotal } from '@/hooks/usePricing';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import { useCustomerNameSearch } from '@/hooks/useCustomerNameSearch';
import { createAffidavitSchema } from '@/utils/validation';
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
  paperType: '' as PaperType,
  authorizerType: '' as AuthorizerType,
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { ...EMPTY_FORM, dateOfService: today },
    resolver: zodResolver(createAffidavitSchema(pricing)),
    mode: 'onTouched',
  });

  const paperWatch = watch('paperType');
  const authWatch = watch('authorizerType');
  const phoneWatch = watch('phone');
  const customerNameWatch = watch('customerName');
  const amountChargedWatch = watch('amountCharged');
  const customerBroughtStampWatch = watch('customerBroughtStamp');

  // ── Customer auto-fill ──
  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(phoneWatch, (customer) =>
    setValue('customerName', customer.name, { shouldValidate: true }),
  );

  const { suggestions, setSuggestions } = useCustomerNameSearch(customerNameWatch);

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

  const isDiscounted =
    !!formCalc && amountChargedWatch !== undefined && Number(amountChargedWatch) < formCalc.total;

  useEffect(() => {
    if (formCalc) {
      setValue('amountCharged', formCalc.total);
    }
  }, [formCalc, setValue]);

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
      return affidavitsApi.create(payload).then((r) => r.data);
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
        <div className="alert-error" style={{ marginBottom: 16 }}>
          Failed to save. Please try again.
        </div>
      )}
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="grid-2">
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Customer name *</label>
            <input {...register('customerName')} placeholder="Full name" autoComplete="off" />
            {errors.customerName && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.customerName.message}
              </span>
            )}
            {showAutoFillIndicator && (
              <span
                style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}
              >
                ✓ Auto-filled from customer profile
              </span>
            )}
            {suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface)',
                  border: '2.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--neo-shadow-sm)',
                  zIndex: 50,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  marginTop: 4,
                }}
              >
                {suggestions.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setValue('customerName', cust.name, { shouldValidate: true });
                      setValue('phone', cust.phone || '', { shouldValidate: true });
                      setSuggestions([]);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1.5px solid var(--border-light)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                      {cust.name}
                    </div>
                    {cust.phone && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                        📞 {cust.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Phone number</label>
            <input {...register('phone')} placeholder="Mobile number" />
            {errors.phone && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.phone.message}</span>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Affidavit purpose / type *</label>
          <input
            {...register('purpose')}
            placeholder="e.g. Name correction, Income proof, Residence proof"
          />
          {errors.purpose && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.purpose.message}</span>
          )}
        </div>
        <div className="form-group">
          <label>Affidavit No.</label>
          <input {...register('affidavitNo')} placeholder="e.g. 12345/2026 (Optional)" />
          {errors.affidavitNo && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>
              {errors.affidavitNo.message}
            </span>
          )}
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Paper type *</label>
            <Controller
              control={control}
              name="paperType"
              render={({ field: { value, onChange } }) => (
                <NeoSelect
                  value={value || ''}
                  onChange={onChange}
                  options={[
                    { value: 'stamp500', label: `₹${pricing.stamp500_cost} Stamp Paper` },
                    { value: 'Plain', label: 'Plain Paper' },
                  ]}
                  placeholder="Select"
                />
              )}
            />
            {errors.paperType && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.paperType.message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Authorized by *</label>
            <Controller
              control={control}
              name="authorizerType"
              render={({ field: { value, onChange } }) => (
                <NeoSelect
                  value={value || ''}
                  onChange={onChange}
                  options={[
                    {
                      value: 'magistrate',
                      label: `Executive Magistrate (₹${pricing.magistrate_fee})`,
                    },
                    { value: 'Notary', label: `Notary Public (₹${pricing.notary_fee})` },
                  ]}
                  placeholder="Select"
                />
              )}
            />
            {errors.authorizerType && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.authorizerType.message}
              </span>
            )}
          </div>
        </div>

        {paperWatch === 'stamp500' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Stamp? *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 6 }}>
              <label
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input type="radio" value="Yes" {...register('customerBroughtStamp')} />
                Without stamp
              </label>
              <label
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input type="radio" value="No" {...register('customerBroughtStamp')} />
                With Stamp
              </label>
            </div>
            {errors.customerBroughtStamp && (
              <span
                style={{ color: 'var(--danger)', fontSize: 12, display: 'block', marginTop: 4 }}
              >
                {errors.customerBroughtStamp.message}
              </span>
            )}
          </div>
        )}

        {authWatch === 'Notary' && (
          <div className="form-group">
            <label>Notary Public fee to deduct (₹) *</label>
            <input
              type="number"
              {...register('notaryPublicFee', { valueAsNumber: true })}
              placeholder="Amount paid to Notary Public"
            />
            {errors.notaryPublicFee && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.notaryPublicFee.message}
              </span>
            )}
          </div>
        )}
        <div className="grid-2">
          <div className="form-group">
            <label>Authorizer name</label>
            <input {...register('authorizerName')} placeholder="Name of magistrate or notary" />
            {errors.authorizerName && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.authorizerName.message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Date of service *</label>
            <Controller
              control={control}
              name="dateOfService"
              render={({ field: { value, onChange } }) => (
                <NeoDatePicker value={value} onChange={onChange} max={today} />
              )}
            />
            {errors.dateOfService && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                {errors.dateOfService.message}
              </span>
            )}
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
                <span>
                  {authWatch === 'magistrate' ? 'Executive Magistrate' : 'Notary Public'} Fee
                </span>
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
            {...register('amountCharged', { valueAsNumber: true })}
            placeholder="Standard fee auto-filled"
          />
          {errors.amountCharged && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>
              {errors.amountCharged.message}
            </span>
          )}
        </div>

        {/* Remark field for discounts */}
        {isDiscounted && (
          <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
            <label style={{ color: 'var(--danger)', fontWeight: 700 }}>
              Reason for discount (Remark) *
            </label>
            <input
              {...register('remark')}
              placeholder="e.g. Regular customer, special request"
              style={{ borderColor: 'var(--danger)' }}
            />
            {errors.remark && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.remark.message}</span>
            )}
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
