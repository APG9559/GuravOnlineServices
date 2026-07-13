import { useState, useEffect } from 'react';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import Modal from '@/components/Modal';
import { SubTab, RecordTypeBySubTab } from '@/types';

interface RecordEditModalProps<T extends SubTab> {
  type: T;
  record: RecordTypeBySubTab<T>;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}

const TITLES: Record<SubTab, string> = {
  affidavits: 'Edit affidavit',
  birthDeath: 'Edit birth/death record',
  shopAct: 'Edit shop act license',
  marriages: 'Edit marriage record',
  tradeLicenses: 'Edit trade license service record',
  propertyCards: 'Edit property card',
  passports: 'Edit Passport Record',
  panCards: 'Edit PAN Card Record',
  voterCards: 'Edit Voter Card Record',
  gazettes: 'Edit Gazette Record',
  waterSupplies: 'Edit Water Supply Record',
  propertyTaxes: 'Edit Property Tax Record',
};

export default function RecordEditModal<T extends SubTab>({ type, record, onClose, onSave, saving }: RecordEditModalProps<T>) {
  const [form, setForm] = useState<any>({ ...record });
  const [acknowledgedAmountChange, setAcknowledgedAmountChange] = useState(false);

  const hasAutoFees = ['passports', 'panCards', 'voterCards', 'gazettes', 'waterSupplies', 'propertyTaxes'].includes(type);

  const PAYMENT_AWARE_TYPES: SubTab[] = ['tradeLicenses', 'waterSupplies'];
  const isPaymentAware = PAYMENT_AWARE_TYPES.includes(type);

  const payments: { amount: number }[] = (isPaymentAware && (record as any).payments) || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const hasPayments = totalPaid > 0;

  const originalAmount = Number((record as any).amountCharged || 0);
  const currentAmount  = Number(form.amountCharged || 0);
  const amountChanged  = isPaymentAware && hasPayments && currentAmount !== originalAmount;


  useEffect(() => {
    if (hasAutoFees) {
      const official = Number(form.officialFee || 0);
      const service = Number(form.serviceFee || 0);
      const protocol = Number(form.protocolFee || 0);
      setForm((prev: any) => ({
        ...prev,
        amountCharged: official + service + protocol
      }));
    }
  }, [form.officialFee, form.serviceFee, form.protocolFee, hasAutoFees]);

  const handleChange = (key: string, val: any) => {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const payload = { ...form };

    // Remove metadata and relationship fields to prevent validation errors on strict backend DTOs
    const keysToRemove = [
      'id',
      'createdAt',
      'updatedAt',
      'deletedAt',
      'createdBy',
      'createdById',
      'updatedById',
      'payments',
      'business',
      'customer',
      'user',
      'signature',
      '__entity',
      'ticket',
      'marriage',
      'affidavits',
      'linkedAffidavit',
      'linkedPropertyCard',
      'linkedShopAct',
      'connection',
      'documents',
      'serviceType'
    ];
    keysToRemove.forEach((key) => {
      delete payload[key];
    });

    if (type === 'waterSupplies') {
      delete payload.address;
      delete payload.currentOwner;
    }

    // Convert numeric/fee fields to numbers to prevent validation type mismatches
    const numericFields = [
      'amountCharged',
      'officialFee',
      'serviceFee',
      'protocolFee',
      'miscFee',
      'notaryPublicFee',
      'numberOfCopies',
      'discount',
      'courtFeeTickets',
      'consultancyFee',
      'licenseFee',
      'fireFee',
      'depositFee'
    ];
    numericFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
        payload[field] = Number(payload[field]);
      } else {
        delete payload[field];
      }
    });

    if (type === 'waterSupplies' && payload.serviceType === 'ConnectionTransfer') {
      payload.customerName = payload.newOwnerName;
      payload.phone = payload.newOwnerPhone;
    }

    if (type === 'voterCards') {
      if (payload.applicationType === 'New') {
        payload.epicNo = null;
      } else {
        payload.tokenNo = null;
      }
    }
    onSave(payload);
  };

  const renderPersonalFields = () => {
    const isMarriages = type === 'marriages';
    const isGazetteOrTax = type === 'gazettes' || type === 'propertyTaxes';
    return (
      <div className="grid-2">
        <div className="form-group">
          <label>{isMarriages ? 'Contact name' : isGazetteOrTax ? 'Applicant name' : 'Customer name'}</label>
          <input value={form.customerName || form.contactName || ''} onChange={(e) => handleChange(isMarriages ? 'contactName' : 'customerName', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>
      </div>
    );
  };

  const renderServiceFields = () => {
    switch (type) {
      case 'affidavits':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Purpose</label><input value={form.purpose || ''} onChange={(e) => handleChange('purpose', e.target.value)} /></div>
              <div className="form-group"><label>Affidavit No.</label><input value={form.affidavitNo || ''} onChange={(e) => handleChange('affidavitNo', e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Authorizer name</label><input value={form.authorizerName || ''} onChange={(e) => handleChange('authorizerName', e.target.value)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
            <div className="form-group"><label>Remark (Reason for discount)</label><input value={form.remark || ''} onChange={(e) => handleChange('remark', e.target.value)} /></div>
          </>
        );
      case 'birthDeath':
        return (
          <>
            <div className="form-group"><label>Person name</label><input value={form.personName || ''} onChange={(e) => handleChange('personName', e.target.value)} /></div>
            <div className="grid-3">
              <div className="form-group"><label>Event date</label><NeoDatePicker value={form.eventDate} onChange={(val) => handleChange('eventDate', val)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
              <div className="form-group"><label>No. of copies</label><input type="number" value={form.numberOfCopies || 0} onChange={(e) => handleChange('numberOfCopies', parseInt(e.target.value) || 0)} /></div>
            </div>
          </>
        );
      case 'shopAct':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Business name</label><input value={form.businessName || ''} onChange={(e) => handleChange('businessName', e.target.value)} /></div>
              <div className="form-group"><label>Email</label><input value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
          </>
        );
      case 'marriages':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Husband</label><input value={form.spouse1Name || ''} onChange={(e) => handleChange('spouse1Name', e.target.value)} /></div>
              <div className="form-group"><label>Wife</label><input value={form.spouse2Name || ''} onChange={(e) => handleChange('spouse2Name', e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Marriage date</label><NeoDatePicker value={form.marriageDate} onChange={(val) => handleChange('marriageDate', val)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
            <div className="form-group">
              <label>Application No.</label>
              <input
                value={form.applicationNo || ''}
                onChange={(e) => handleChange('applicationNo', e.target.value)}
                placeholder="e.g. marriage application number"
              />
            </div>
          </>
        );
      case 'tradeLicenses':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Token number</label><input value={form.tokenNo || ''} onChange={(e) => handleChange('tokenNo', e.target.value)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
            <div className="grid-3">
              <div className="form-group"><label>Official fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => handleChange('officialFee', parseFloat(e.target.value) || 0)} /></div>
              <div className="form-group"><label>Service fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value) || 0)} /></div>
              <div className="form-group"><label>Protocol fee (₹)</label><input type="number" value={form.protocolFee || 0} onChange={(e) => handleChange('protocolFee', parseFloat(e.target.value) || 0)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Misc fee (₹)</label><input type="number" value={form.miscFee || 0} onChange={(e) => handleChange('miscFee', parseFloat(e.target.value) || 0)} /></div>
              <div className="form-group"><label>Total charged (₹)</label><input type="number" value={form.amountCharged || 0} onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)} /></div>
            </div>
          </>
        );
      case 'propertyCards':
        return (
          <>
            <div className="form-group">
              <label>Record type</label>
              <NeoSelect
                value={form.recordType}
                onChange={(val) => handleChange('recordType', val)}
                options={[
                  { value: 'Property Card', label: 'Property Card' },
                  { value: '7/12 Card', label: '7/12 Card' },
                  { value: '8A', label: '8A' }
                ]}
              />
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Property number</label><input value={form.propertyNumber || ''} onChange={(e) => handleChange('propertyNumber', e.target.value)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
          </>
        );
      case 'passports':
        return (
          <div className="grid-3">
            <div className="form-group"><label>File No.</label><input value={form.fileNo || ''} onChange={(e) => handleChange('fileNo', e.target.value)} /></div>
            <div className="form-group"><label>Appointment date</label><NeoDatePicker value={form.appointmentDate || ''} onChange={(val) => handleChange('appointmentDate', val)} /></div>
            <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
          </div>
        );
      case 'panCards':
        return (
          <div className="grid-2">
            <div className="form-group"><label>Acknowledgement No.</label><input value={form.ackNo || ''} onChange={(e) => handleChange('ackNo', e.target.value)} /></div>
            <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
          </div>
        );
      case 'voterCards':
        return (
          <>
            <div className="form-group">
              <label>Application Type</label>
              <NeoSelect
                value={form.applicationType}
                onChange={(val) => handleChange('applicationType', val)}
                options={[
                  { value: 'New', label: 'New Voter Card' },
                  { value: 'Correction', label: 'Voter Card Correction' },
                  { value: 'Name Deletion', label: 'Name Deletion' },
                  { value: 'Address Change', label: 'Address Change' }
                ]}
              />
            </div>
            <div className="grid-2">
              {form.applicationType === 'New' ? (
                <div className="form-group"><label>Token No. *</label><input value={form.tokenNo || ''} onChange={(e) => handleChange('tokenNo', e.target.value)} /></div>
              ) : (
                <div className="form-group"><label>EPIC No. *</label><input value={form.epicNo || ''} onChange={(e) => handleChange('epicNo', e.target.value)} /></div>
              )}
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
          </>
        );
      case 'gazettes':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Old name</label><input value={form.oldName || ''} onChange={(e) => handleChange('oldName', e.target.value)} /></div>
              <div className="form-group"><label>New name</label><input value={form.newName || ''} onChange={(e) => handleChange('newName', e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label>Reason to Change Name</label>
              <textarea
                value={form.reasonToChangeName || ''}
                onChange={(e) => handleChange('reasonToChangeName', e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Token No.</label><input value={form.tokenNo || ''} onChange={(e) => handleChange('tokenNo', e.target.value)} placeholder="e.g. TOK123456" /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
          </>
        );
      case 'waterSupplies':
        return (
          <>
            <div className="grid-2">
              <div className="form-group"><label>Connection Address</label><input value={form.connectionAddress || ''} onChange={(e) => handleChange('connectionAddress', e.target.value)} /></div>
              <div className="form-group"><label>Token Number</label><input value={form.applicationTokenNo || ''} onChange={(e) => handleChange('applicationTokenNo', e.target.value)} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Application Date</label><NeoDatePicker value={form.applicationDate} onChange={(val) => handleChange('applicationDate', val)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
            {form.serviceType === 'NewConnection' && (
              <>
                <div className="grid-2">
                  <div className="form-group"><label>Plumber Name</label><input value={form.plumberName || ''} onChange={(e) => handleChange('plumberName', e.target.value)} /></div>
                  <div className="form-group"><label>Plumber Phone</label><input value={form.plumberPhone || ''} onChange={(e) => handleChange('plumberPhone', e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label>Contact Person Name</label><input value={form.contactPersonName || ''} onChange={(e) => handleChange('contactPersonName', e.target.value)} /></div>
                  <div className="form-group"><label>Contact Person Phone</label><input value={form.contactPersonPhone || ''} onChange={(e) => handleChange('contactPersonPhone', e.target.value)} /></div>
                </div>
              </>
            )}
            {form.serviceType === 'ConnectionTransfer' && (
              <>
                <div className="grid-2">
                  <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => handleChange('connectionNo', e.target.value)} /></div>
                  <div className="form-group"><label>Current Owner</label><input value={form.currentOwner || ''} onChange={(e) => handleChange('currentOwner', e.target.value)} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label>New Owner Name</label><input value={form.newOwnerName || ''} onChange={(e) => handleChange('newOwnerName', e.target.value)} /></div>
                  <div className="form-group"><label>New Owner Phone</label><input value={form.newOwnerPhone || ''} onChange={(e) => handleChange('newOwnerPhone', e.target.value)} /></div>
                </div>
                <div className="form-group">
                  <label>Transfer Subtype</label>
                  <NeoSelect
                    value={form.transferSubtype || ''}
                    onChange={(val) => handleChange('transferSubtype', val)}
                    options={[
                      { value: 'Purchase', label: 'Purchase' },
                      { value: 'Inheritance', label: 'Inheritance' },
                      { value: 'GiftDeed', label: 'Gift Deed' },
                      { value: 'SubDivision', label: 'Property sub-division' },
                      { value: 'CourtOrder', label: 'By Court Order' }
                    ]}
                  />
                </div>
              </>
            )}
            {form.serviceType === 'ChangeOfUse' && (
              <>
                <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => handleChange('connectionNo', e.target.value)} /></div>
                <div className="grid-2">
                  <div className="form-group"><label>Current Usage</label><input value={form.currentUsage || ''} onChange={(e) => handleChange('currentUsage', e.target.value)} /></div>
                  <div className="form-group"><label>New Usage</label><input value={form.newUsage || ''} onChange={(e) => handleChange('newUsage', e.target.value)} /></div>
                </div>
              </>
            )}
            {['MeterDisconnection', 'MeterReconnection', 'NoDuesCertificate', 'MeterInspection'].includes(form.serviceType) && (
              <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => handleChange('connectionNo', e.target.value)} /></div>
            )}
          </>
        );
      case 'propertyTaxes':
        return (
          <>
            <div className="form-group"><label>Address</label><input value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Property Tax No.</label><input value={form.propertyTaxNo || ''} onChange={(e) => handleChange('propertyTaxNo', e.target.value)} /></div>
              <div className="form-group"><label>Date of service</label><NeoDatePicker value={form.dateOfService} onChange={(val) => handleChange('dateOfService', val)} /></div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderFeeFields = () => {
    if (type === 'tradeLicenses') return null;

    if (hasAutoFees) {
      const isTax = type === 'propertyTaxes';
      return (
        <>
          <div className={isTax ? "grid-3" : "grid-2"}>
            <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => handleChange('officialFee', parseFloat(e.target.value) || 0)} /></div>
            <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value) || 0)} /></div>
            {isTax && <div className="form-group"><label>Protocol Fee (₹)</label><input type="number" value={form.protocolFee || 0} onChange={(e) => handleChange('protocolFee', parseFloat(e.target.value) || 0)} /></div>}
          </div>
          <div className="form-group">
            <label>Total Amount Charged (₹)</label>
            <input type="number" readOnly value={form.amountCharged || 0} style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
          </div>
        </>
      );
    }

    if (type === 'affidavits' && form.authorizerType === 'Notary') {
      return (
        <div className="grid-2">
          <div className="form-group">
            <label>Notary Public Fee (₹)</label>
            <input type="number" value={form.notaryPublicFee || 0} onChange={(e) => handleChange('notaryPublicFee', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" value={form.amountCharged || 0} onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      );
    }

    return (
      <div className="form-group">
        <label>Amount (₹)</label>
        <input type="number" value={form.amountCharged || 0} onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)} />
      </div>
    );
  };

  return (
    <Modal title={TITLES[type] || 'Edit Record'} onClose={onClose}>
      {isPaymentAware && hasPayments && (
        <div style={{
          background: 'var(--accent-light)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--neo-shadow-sm)',
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12,
        }}>
          💳 <strong>₹{totalPaid.toLocaleString('en-IN')}</strong> already paid ({payments.length} payment{payments.length > 1 ? 's' : ''}) · Balance at original amount: <strong>₹{(originalAmount - totalPaid).toLocaleString('en-IN')}</strong>
        </div>
      )}
      {renderPersonalFields()}
      {renderServiceFields()}
      {renderFeeFields()}
      {amountChanged && (
        <div style={{
          background: 'var(--warning-bg)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--neo-shadow-sm)',
          padding: '10px 14px',
          marginTop: 12,
          marginBottom: 4,
          fontSize: 13,
        }}>
          <strong>⚠ This record has ₹{totalPaid.toLocaleString('en-IN')} already paid against it.</strong>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>Original amount:</span>
            <span>₹{originalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>New amount:</span>
            <span>
              ₹{currentAmount.toLocaleString('en-IN')}
              {' '}({currentAmount > originalAmount ? '+' : ''}₹{(currentAmount - originalAmount).toLocaleString('en-IN')})
            </span>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={acknowledgedAmountChange}
              onChange={(e) => setAcknowledgedAmountChange(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span style={{ fontSize: 12 }}>
              I understand this record has existing payments and want to proceed anyway.
            </span>
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || (amountChanged && !acknowledgedAmountChange)}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
