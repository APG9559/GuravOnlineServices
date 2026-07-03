import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { waterSuppliesApi, customersApi } from '@/api';
import { WaterSupply } from '@/types';
import { usePricing } from '@/hooks/usePricing';
import { WaterSupplyReceipt } from '@/components/ReceiptModal/Receipt';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

interface FormValues {
  serviceType: 'NewConnection' | 'ConnectionTransfer' | 'MeterDisconnection' | 'MeterReconnection' | 'NoDuesCertificate' | 'MeterInspection' | 'ChangeOfUse';
  customerName: string;
  phone: string;
  connectionAddress: string;
  applicationTokenNo: string;
  applicationDate: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  amountCharged: number;

  // Specific conditional fields
  plumberName?: string;
  plumberPhone?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  connectionNo?: string;
  currentOwner?: string;
  newOwnerName?: string;
  newOwnerPhone?: string;
  transferSubtype?: string;
  currentUsage?: string;
  newUsage?: string;
}

export default function WaterSupplyPage() {
  const [savedRecord, setSavedRecord] = useState<WaterSupply | null>(null);
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
      serviceType: 'NewConnection',
      applicationDate: today,
      dateOfService: today,
      officialFee: 1000,
      serviceFee: 500,
      amountCharged: 1500,
      plumberName: '',
      plumberPhone: '',
      contactPersonName: '',
      contactPersonPhone: '',
      connectionNo: '',
      currentOwner: '',
      newOwnerName: '',
      newOwnerPhone: '',
      transferSubtype: 'Purchase',
      currentUsage: '',
      newUsage: '',
    },
  });

  const serviceTypeWatch = watch('serviceType');
  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;
  const [showAutoFillIndicator, setShowAutoFillIndicator] = useState(false);

  // Retrieve pricing defaults from Settings Hook
  const getPricingKeys = (type: string) => {
    switch (type) {
      case 'NewConnection': return { official: 'water_supply_new_official_fee', service: 'water_supply_new_service_fee' };
      case 'ConnectionTransfer': return { official: 'water_supply_transfer_official_fee', service: 'water_supply_transfer_service_fee' };
      case 'MeterDisconnection': return { official: 'water_supply_disconnection_official_fee', service: 'water_supply_disconnection_service_fee' };
      case 'MeterReconnection': return { official: 'water_supply_reconnection_official_fee', service: 'water_supply_reconnection_service_fee' };
      case 'NoDuesCertificate': return { official: 'water_supply_nodues_official_fee', service: 'water_supply_nodues_service_fee' };
      case 'MeterInspection': return { official: 'water_supply_inspection_official_fee', service: 'water_supply_inspection_service_fee' };
      case 'ChangeOfUse': return { official: 'water_supply_change_official_fee', service: 'water_supply_change_service_fee' };
      default: return { official: 'water_supply_new_official_fee', service: 'water_supply_new_service_fee' };
    }
  };

  const getFallbackFees = (type: string) => {
    switch (type) {
      case 'NewConnection': return { official: 1000, service: 500 };
      case 'ConnectionTransfer': return { official: 500, service: 300 };
      case 'MeterDisconnection': return { official: 200, service: 150 };
      case 'MeterReconnection': return { official: 300, service: 200 };
      case 'NoDuesCertificate': return { official: 150, service: 100 };
      case 'MeterInspection': return { official: 200, service: 150 };
      case 'ChangeOfUse': return { official: 400, service: 250 };
      default: return { official: 1000, service: 500 };
    }
  };

  const keys = getPricingKeys(serviceTypeWatch);
  const fallbacks = getFallbackFees(serviceTypeWatch);

  const defaultOfficial = pricing[keys.official] ?? fallbacks.official;
  const defaultService = pricing[keys.service] ?? fallbacks.service;

  // Set official and service fees when service type changes
  useEffect(() => {
    setValue('officialFee', defaultOfficial);
    setValue('serviceFee', defaultService);
  }, [serviceTypeWatch, defaultOfficial, defaultService, setValue]);

  // Recalculate amountCharged as officialFee + serviceFee
  useEffect(() => {
    setValue('amountCharged', Number(officialFeeWatch) + Number(serviceFeeWatch));
  }, [officialFeeWatch, serviceFeeWatch, setValue]);

  // Auto-lookup customer
  useEffect(() => {
    if (phoneWatch && /^[6-9]\d{9}$/.test(phoneWatch)) {
      customersApi.lookup(phoneWatch)
        .then((res) => {
          if (res.data) {
            setValue('customerName', res.data.name);
            if (res.data.address) {
              setValue('connectionAddress', res.data.address);
            }
            setShowAutoFillIndicator(true);
            setTimeout(() => setShowAutoFillIndicator(false), 3000);
          }
        })
        .catch(() => {});
    }
  }, [phoneWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => waterSuppliesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['water-supplies'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      reset({
        serviceType: 'NewConnection',
        customerName: '',
        phone: '',
        connectionAddress: '',
        applicationTokenNo: '',
        applicationDate: today,
        dateOfService: today,
        officialFee: pricing.water_supply_new_official_fee ?? 1000,
        serviceFee: pricing.water_supply_new_service_fee ?? 500,
        amountCharged: (pricing.water_supply_new_official_fee ?? 1000) + (pricing.water_supply_new_service_fee ?? 500),
        plumberName: '',
        plumberPhone: '',
        contactPersonName: '',
        contactPersonPhone: '',
        connectionNo: '',
        currentOwner: '',
        newOwnerName: '',
        newOwnerPhone: '',
        transferSubtype: 'Purchase',
        currentUsage: '',
        newUsage: '',
      });
    },
  });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Water Supply Services</div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <div style={{ fontWeight: 500, marginBottom: '1.5rem', fontSize: '1.1rem' }}>New Water Supply Application Record</div>

        {mutation.isError && (
          <div className="alert-error" style={{ marginBottom: 16 }}>Failed to save record. Please try again.</div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          
          {/* Service Type Selection */}
          <div className="form-group">
            <label>Service Type *</label>
            <Controller
              control={control}
              name="serviceType"
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <NeoSelect
                  value={value}
                  onChange={onChange}
                  options={[
                    { value: 'NewConnection', label: 'New Connection Application' },
                    { value: 'ConnectionTransfer', label: 'Connection Transfer Application' },
                    { value: 'MeterDisconnection', label: 'Water Meter Disconnection' },
                    { value: 'MeterReconnection', label: 'Water Meter Reconnection' },
                    { value: 'NoDuesCertificate', label: 'Water Meter No Dues Certificate' },
                    { value: 'MeterInspection', label: 'Water Meter Inspection' },
                    { value: 'ChangeOfUse', label: 'Water Meter Change of Use' },
                  ]}
                  placeholder="Select Service Type"
                />
              )}
            />
          </div>

          {/* Standard Fields Section */}
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })}
                placeholder="10-digit mobile"
              />
              {errors.phone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Enter a valid 10-digit Indian number</span>}
            </div>

            <div className="form-group">
              <label>Customer Name *</label>
              <input
                {...register('customerName', { required: true })}
                placeholder="Full name of applicant"
              />
              {errors.customerName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              {showAutoFillIndicator && (
                <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>✓ Auto-filled customer profile details</span>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Connection Address *</label>
            <textarea
              {...register('connectionAddress', { required: true })}
              placeholder="Full connection address"
              rows={2}
              style={{ resize: 'vertical' }}
            />
            {errors.connectionAddress && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
          </div>

          <div className="grid-3" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label>Application Token No. *</label>
              <input
                {...register('applicationTokenNo', { required: true })}
                placeholder="e.g. TOK102392"
              />
              {errors.applicationTokenNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
            </div>

            <div className="form-group">
              <label>Application Date *</label>
              <Controller
                control={control}
                name="applicationDate"
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <NeoDatePicker value={value} onChange={onChange} max={today} />
                )}
              />
            </div>

            <div className="form-group">
              <label>Date of Service *</label>
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

          {/* Conditional Input Fields (Specific) */}
          <div style={{ border: '2px dashed var(--border-color)', borderRadius: 8, padding: 16, marginTop: 24, marginBottom: 24, background: '#fafafa' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
              Specific service options
            </div>

            {/* NEW CONNECTION FIELDS */}
            {serviceTypeWatch === 'NewConnection' && (
              <div className="grid-2">
                <div className="form-group">
                  <label>Plumber Name</label>
                  <input {...register('plumberName')} placeholder="Licensed plumber name" />
                </div>
                <div className="form-group">
                  <label>Plumber Mobile No.</label>
                  <input {...register('plumberPhone')} placeholder="Plumber phone number" />
                </div>
                <div className="form-group">
                  <label>Contact Person Name</label>
                  <input {...register('contactPersonName')} placeholder="Alternative contact name" />
                </div>
                <div className="form-group">
                  <label>Contact Mobile No.</label>
                  <input {...register('contactPersonPhone')} placeholder="Alternative contact phone" />
                </div>
              </div>
            )}

            {/* CONNECTION TRANSFER FIELDS */}
            {serviceTypeWatch === 'ConnectionTransfer' && (
              <div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Connection No. *</label>
                    <input {...register('connectionNo', { required: true })} placeholder="Existing connection ID" />
                    {errors.connectionNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
                  </div>
                  <div className="form-group">
                    <label>Transfer Subtype *</label>
                    <Controller
                      control={control}
                      name="transferSubtype"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoSelect
                          value={value || ''}
                          onChange={onChange}
                          options={[
                            { value: 'Purchase', label: 'By Purchase' },
                            { value: 'Inheritance', label: 'By Inheritance' },
                            { value: 'GiftDeed', label: 'By Gift Deed' },
                            { value: 'SubDivision', label: 'By Property sub-division' },
                          ]}
                          placeholder="Select transfer subtype"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid-3" style={{ marginTop: 16 }}>
                  <div className="form-group">
                    <label>Current Owner Name</label>
                    <input {...register('currentOwner')} placeholder="Current owner name" />
                  </div>
                  <div className="form-group">
                    <label>New Owner Name *</label>
                    <input {...register('newOwnerName', { required: true })} placeholder="New owner name" />
                    {errors.newOwnerName && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
                  </div>
                  <div className="form-group">
                    <label>New Owner Mobile No. *</label>
                    <input {...register('newOwnerPhone', { required: true })} placeholder="New owner mobile number" />
                    {errors.newOwnerPhone && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
                  </div>
                </div>
              </div>
            )}

            {/* DISCONNECTION / RECONNECTION / NO DUES / INSPECTION */}
            {(serviceTypeWatch === 'MeterDisconnection' ||
              serviceTypeWatch === 'MeterReconnection' ||
              serviceTypeWatch === 'NoDuesCertificate' ||
              serviceTypeWatch === 'MeterInspection') && (
              <div className="form-group">
                <label>Connection No. *</label>
                <input {...register('connectionNo', { required: true })} placeholder="Existing connection ID" />
                {errors.connectionNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
              </div>
            )}

            {/* CHANGE OF USE FIELDS */}
            {serviceTypeWatch === 'ChangeOfUse' && (
              <div>
                <div className="form-group">
                  <label>Connection No. *</label>
                  <input {...register('connectionNo', { required: true })} placeholder="Existing connection ID" />
                  {errors.connectionNo && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>}
                </div>
                <div className="grid-2" style={{ marginTop: 16 }}>
                  <div className="form-group">
                    <label>Current Usage (e.g. Residential)</label>
                    <input {...register('currentUsage')} placeholder="Current usage category" />
                  </div>
                  <div className="form-group">
                    <label>New Usage (e.g. Commercial)</label>
                    <input {...register('newUsage')} placeholder="Proposed usage category" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="price-box" style={{ marginBottom: 16 }}>
            <div className="price-row">
              <span>Default Official Fee:</span>
              <span style={{ fontWeight: 500 }}>₹{defaultOfficial}</span>
            </div>
            <div className="price-row" style={{ marginTop: 4 }}>
              <span>Default Service Fee:</span>
              <span style={{ fontWeight: 500 }}>₹{defaultService}</span>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Official Fee (₹) *</label>
              <input
                type="number"
                {...register('officialFee', { required: true, min: 0, valueAsNumber: true })}
                placeholder="Government charges"
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
            <div className="form-group">
              <label>Total Fee Charged (₹)</label>
              <input
                type="number"
                readOnly
                {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
                style={{ background: '#f5f5f5', cursor: 'not-allowed', fontWeight: 600 }}
              />
            </div>
          </div>

          {/* Submits */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save record'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => reset({
                serviceType: 'NewConnection',
                customerName: '',
                phone: '',
                connectionAddress: '',
                applicationTokenNo: '',
                applicationDate: today,
                dateOfService: today,
                officialFee: pricing.water_supply_new_official_fee ?? 1000,
                serviceFee: pricing.water_supply_new_service_fee ?? 500,
                amountCharged: (pricing.water_supply_new_official_fee ?? 1000) + (pricing.water_supply_new_service_fee ?? 500),
                plumberName: '',
                plumberPhone: '',
                contactPersonName: '',
                contactPersonPhone: '',
                connectionNo: '',
                currentOwner: '',
                newOwnerName: '',
                newOwnerPhone: '',
                transferSubtype: 'Purchase',
                currentUsage: '',
                newUsage: '',
              })}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal popup */}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Water Supply Saved!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Record for {savedRecord.customerName} has been saved.
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

      {/* Printable template */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <WaterSupplyReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
