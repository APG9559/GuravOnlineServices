import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { birthDeathApi, customersApi } from '@/api';
import { CertificateType, BirthDeathCertificate } from '@/types';
import { usePricing, calcBirthDeathTotal } from '@/hooks/usePricing';
import { BirthDeathReceipt } from '@/components/ReceiptModal/Receipt';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  certificateType: CertificateType;
  customerName: string;
  phone: string;
  personName: string;
  eventDate: string;
  numberOfCopies: number;
  dateOfService: string;
  amountCharged: number;
}

export default function BirthDeathCertificatesPage() {
  const [savedRecord, setSavedRecord] = useState<BirthDeathCertificate | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  const defaultFormValues = (): FormValues => ({
    certificateType: 'Birth',
    customerName: '',
    phone: '',
    personName: '',
    eventDate: '',
    numberOfCopies: 1,
    dateOfService: today,
    amountCharged: pricing.birth_death_first_copy ?? 300,
  });

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
      certificateType: 'Birth',
      numberOfCopies: 1,
      dateOfService: today,
    },
  });

  const certTypeWatch = watch('certificateType');
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

  const formCalc = copiesWatch ? calcBirthDeathTotal(copiesWatch, pricing) : null;

  useEffect(() => {
    if (formCalc) {
      setValue('amountCharged', formCalc.total);
    }
  }, [formCalc?.total, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => birthDeathApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['birth-death'] });
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
        <div className="page-title">Birth / Death Certificate</div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ fontWeight: 500, marginBottom: '1rem' }}>New certificate record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {/* Certificate Type */}
          <div className="form-group">
            <label>Certificate type *</label>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              {(['Birth', 'Death'] as CertificateType[]).map((type) => (
                <label
                  key={type}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 'normal', color: 'var(--text)', fontSize: 14 }}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('certificateType', { required: true })}
                  />
                  {type === 'Birth' ? 'Birth Certificate' : 'Death Certificate'}
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
              <label>{certTypeWatch === 'Birth' ? 'Baby name *' : 'Deceased person name *'}</label>
              <input
                {...register('personName', { required: true })}
                placeholder={certTypeWatch === 'Birth' ? "Baby's full name" : "Deceased person's full name"}
              />
              {errors.personName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>
            <div className="form-group">
              <label>{certTypeWatch === 'Birth' ? 'Date of birth *' : 'Date of death *'}</label>
              <Controller
                control={control}
                name="eventDate"
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <NeoDatePicker
                    value={value || ''}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Certificate Record Saved!</h3>
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
          <BirthDeathReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
