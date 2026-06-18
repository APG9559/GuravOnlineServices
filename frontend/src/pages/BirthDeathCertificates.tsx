import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { birthDeathApi, customersApi } from '@/api';
import { CertificateType, BirthDeathCertificate, CERT_TYPE_LABELS } from '@/types';
import { usePricing, calcBirthDeathTotal } from '@/hooks/usePricing';
import { BirthDeathReceipt } from '@/components/ReceiptModal/Receipt';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  certificateType: CertificateType;
  customerName: string;
  phone: string;
  personName: string;
  eventDate: string;
  dateOfService: string;
  numberOfCopies: number;
  amountCharged: number;
}

export default function BirthDeathCertificatesPage() {
  const [tab, setTab] = useState<'calc' | 'add'>('calc');
  const [calcCopies, setCalcCopies] = useState<number>(1);
  const [savedRecord, setSavedRecord] = useState<BirthDeathCertificate | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const calcResult = calcBirthDeathTotal(calcCopies, pricing);

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      certificateType: 'Birth',
      numberOfCopies: 1,
      dateOfService: today,
    },
  });

  const selectedType = watch('certificateType');
  const copiesWatch = watch('numberOfCopies');
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
  const formCalc = calcBirthDeathTotal(copiesWatch || 1, pricing);

  useEffect(() => {
    setValue('amountCharged', formCalc.total);
  }, [formCalc.total, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => birthDeathApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['birth-death-certificates'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      reset({
        certificateType: 'Birth',
        numberOfCopies: 1,
        dateOfService: today,
      });
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Birth / Death Certificate</div>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${tab === 'calc' ? 'active' : ''}`}
          onClick={() => setTab('calc')}
        >
          Price calculator
        </button>
        <button
          className={`tab ${tab === 'add' ? 'active' : ''}`}
          onClick={() => setTab('add')}
        >
          Add record
        </button>
      </div>

      {/* ── Calculator tab ── */}
      {tab === 'calc' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>Calculate charge</div>
          <div className="form-group">
            <label>Number of copies</label>
            <input
              type="number"
              min="1"
              value={calcCopies}
              onChange={(e) => setCalcCopies(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          {calcResult && (
            <div className="price-box">
              <div className="price-row">
                <span>First copy fee</span>
                <span>₹{calcResult.firstCopyFee}</span>
              </div>
              <div className="price-row">
                <span>Additional copies ({calcResult.extraCopies} × ₹{calcResult.extraCopyFee})</span>
                <span>₹{calcResult.extraCopies * calcResult.extraCopyFee}</span>
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
          <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New birth/death certificate record</div>
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
            <div className="form-group">
              <label>Certificate Type *</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 4, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    value="Birth"
                    {...register('certificateType', { required: true })}
                  />
                  Birth Certificate
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    value="Death"
                    {...register('certificateType', { required: true })}
                  />
                  Death Certificate
                </label>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Customer name *</label>
                <input {...register('customerName', { required: true })} placeholder="Full name of applicant" />
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

            <div className="grid-2">
              <div className="form-group">
                <label>{selectedType === 'Birth' ? 'Baby name *' : 'Deceased name *'}</label>
                <input {...register('personName', { required: true })} placeholder={selectedType === 'Birth' ? 'Name of child' : 'Name of deceased'} />
                {errors.personName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
              <div className="form-group">
                <label>{selectedType === 'Birth' ? 'Date of birth *' : 'Date of death *'}</label>
                <Controller
                  control={control}
                  name="eventDate"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoDatePicker
                      value={value}
                      onChange={onChange}
                      max={today}
                    />
                  )}
                />
                {errors.eventDate && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Number of copies *</label>
                <input
                  type="number"
                  min="1"
                  {...register('numberOfCopies', {
                    required: true,
                    min: 1,
                    valueAsNumber: true,
                  })}
                />
                {errors.numberOfCopies && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Min 1 copy</span>}
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
              <button
                type="button"
                className="btn"
                onClick={() => {
                  reset({
                    certificateType: 'Birth',
                    numberOfCopies: 1,
                    dateOfService: today,
                  });
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <BirthDeathReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
