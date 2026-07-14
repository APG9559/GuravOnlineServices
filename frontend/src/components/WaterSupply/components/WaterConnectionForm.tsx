import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import { FormValues } from '../hooks/useWaterSupplyForm';

interface WaterConnectionFormProps {
  today: string;
  showAutoFillIndicator: boolean;
  serviceTypeWatch: string;
  defaultOfficial: number;
  defaultService: number;
  isSaving: boolean;
  onClear: () => void;
}

export default function WaterConnectionForm({
  today,
  showAutoFillIndicator,
  serviceTypeWatch,
  defaultOfficial,
  defaultService,
  isSaving,
  onClear,
}: WaterConnectionFormProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();
  const isContactSameAsPlumber = watch('isContactSameAsPlumber');
  const plumberName = watch('plumberName');
  const plumberPhone = watch('plumberPhone');

  useEffect(() => {
    if (isContactSameAsPlumber) {
      setValue('contactPersonName', plumberName || '');
      setValue('contactPersonPhone', plumberPhone || '');
    }
  }, [isContactSameAsPlumber, plumberName, plumberPhone, setValue]);

  return (
    <>
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
          <label>Customer Name *</label>
          <input
            {...register('customerName', { required: true })}
            placeholder="Full name of applicant"
          />
          {errors.customerName && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
          )}
          {showAutoFillIndicator && (
            <span style={{ color: 'var(--success)', fontSize: 11, display: 'block', marginTop: 4 }}>
              ✓ Auto-filled customer profile details
            </span>
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
        {errors.connectionAddress && (
          <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
        )}
      </div>

      <div className="grid-3" style={{ marginTop: 16 }}>
        <div className="form-group">
          <label>Application Token No. *</label>
          <input
            {...register('applicationTokenNo', { required: true })}
            placeholder="e.g. TOK102392"
          />
          {errors.applicationTokenNo && (
            <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
          )}
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
      <div
        style={{
          border: '2px dashed var(--border-color)',
          borderRadius: 8,
          padding: 16,
          marginTop: 24,
          marginBottom: 24,
          background: '#fafafa',
        }}
      >
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Specific service options
        </div>

        {/* NEW CONNECTION FIELDS */}
        {serviceTypeWatch === 'NewConnection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid-2">
              <div className="form-group">
                <label>Plumber Name</label>
                <input {...register('plumberName')} placeholder="Licensed plumber name" />
              </div>
              <div className="form-group">
                <label>Plumber Mobile No.</label>
                <input {...register('plumberPhone')} placeholder="Plumber phone number" />
              </div>
            </div>

            <div className="checkbox-row" style={{ margin: '8px 0' }}>
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
                  {...register('contactPersonName')}
                  placeholder="Alternative contact name"
                  readOnly={isContactSameAsPlumber}
                  style={
                    isContactSameAsPlumber ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}
                  }
                />
              </div>
              <div className="form-group">
                <label>Contact Mobile No.</label>
                <input
                  {...register('contactPersonPhone')}
                  placeholder="Alternative contact phone"
                  readOnly={isContactSameAsPlumber}
                  style={
                    isContactSameAsPlumber ? { background: '#f5f5f5', cursor: 'not-allowed' } : {}
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* CONNECTION TRANSFER FIELDS */}
        {serviceTypeWatch === 'ConnectionTransfer' && (
          <div>
            <div className="grid-2">
              <div className="form-group">
                <label>Connection No. *</label>
                <input
                  {...register('connectionNo', { required: true })}
                  placeholder="Existing connection ID"
                />
                {errors.connectionNo && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
                )}
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
                        { value: 'CourtOrder', label: 'By Court Order' },
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
                <input
                  {...register('newOwnerName', { required: true })}
                  placeholder="New owner name"
                />
                {errors.newOwnerName && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
                )}
              </div>
              <div className="form-group">
                <label>New Owner Mobile No.</label>
                <input
                  {...register('newOwnerPhone', { required: false, pattern: /^\+?[0-9]{7,15}$/ })}
                  placeholder="New owner mobile number"
                />
                {errors.newOwnerPhone && (
                  <span style={{ color: 'var(--danger)', fontSize: 12 }}>
                    Enter a valid mobile number
                  </span>
                )}
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
            <input
              {...register('connectionNo', { required: true })}
              placeholder="Existing connection ID"
            />
            {errors.connectionNo && (
              <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
            )}
          </div>
        )}

        {/* CHANGE OF USE FIELDS */}
        {serviceTypeWatch === 'ChangeOfUse' && (
          <div>
            <div className="form-group">
              <label>Connection No. *</label>
              <input
                {...register('connectionNo', { required: true })}
                placeholder="Existing connection ID"
              />
              {errors.connectionNo && (
                <span style={{ color: 'var(--danger)', fontSize: 12 }}>Required</span>
              )}
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
            {...register('amountCharged', { required: true, min: 0, valueAsNumber: true })}
            style={{ fontWeight: 600 }}
          />
        </div>
      </div>

      {/* Submits */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save record'}
        </button>
        <button type="button" className="btn" onClick={onClear}>
          Clear
        </button>
      </div>
    </>
  );
}
