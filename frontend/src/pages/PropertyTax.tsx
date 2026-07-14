import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { propertyTaxesApi } from '@/api';
import { PropertyTaxRecord } from '@/types';
import { usePricing } from '@/hooks/usePricing';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import { PropertyTaxReceipt } from '@/components/ReceiptModal/Receipt';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import CustomerShareReceiptModal from '@/components/Customers/CustomerShareReceiptModal';
import PropertiesListTab from '@/components/PropertyTax/components/PropertiesListTab';

interface FormValues {
  serviceType: 'AssessmentCopy' | 'NameTransfer' | 'NoDuesCertificate';
  customerName: string;
  phone: string;
  address: string;
  propertyTaxNo: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  amountCharged: number;
  dateOfService: string;
}

export default function PropertyTaxPage() {
  const [activeTab, setActiveTab] = useState<'forms' | 'properties'>('forms');
  const [savedRecord, setSavedRecord] = useState<PropertyTaxRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
      serviceType: 'AssessmentCopy',
      dateOfService: today,
      officialFee: 200,
      serviceFee: 150,
      protocolFee: 50,
      amountCharged: 400,
      customerName: '',
      phone: '',
      address: '',
      propertyTaxNo: '',
    },
  });

  const serviceTypeWatch = watch('serviceType');
  const phoneWatch = watch('phone');
  const officialFeeWatch = watch('officialFee') ?? 0;
  const serviceFeeWatch = watch('serviceFee') ?? 0;
  const protocolFeeWatch = watch('protocolFee') ?? 0;
  const amountChargedWatch = watch('amountCharged') ?? 0;

  const { showAutoFillIndicator } = useCustomerLookup(phoneWatch, (customer) => {
    setValue('customerName', customer.name);
    if (customer.address) {
      setValue('address', customer.address);
    }
  });

  // Retrieve pricing defaults from Settings Hook
  const getPricingKeys = (type: string) => {
    switch (type) {
      case 'AssessmentCopy':
        return {
          official: 'property_tax_assessment_official_fee',
          service: 'property_tax_assessment_service_fee',
          protocol: 'property_tax_assessment_protocol_fee',
        };
      case 'NameTransfer':
        return {
          official: 'property_tax_transfer_official_fee',
          service: 'property_tax_transfer_service_fee',
          protocol: 'property_tax_transfer_protocol_fee',
        };
      case 'NoDuesCertificate':
        return {
          official: 'property_tax_nodues_official_fee',
          service: 'property_tax_nodues_service_fee',
          protocol: 'property_tax_nodues_protocol_fee',
        };
      default:
        return {
          official: 'property_tax_assessment_official_fee',
          service: 'property_tax_assessment_service_fee',
          protocol: 'property_tax_assessment_protocol_fee',
        };
    }
  };

  const getFallbackFees = (type: string) => {
    switch (type) {
      case 'AssessmentCopy':
        return { official: 200, service: 150, protocol: 50 };
      case 'NameTransfer':
        return { official: 500, service: 300, protocol: 100 };
      case 'NoDuesCertificate':
        return { official: 150, service: 100, protocol: 50 };
      default:
        return { official: 200, service: 150, protocol: 50 };
    }
  };

  const keys = getPricingKeys(serviceTypeWatch);
  const fallbacks = getFallbackFees(serviceTypeWatch);

  const defaultOfficial = pricing[keys.official] ?? fallbacks.official;
  const defaultService = pricing[keys.service] ?? fallbacks.service;
  const defaultProtocol = pricing[keys.protocol] ?? fallbacks.protocol;

  // Set official, service and protocol fees when service type changes
  useEffect(() => {
    setValue('officialFee', defaultOfficial);
    setValue('serviceFee', defaultService);
    setValue('protocolFee', defaultProtocol);
  }, [serviceTypeWatch, defaultOfficial, defaultService, defaultProtocol, setValue]);

  // Recalculate amountCharged as officialFee + serviceFee + protocolFee
  useEffect(() => {
    const calcTotal =
      Number(officialFeeWatch) + Number(serviceFeeWatch) + Number(protocolFeeWatch);
    if (Number(amountChargedWatch) !== calcTotal) {
      setValue('amountCharged', calcTotal);
    }
  }, [officialFeeWatch, serviceFeeWatch, protocolFeeWatch, setValue]);

  // When amountCharged changes → adjust serviceFee
  useEffect(() => {
    if (amountChargedWatch === undefined) return;
    const otherFees = Number(officialFeeWatch) + Number(protocolFeeWatch);
    const calcTotal = otherFees + Number(serviceFeeWatch);
    if (Number(amountChargedWatch) !== calcTotal) {
      setValue('serviceFee', Math.max(0, Number(amountChargedWatch) - otherFees));
    }
  }, [amountChargedWatch, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => propertyTaxesApi.createRecord(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['property-taxes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      reset({
        serviceType: 'AssessmentCopy',
        customerName: '',
        phone: '',
        address: '',
        propertyTaxNo: '',
        dateOfService: today,
        officialFee: pricing.property_tax_assessment_official_fee ?? 200,
        serviceFee: pricing.property_tax_assessment_service_fee ?? 150,
        protocolFee: pricing.property_tax_assessment_protocol_fee ?? 50,
        amountCharged:
          (pricing.property_tax_assessment_official_fee ?? 200) +
          (pricing.property_tax_assessment_service_fee ?? 150) +
          (pricing.property_tax_assessment_protocol_fee ?? 50),
      });
    },
  });

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const tabs = [
    { key: 'forms' as const, label: 'Service Forms' },
    { key: 'properties' as const, label: 'Properties' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Property Tax Services</div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'forms' && (
        <div className="card" style={{ maxWidth: 800 }}>
          <div style={{ fontWeight: 500, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            New Property Tax Application Record
          </div>

          {mutation.isError && (
            <div className="alert-error" style={{ marginBottom: 16 }}>
              Failed to save record. Please try again.
            </div>
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
                      { value: 'AssessmentCopy', label: 'Assessment Copy' },
                      { value: 'NameTransfer', label: 'Property Tax Name Transfer' },
                      { value: 'NoDuesCertificate', label: 'Property Tax No Dues Certificate' },
                    ]}
                    placeholder="Select Service Type"
                  />
                )}
              />
            </div>

            {/* Standard Fields Section */}
            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  {...register('phone', { required: false, pattern: /^\+?[0-9]{7,15}$/ })}
                  placeholder="Mobile number"
                />
                {errors.phone && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                    Enter a valid mobile number
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Applicant Name *</label>
                <input
                  {...register('customerName', { required: true })}
                  placeholder="Full name of applicant"
                />
                {errors.customerName && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
                )}
                {showAutoFillIndicator && (
                  <span
                    style={{
                      color: 'var(--success)',
                      fontSize: 11,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    ✓ Auto-filled customer profile details
                  </span>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Address *</label>
              <textarea
                {...register('address', { required: true })}
                placeholder="Full mailing/property address"
                rows={2}
                style={{ resize: 'vertical' }}
              />
              {errors.address && (
                <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
              )}
            </div>

            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Property Tax No. *</label>
                <input
                  {...register('propertyTaxNo', { required: true })}
                  placeholder="Enter Property Tax No."
                />
                {errors.propertyTaxNo && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
                )}
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

            {/* Pricing Grid */}
            <div className="grid-4" style={{ marginTop: 24 }}>
              <div className="form-group">
                <label>Official Fee (₹) *</label>
                <input
                  type="number"
                  {...register('officialFee', { required: true, valueAsNumber: true, min: 0 })}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Service Fee Charges (₹) *</label>
                <input
                  type="number"
                  {...register('serviceFee', { required: true, valueAsNumber: true, min: 0 })}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Protocol Fee (₹) *</label>
                <input
                  type="number"
                  {...register('protocolFee', { required: true, valueAsNumber: true, min: 0 })}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Total (₹)</label>
                <input
                  type="number"
                  {...register('amountCharged', { valueAsNumber: true })}
                  style={{ fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  reset();
                  setValue('officialFee', defaultOfficial);
                  setValue('serviceFee', defaultService);
                  setValue('protocolFee', defaultProtocol);
                }}
              >
                Reset Form
              </button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'properties' && <PropertiesListTab />}

      {/* Success Modal */}
      {showSuccessModal && savedRecord && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', color: 'var(--success)' }}>✓</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '10px 0' }}>
                Record Saved Successfully!
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>
                The Property Tax application has been stored.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSavedRecord(null);
                }}
              >
                Close
              </button>
              <button
                className="btn btn-success-soft"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowShareModal(true);
                }}
              >
                💬 Share
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && savedRecord && (
        <CustomerShareReceiptModal
          service={{
            id: savedRecord.id,
            type: 'property-tax',
            typeName: 'Property Tax',
            dateOfService: savedRecord.dateOfService,
            amountCharged: savedRecord.amountCharged,
            description: `Property Tax - ${savedRecord.propertyTaxNo}`,
            createdBy: savedRecord.createdBy?.name || '',
            createdAt: savedRecord.createdAt,
          }}
          customer={{
            id: savedRecord.property?.customer?.id || '',
            name: savedRecord.customerName || '',
            phone: savedRecord.phone || '',
            createdAt: savedRecord.property?.customer?.createdAt || '',
            updatedAt: savedRecord.property?.customer?.updatedAt || '',
            services: [],
          }}
          onClose={() => {
            setShowShareModal(false);
            setSavedRecord(null);
          }}
        />
      )}

      {/* Hidden Receipt Component for print triggers */}
      <div style={{ display: 'none' }}>
        {savedRecord && (
          <div ref={receiptRef}>
            <PropertyTaxReceipt record={savedRecord} />
          </div>
        )}
      </div>
    </div>
  );
}
