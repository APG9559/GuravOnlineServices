import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waterSuppliesApi } from '@/api';
import { WaterConnection, WaterServiceRecord } from '@/types';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import NeoDatePicker from '@/components/NeoDatePicker';
import NeoSelect from '@/components/NeoSelect';
import { WATER_SERVICE_TYPE_LABELS } from '@/constants';
import { useToast } from '@/context/ToastContext';

interface ServiceFormsTabProps {
  selectedServiceType: WaterServiceRecord['serviceType'];
  setSelectedServiceType: (type: WaterServiceRecord['serviceType']) => void;
  selectedConnection: WaterConnection | null;
  setSelectedConnection: (conn: WaterConnection | null) => void;
  onRecordSaved: (record: WaterServiceRecord) => void;
}

interface FormValues {
  serviceType: WaterServiceRecord['serviceType'];
  connectionId?: string;
  connectionNo?: string;
  customerName?: string;
  phone?: string;
  connectionAddress?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  currentUsage?: string;
  meterDetails?: string;

  applicationTokenNo: string;
  applicationDate: string;
  dateOfService: string;

  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  miscFee: number;
  discount: number;
  amountCharged: number;
  remarks?: string;

  // NewConnection plumber info
  plumberName?: string;
  plumberPhone?: string;
  isContactSameAsPlumber?: boolean;

  // ConnectionTransfer details
  transferSubtype?: string;
  currentOwner?: string;
  newOwnerName?: string;
  newOwnerPhone?: string;

  // ChangeOfUse details
  newUsage?: string;
}

export default function ServiceFormsTab({
  selectedServiceType,
  setSelectedServiceType,
  selectedConnection,
  setSelectedConnection,
  onRecordSaved,
}: ServiceFormsTabProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [connSearch, setConnSearch] = useState('');
  const [showConnResults, setShowConnResults] = useState(false);

  // Queries
  const { data: configs = [] } = useQuery({
    queryKey: ['water-configs'],
    queryFn: () => waterSuppliesApi.getConfigs().then((r) => r.data),
  });

  const { data: searchedConnections = [] } = useQuery({
    queryKey: ['water-connections-search', connSearch],
    queryFn: () => waterSuppliesApi.getAllConnections({ search: connSearch }).then((r) => r.data),
    enabled: connSearch.length >= 2,
  });

  // Form initialization
  const methods = useForm<FormValues>({
    defaultValues: {
      serviceType: selectedServiceType,
      applicationDate: today,
      dateOfService: today,
      officialFee: 0,
      serviceFee: 0,
      protocolFee: 0,
      miscFee: 0,
      discount: 0,
      amountCharged: 0,
      plumberName: '',
      plumberPhone: '',
      isContactSameAsPlumber: false,
      transferSubtype: 'Purchase',
      newUsage: 'Domestic',
      remarks: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = methods;

  const serviceType = watch('serviceType');
  const phone = watch('phone');
  const officialFee = watch('officialFee') || 0;
  const serviceFee = watch('serviceFee') || 0;
  const protocolFee = watch('protocolFee') || 0;
  const miscFee = watch('miscFee') || 0;
  const discount = watch('discount') || 0;
  const amountCharged = watch('amountCharged') || 0;

  const isContactSameAsPlumber = watch('isContactSameAsPlumber');
  const plumberName = watch('plumberName');
  const plumberPhone = watch('plumberPhone');

  // Customer Autocomplete Lookup (only for NewConnection)
  const { showAutoFillIndicator, resetIndicator } = useCustomerLookup(
    serviceType === 'NewConnection' ? phone : undefined,
    (customer) => {
      setValue('customerName', customer.name);
      if (customer.address) {
        setValue('connectionAddress', customer.address);
      }
    },
  );

  // Synchronize selectedServiceType with form type
  useEffect(() => {
    setValue('serviceType', selectedServiceType);
  }, [selectedServiceType, setValue]);

  // Synchronize when serviceType changes in form
  useEffect(() => {
    setSelectedServiceType(serviceType);
    if (serviceType === 'NewConnection') {
      setSelectedConnection(null);
      setConnSearch('');
    }
  }, [serviceType, setSelectedServiceType, setSelectedConnection]);

  // Apply selectedConnection details
  useEffect(() => {
    if (selectedConnection) {
      setValue('connectionId', selectedConnection.id);
      setValue('connectionNo', selectedConnection.connectionNo || '');
      setValue('customerName', selectedConnection.currentOwner);
      setValue('connectionAddress', selectedConnection.connectionAddress);
      setValue('currentUsage', selectedConnection.currentUsage);
      if (serviceType === 'ConnectionTransfer') {
        setValue('currentOwner', selectedConnection.currentOwner);
      }
    } else {
      setValue('connectionId', undefined);
      setValue('connectionNo', '');
      setValue('currentUsage', '');
    }
  }, [selectedConnection, serviceType, setValue]);

  // Plumber name synchronization
  useEffect(() => {
    if (isContactSameAsPlumber) {
      setValue('contactPersonName', plumberName || '');
      setValue('contactPersonPhone', plumberPhone || '');
    }
  }, [isContactSameAsPlumber, plumberName, plumberPhone, setValue]);

  // Fetch Pricing & Configurations
  const activeConfig = configs.find((c) => c.serviceType === serviceType);

  useEffect(() => {
    if (activeConfig) {
      setValue('officialFee', Number(activeConfig.officialFee));
      setValue('serviceFee', Number(activeConfig.serviceFee));
      setValue('protocolFee', Number(activeConfig.protocolFee || 0));
      setValue('miscFee', Number(activeConfig.defaultMiscFee || 0));
    }
  }, [activeConfig, serviceType, setValue]);

  // Recalculate amountCharged
  useEffect(() => {
    const total =
      Number(officialFee) +
      Number(serviceFee) +
      Number(protocolFee) +
      Number(miscFee) -
      Number(discount);
    const safeTotal = total > 0 ? total : 0;
    if (Number(amountCharged) !== safeTotal) {
      setValue('amountCharged', safeTotal);
    }
  }, [officialFee, serviceFee, protocolFee, miscFee, discount, setValue]);

  // When amountCharged changes → adjust serviceFee
  useEffect(() => {
    if (amountCharged === undefined) return;
    const otherFees =
      Number(officialFee) +
      Number(protocolFee) +
      Number(miscFee) -
      Number(discount);
    const calcTotal = otherFees + Number(serviceFee);
    if (Number(amountCharged) !== calcTotal) {
      setValue('serviceFee', Math.max(0, Number(amountCharged) - otherFees));
    }
  }, [amountCharged, setValue]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: (data: FormValues) => {
      // Map details specific to service type
      const details: Record<string, unknown> = {};
      if (serviceType === 'NewConnection') {
        details.plumberName = data.plumberName;
        details.plumberPhone = data.plumberPhone;
      } else if (serviceType === 'ConnectionTransfer') {
        details.transferSubtype = data.transferSubtype;
        details.currentOwner = data.currentOwner;
        details.newOwnerName = data.newOwnerName;
        details.newOwnerPhone = data.newOwnerPhone;
        // The service logic upserts these as well
        details.transferToName = data.newOwnerName;
        details.transferToPhone = data.newOwnerPhone;
      } else if (serviceType === 'ChangeOfUse') {
        details.currentUsage = data.currentUsage;
        details.newUsage = data.newUsage;
      }

      const payload = {
        serviceType: data.serviceType,
        connectionId: data.connectionId,
        connectionNo: data.connectionNo || undefined,
        customerName: data.customerName,
        phone: data.phone,
        connectionAddress: data.connectionAddress,
        contactPersonName: data.contactPersonName || undefined,
        contactPersonPhone: data.contactPersonPhone || undefined,
        currentUsage: data.currentUsage || undefined,
        meterDetails: data.meterDetails || undefined,

        applicationTokenNo: data.applicationTokenNo || undefined,
        applicationDate: data.applicationDate,
        dateOfService: data.dateOfService,

        officialFee: data.officialFee,
        serviceFee: data.serviceFee,
        protocolFee: data.protocolFee,
        miscFee: data.miscFee,
        discount: data.discount,
        amountCharged: data.amountCharged,
        remarks: data.remarks || undefined,
        details,
      };

      return waterSuppliesApi.create(payload).then((r) => r.data);
    },
    onSuccess: (record) => {
      qc.invalidateQueries({ queryKey: ['water-records'] });
      qc.invalidateQueries({ queryKey: ['water-connections'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Water Supply Service transaction registered successfully.');
      onRecordSaved(record);
      handleClear();
    },
    onError: (err: unknown) => {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        errObj.response?.data?.message || errObj.message || 'Failed to save water supply record',
      );
    },
  });

  const handleClear = () => {
    setSelectedConnection(null);
    setConnSearch('');
    resetIndicator();
    reset({
      serviceType: 'NewConnection',
      applicationDate: today,
      dateOfService: today,
      officialFee: 0,
      serviceFee: 0,
      protocolFee: 0,
      miscFee: 0,
      discount: 0,
      amountCharged: 0,
      customerName: '',
      phone: '',
      connectionAddress: '',
      contactPersonName: '',
      contactPersonPhone: '',
      plumberName: '',
      plumberPhone: '',
      isContactSameAsPlumber: false,
      transferSubtype: 'Purchase',
      newUsage: 'Domestic',
      remarks: '',
    });
  };

  const serviceTypeOptions = Object.entries(WATER_SERVICE_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const handleSelectConnection = (conn: WaterConnection) => {
    setSelectedConnection(conn);
    setConnSearch(conn.connectionNo || conn.currentOwner);
    setShowConnResults(false);
  };

  const isManualOverrideAllowed = activeConfig?.allowManualOverride !== false;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <form
        onSubmit={handleSubmit((d) => saveMutation.mutate(d))}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {/* Service Selector */}
        <div className="form-group">
          <label>Select Service Type *</label>
          <Controller
            control={control}
            name="serviceType"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <NeoSelect
                value={value}
                onChange={onChange}
                options={serviceTypeOptions}
                placeholder="Select Service"
              />
            )}
          />
        </div>

        {/* Existing Connection Search (if not new connection) */}
        {serviceType !== 'NewConnection' && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Find Connection Profile *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={connSearch}
                onChange={(e) => {
                  setConnSearch(e.target.value);
                  setShowConnResults(true);
                }}
                placeholder="Type connection number, owner name, or address..."
                style={{ flex: 1 }}
              />
              {selectedConnection && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setSelectedConnection(null);
                    setConnSearch('');
                  }}
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {showConnResults && searchedConnections.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface)',
                  border: '2.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: '3px 3px 0 var(--border)',
                  zIndex: 100,
                  maxHeight: 250,
                  overflowY: 'auto',
                  marginTop: 6,
                }}
              >
                {searchedConnections.map((conn: WaterConnection) => (
                  <div
                    key={conn.id}
                    onClick={() => handleSelectConnection(conn)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                    className="hover-highlight"
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {conn.connectionNo || 'PENDING APPROVAL'} — {conn.currentOwner}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Address: {conn.connectionAddress} | Phone: {conn.contactPersonPhone || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedConnection && (
              <div
                style={{
                  marginTop: 10,
                  background: 'var(--accent-light)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  ✓ Profile Linked: {selectedConnection.connectionNo || 'PENDING'}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Owner: <strong>{selectedConnection.currentOwner}</strong> | Address:{' '}
                  {selectedConnection.connectionAddress}
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Application Metadata */}
        <div className="grid-3">
          <div className="form-group">
            <label>Token Number *</label>
            <input
              type="text"
              {...register('applicationTokenNo', { required: true })}
              placeholder="e.g. APP-10292"
            />
            {errors.applicationTokenNo && <span className="error-text">Required</span>}
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

        {/* Dynamic Service Specific Forms */}

        {/* 1. New Connection */}
        {serviceType === 'NewConnection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                borderBottom: '2px solid var(--border)',
                paddingBottom: 6,
              }}
            >
              Applicant & Connection Details
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Applicant Name *</label>
                <input
                  type="text"
                  {...register('customerName', { required: true })}
                  placeholder="Full name of applicant"
                />
                {errors.customerName && <span className="error-text">Required</span>}
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" {...register('phone')} placeholder="e.g. 9876543210" />
                {showAutoFillIndicator && (
                  <span
                    className="success-text"
                    style={{ fontSize: 11, display: 'block', marginTop: 4 }}
                  >
                    ✓ Auto-filled profile details
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Connection Address *</label>
              <textarea
                {...register('connectionAddress', { required: true })}
                placeholder="Full address where connection will be installed"
                rows={2}
              />
              {errors.connectionAddress && <span className="error-text">Required</span>}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Usage Type *</label>
                <Controller
                  control={control}
                  name="currentUsage"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value || 'Domestic'}
                      onChange={onChange}
                      options={[
                        { value: 'Domestic', label: 'Domestic' },
                        { value: 'Commercial', label: 'Commercial' },
                        { value: 'Industrial', label: 'Industrial' },
                        { value: 'Institutional', label: 'Institutional' },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="form-group">
                <label>Meter Serial No (optional)</label>
                <input type="text" {...register('meterDetails')} placeholder="e.g. ME-19202" />
              </div>
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                borderBottom: '2px solid var(--border)',
                paddingBottom: 6,
                marginTop: 8,
              }}
            >
              Plumber Information
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Plumber Name</label>
                <input
                  type="text"
                  {...register('plumberName')}
                  placeholder="Licensed plumber name"
                />
              </div>
              <div className="form-group">
                <label>Plumber Phone</label>
                <input
                  type="text"
                  {...register('plumberPhone')}
                  placeholder="Plumber contact number"
                />
              </div>
            </div>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="isContactSameAsPlumber"
                {...register('isContactSameAsPlumber')}
              />
              <label
                htmlFor="isContactSameAsPlumber"
                style={{ cursor: 'pointer', fontWeight: 600 }}
              >
                Contact Person details same as Plumber details
              </label>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Contact Person Name</label>
                <input
                  type="text"
                  {...register('contactPersonName')}
                  placeholder="Alternative contact name"
                  disabled={isContactSameAsPlumber}
                  style={
                    isContactSameAsPlumber ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                  }
                />
              </div>
              <div className="form-group">
                <label>Contact Person Phone</label>
                <input
                  type="text"
                  {...register('contactPersonPhone')}
                  placeholder="Alternative contact phone"
                  disabled={isContactSameAsPlumber}
                  style={
                    isContactSameAsPlumber ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Connection Transfer */}
        {serviceType === 'ConnectionTransfer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                borderBottom: '2px solid var(--border)',
                paddingBottom: 6,
              }}
            >
              Ownership Transfer Details
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Transfer Subtype *</label>
                <Controller
                  control={control}
                  name="transferSubtype"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value || 'Purchase'}
                      onChange={onChange}
                      options={[
                        { value: 'Purchase', label: 'By Purchase' },
                        { value: 'Inheritance', label: 'By Inheritance' },
                        { value: 'GiftDeed', label: 'By Gift Deed' },
                        { value: 'SubDivision', label: 'By Property Sub-Division' },
                        { value: 'CourtOrder', label: 'By Court Order' },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="form-group">
                <label>Current Owner (Old)</label>
                <input
                  type="text"
                  {...register('currentOwner')}
                  readOnly
                  style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>New Owner Name *</label>
                <input
                  type="text"
                  {...register('newOwnerName', { required: true })}
                  placeholder="Name of recipient owner"
                />
                {errors.newOwnerName && <span className="error-text">Required</span>}
              </div>
              <div className="form-group">
                <label>New Owner Phone *</label>
                <input
                  type="text"
                  {...register('newOwnerPhone', { required: true })}
                  placeholder="Mobile number of recipient"
                />
                {errors.newOwnerPhone && <span className="error-text">Required</span>}
              </div>
            </div>
          </div>
        )}

        {/* 3. Change of Usage */}
        {serviceType === 'ChangeOfUse' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                borderBottom: '2px solid var(--border)',
                paddingBottom: 6,
              }}
            >
              Usage Conversion Details
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Current Usage</label>
                <input
                  type="text"
                  {...register('currentUsage')}
                  readOnly
                  style={{ background: 'var(--bg)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Proposed New Usage *</label>
                <Controller
                  control={control}
                  name="newUsage"
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <NeoSelect
                      value={value || 'Domestic'}
                      onChange={onChange}
                      options={[
                        { value: 'Domestic', label: 'Domestic' },
                        { value: 'Commercial', label: 'Commercial' },
                        { value: 'Industrial', label: 'Industrial' },
                        { value: 'Institutional', label: 'Institutional' },
                      ]}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* General Remarks */}
        <div className="form-group">
          <label>Remarks / Notes (optional)</label>
          <input
            type="text"
            {...register('remarks')}
            placeholder="e.g. Urgent request, special clearance"
          />
        </div>

        {/* Pricing Summary Block */}
        <div
          style={{
            border: '2.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--accent-light)',
            padding: 16,
            boxShadow: '3px 3px 0 var(--border)',
          }}
        >
          <div
            style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', marginBottom: 12 }}
          >
            Fee Calculation
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 16,
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Official Fee (₹)</label>
              <input
                type="number"
                {...register('officialFee', { valueAsNumber: true })}
                disabled={!isManualOverrideAllowed}
                style={
                  !isManualOverrideAllowed ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Service Fee (₹)</label>
              <input
                type="number"
                {...register('serviceFee', { valueAsNumber: true })}
                disabled={!isManualOverrideAllowed}
                style={
                  !isManualOverrideAllowed ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Protocol Fee (₹)</label>
              <input
                type="number"
                {...register('protocolFee', { valueAsNumber: true })}
                disabled={!isManualOverrideAllowed}
                style={
                  !isManualOverrideAllowed ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Misc Fee (₹)</label>
              <input
                type="number"
                {...register('miscFee', { valueAsNumber: true })}
                disabled={!isManualOverrideAllowed}
                style={
                  !isManualOverrideAllowed ? { background: 'var(--bg)', cursor: 'not-allowed' } : {}
                }
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Discount (₹)</label>
              <input type="number" {...register('discount', { valueAsNumber: true })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontWeight: 800 }}>Total Fee Charged</label>
              <input
                type="number"
                {...register('amountCharged', { valueAsNumber: true })}
                style={{
                  fontWeight: 800,
                  color: 'var(--primary)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              saveMutation.isPending || (serviceType !== 'NewConnection' && !selectedConnection)
            }
            style={{ flex: 1 }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Register Service Request'}
          </button>
          <button type="button" className="btn" onClick={handleClear} style={{ width: 120 }}>
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
