import { useState, useEffect } from 'react';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import Modal from '@/components/Modal';
import { SubTab, RecordTypeBySubTab } from '@/types';
import styles from './RecordEditModal.module.css';

interface RecordEditModalProps<T extends SubTab> {
  type: T;
  record: RecordTypeBySubTab<T>;
  onClose: () => void;
  onSave: (data: Partial<RecordTypeBySubTab<T>>) => void;
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

export default function RecordEditModal<T extends SubTab>({
  type,
  record,
  onClose,
  onSave,
  saving,
}: RecordEditModalProps<T>) {
  const [form, setForm] = useState<Record<string, unknown>>({
    ...(record as unknown as Record<string, unknown>),
  });
  const getStr = (key: string): string => (form[key] as string) || '';
  const getNum = (key: string): number => (form[key] as number) || 0;
  const [acknowledgedAmountChange, setAcknowledgedAmountChange] = useState(false);

  const hasAutoFees = [
    'passports',
    'panCards',
    'voterCards',
    'gazettes',
    'waterSupplies',
    'propertyTaxes',
  ].includes(type);

  const PAYMENT_AWARE_TYPES: SubTab[] = ['tradeLicenses', 'waterSupplies', 'propertyTaxes'];
  const isPaymentAware = PAYMENT_AWARE_TYPES.includes(type);

  const payments: { amount: number }[] =
    (isPaymentAware && (record as unknown as { payments?: { amount: number }[] }).payments) || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const hasPayments = totalPaid > 0;

  const originalAmount = Number((record as unknown as { amountCharged?: number }).amountCharged || 0);
  const currentAmount = Number(form.amountCharged || 0);
  const amountChanged = isPaymentAware && hasPayments && currentAmount !== originalAmount;

  useEffect(() => {
    if (hasAutoFees) {
      const official = Number(form.officialFee || 0);
      const service = Number(form.serviceFee || 0);
      const protocol = Number(form.protocolFee || 0);
      const misc = Number(form.miscFee || 0);
      const discount = Number(form.discount || 0);
      const calcTotal = official + service + protocol + misc - discount;
      if (Number(form.amountCharged) !== calcTotal) {
        setForm((prev) => ({
          ...prev,
          amountCharged: calcTotal,
        }));
      }
    }
  }, [form.officialFee, form.serviceFee, form.protocolFee, form.miscFee, form.discount, hasAutoFees]);

  // When amountCharged changes → adjust serviceFee
  useEffect(() => {
    if (!hasAutoFees) return;
    const official = Number(form.officialFee || 0);
    const service = Number(form.serviceFee || 0);
    const protocol = Number(form.protocolFee || 0);
    const misc = Number(form.miscFee || 0);
    const discount = Number(form.discount || 0);
    const calcTotal = official + service + protocol + misc - discount;
    if (Number(form.amountCharged) !== calcTotal) {
      setForm((prev) => ({
        ...prev,
        serviceFee: Math.max(0, Number(form.amountCharged) - (official + protocol + misc - discount)),
      }));
    }
  }, [form.amountCharged, hasAutoFees]);

  const handleChange = (key: string, val: unknown) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const payload = { ...form } as Record<string, unknown>;

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
      'serviceType',
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
      'depositFee',
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
    onSave(payload as unknown as Partial<RecordTypeBySubTab<T>>);
  };

  const renderPersonalFields = () => {
    const isMarriages = type === 'marriages';
    const isGazetteOrTax = type === 'gazettes' || type === 'propertyTaxes';
    return (
      <div className="grid-2">
        <div className="form-group">
          <label>
            {isMarriages ? 'Contact name' : isGazetteOrTax ? 'Applicant name' : 'Customer name'}
          </label>
          <input
            value={getStr('customerName') || getStr('contactName')}
            onChange={(e) =>
              handleChange(isMarriages ? 'contactName' : 'customerName', e.target.value)
            }
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input value={getStr('phone')} onChange={(e) => handleChange('phone', e.target.value)} />
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
              <div className="form-group">
                <label>Purpose</label>
                <input
                  value={getStr('purpose')}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Affidavit No.</label>
                <input
                  value={getStr('affidavitNo')}
                  onChange={(e) => handleChange('affidavitNo', e.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Authorizer name</label>
                <input
                  value={getStr('authorizerName')}
                  onChange={(e) => handleChange('authorizerName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Remark (Reason for discount)</label>
              <input
                value={getStr('remark')}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
            </div>
          </>
        );
      case 'birthDeath':
        return (
          <>
            <div className="form-group">
              <label>Person name</label>
              <input
                value={getStr('personName')}
                onChange={(e) => handleChange('personName', e.target.value)}
              />
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label>Event date</label>
                <NeoDatePicker
                  value={getStr('eventDate')}
                  onChange={(val) => handleChange('eventDate', val)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
              <div className="form-group">
                <label>No. of copies</label>
                <input
                  type="number"
                  value={getNum('numberOfCopies')}
                  onChange={(e) => handleChange('numberOfCopies', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </>
        );
      case 'shopAct':
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Business name</label>
                <input
                  value={getStr('businessName')}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  value={getStr('email')}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Date of service</label>
              <NeoDatePicker
                value={getStr('dateOfService')}
                onChange={(val) => handleChange('dateOfService', val)}
              />
            </div>
          </>
        );
      case 'marriages':
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Husband</label>
                <input
                  value={getStr('spouse1Name')}
                  onChange={(e) => handleChange('spouse1Name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Wife</label>
                <input
                  value={getStr('spouse2Name')}
                  onChange={(e) => handleChange('spouse2Name', e.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Marriage date</label>
                <NeoDatePicker
                  value={getStr('marriageDate')}
                  onChange={(val) => handleChange('marriageDate', val)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Application No.</label>
              <input
                value={getStr('applicationNo')}
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
              <div className="form-group">
                <label>Token number</label>
                <input
                  value={getStr('tokenNo')}
                  onChange={(e) => handleChange('tokenNo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label>Official fee (₹)</label>
                <input
                  type="number"
                  value={getNum('officialFee')}
                  onChange={(e) => handleChange('officialFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Service fee (₹)</label>
                <input
                  type="number"
                  value={getNum('serviceFee')}
                  onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Protocol fee (₹)</label>
                <input
                  type="number"
                  value={getNum('protocolFee')}
                  onChange={(e) => handleChange('protocolFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Misc fee (₹)</label>
                <input
                  type="number"
                  value={getNum('miscFee')}
                  onChange={(e) => handleChange('miscFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Total charged (₹)</label>
                <input
                  type="number"
                  value={getNum('amountCharged')}
                  onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </>
        );
      case 'propertyCards':
        return (
          <>
            <div className="form-group">
              <label>Record type</label>
              <NeoSelect
                value={getStr('recordType')}
                onChange={(val) => handleChange('recordType', val)}
                options={[
                  { value: 'Property Card', label: 'Property Card' },
                  { value: '7/12 Card', label: '7/12 Card' },
                  { value: '8A', label: '8A' },
                ]}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Property number</label>
                <input
                  value={getStr('propertyNumber')}
                  onChange={(e) => handleChange('propertyNumber', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
          </>
        );
      case 'passports':
        return (
          <div className="grid-3">
            <div className="form-group">
              <label>File No.</label>
              <input
                value={getStr('fileNo')}
                onChange={(e) => handleChange('fileNo', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Appointment date</label>
              <NeoDatePicker
                value={getStr('appointmentDate')}
                onChange={(val) => handleChange('appointmentDate', val)}
              />
            </div>
            <div className="form-group">
              <label>Date of service</label>
              <NeoDatePicker
                value={getStr('dateOfService')}
                onChange={(val) => handleChange('dateOfService', val)}
              />
            </div>
          </div>
        );
      case 'panCards':
        return (
          <div className="grid-2">
            <div className="form-group">
              <label>Acknowledgement No.</label>
              <input
                value={getStr('ackNo')}
                onChange={(e) => handleChange('ackNo', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Date of service</label>
              <NeoDatePicker
                value={getStr('dateOfService')}
                onChange={(val) => handleChange('dateOfService', val)}
              />
            </div>
          </div>
        );
      case 'voterCards':
        return (
          <>
            <div className="form-group">
              <label>Application Type</label>
              <NeoSelect
                value={getStr('applicationType')}
                onChange={(val) => handleChange('applicationType', val)}
                options={[
                  { value: 'New', label: 'New Voter Card' },
                  { value: 'Correction', label: 'Voter Card Correction' },
                  { value: 'Name Deletion', label: 'Name Deletion' },
                  { value: 'Address Change', label: 'Address Change' },
                ]}
              />
            </div>
            <div className="grid-2">
              {form.applicationType === 'New' ? (
                <div className="form-group">
                  <label>Token No. <span className="required-star">*</span></label>
                  <input
                    value={getStr('tokenNo')}
                    onChange={(e) => handleChange('tokenNo', e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>EPIC No. <span className="required-star">*</span></label>
                  <input
                    value={getStr('epicNo')}
                    onChange={(e) => handleChange('epicNo', e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
          </>
        );
      case 'gazettes':
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Old name</label>
                <input
                  value={getStr('oldName')}
                  onChange={(e) => handleChange('oldName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>New name</label>
                <input
                  value={getStr('newName')}
                  onChange={(e) => handleChange('newName', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason to Change Name</label>
              <textarea
                value={getStr('reasonToChangeName')}
                onChange={(e) => handleChange('reasonToChangeName', e.target.value)}
                rows={2}
                className={styles.textarea}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Token No.</label>
                <input
                  value={getStr('tokenNo')}
                  onChange={(e) => handleChange('tokenNo', e.target.value)}
                  placeholder="e.g. TOK123456"
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
          </>
        );
      case 'waterSupplies':
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Connection Address</label>
                <input
                  value={getStr('connectionAddress')}
                  onChange={(e) => handleChange('connectionAddress', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Token Number</label>
                <input
                  value={getStr('applicationTokenNo')}
                  onChange={(e) => handleChange('applicationTokenNo', e.target.value)}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Application Date</label>
                <NeoDatePicker
                  value={getStr('applicationDate')}
                  onChange={(val) => handleChange('applicationDate', val)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
            </div>
            {form.serviceType === 'NewConnection' && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Plumber Name</label>
                    <input
                      value={getStr('plumberName')}
                      onChange={(e) => handleChange('plumberName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Plumber Phone</label>
                    <input
                      value={getStr('plumberPhone')}
                      onChange={(e) => handleChange('plumberPhone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Contact Person Name</label>
                    <input
                      value={getStr('contactPersonName')}
                      onChange={(e) => handleChange('contactPersonName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Person Phone</label>
                    <input
                      value={getStr('contactPersonPhone')}
                      onChange={(e) => handleChange('contactPersonPhone', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            {form.serviceType === 'ConnectionTransfer' && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Connection Number</label>
                    <input
                      value={getStr('connectionNo')}
                      onChange={(e) => handleChange('connectionNo', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Owner</label>
                    <input
                      value={getStr('currentOwner')}
                      onChange={(e) => handleChange('currentOwner', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>New Owner Name</label>
                    <input
                      value={getStr('newOwnerName')}
                      onChange={(e) => handleChange('newOwnerName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Owner Phone</label>
                    <input
                      value={getStr('newOwnerPhone')}
                      onChange={(e) => handleChange('newOwnerPhone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Transfer Subtype</label>
                  <NeoSelect
                    value={getStr('transferSubtype')}
                    onChange={(val) => handleChange('transferSubtype', val)}
                    options={[
                      { value: 'Purchase', label: 'Purchase' },
                      { value: 'Inheritance', label: 'Inheritance' },
                      { value: 'GiftDeed', label: 'Gift Deed' },
                      { value: 'SubDivision', label: 'Property sub-division' },
                      { value: 'CourtOrder', label: 'By Court Order' },
                    ]}
                  />
                </div>
              </>
            )}
            {form.serviceType === 'ChangeOfUse' && (
              <>
                <div className="form-group">
                  <label>Connection Number</label>
                  <input
                    value={getStr('connectionNo')}
                    onChange={(e) => handleChange('connectionNo', e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Current Usage</label>
                    <input
                      value={getStr('currentUsage')}
                      onChange={(e) => handleChange('currentUsage', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Usage</label>
                    <input
                      value={getStr('newUsage')}
                      onChange={(e) => handleChange('newUsage', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            {[
              'MeterDisconnection',
              'MeterReconnection',
              'NoDuesCertificate',
              'MeterInspection',
            ].includes(getStr('serviceType')) && (
              <div className="form-group">
                <label>Connection Number</label>
                <input
                  value={getStr('connectionNo')}
                  onChange={(e) => handleChange('connectionNo', e.target.value)}
                />
              </div>
            )}
          </>
        );
      case 'propertyTaxes':
        return (
          <>
            <div className="form-group">
              <label>Address</label>
              <input
                value={getStr('address')}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Property Tax No.</label>
                <input
                  value={getStr('propertyTaxNo')}
                  onChange={(e) => handleChange('propertyTaxNo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date of service</label>
                <NeoDatePicker
                  value={getStr('dateOfService')}
                  onChange={(val) => handleChange('dateOfService', val)}
                />
              </div>
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
      const isWater = type === 'waterSupplies';
      return (
        <>
          <div className={isTax || isWater ? 'grid-3' : 'grid-2'}>
            <div className="form-group">
              <label>Official Fee (₹)</label>
              <input
                type="number"
                value={getNum('officialFee')}
                onChange={(e) => handleChange('officialFee', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label>Service Fee (₹)</label>
              <input
                type="number"
                value={getNum('serviceFee')}
                onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value) || 0)}
              />
            </div>
            {(isTax || isWater) && (
              <div className="form-group">
                <label>Protocol Fee (₹)</label>
                <input
                  type="number"
                  value={getNum('protocolFee')}
                  onChange={(e) => handleChange('protocolFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>
          {isWater && (
            <div className="grid-2">
              <div className="form-group">
                <label>Misc Fee (₹)</label>
                <input
                  type="number"
                  value={getNum('miscFee')}
                  onChange={(e) => handleChange('miscFee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Discount (₹)</label>
                <input
                  type="number"
                  value={getNum('discount')}
                  onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Total Amount Charged (₹)</label>
            <input
              type="number"
              value={getNum('amountCharged')}
              onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
            />
          </div>
        </>
      );
    }

    if (type === 'affidavits' && getStr('authorizerType') === 'Notary') {
      return (
        <div className="grid-2">
          <div className="form-group">
            <label>Notary Public Fee (₹)</label>
            <input
              type="number"
              value={getNum('notaryPublicFee')}
              onChange={(e) => handleChange('notaryPublicFee', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={getNum('amountCharged')}
              onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="form-group">
        <label>Amount (₹)</label>
        <input
          type="number"
          value={getNum('amountCharged')}
          onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value) || 0)}
        />
      </div>
    );
  };

  return (
    <Modal title={TITLES[type] || 'Edit Record'} onClose={onClose}>
      {isPaymentAware && hasPayments && (
        <div className={styles.paymentNotice}>
          💳 <strong>₹{totalPaid.toLocaleString('en-IN')}</strong> already paid ({payments.length}{' '}
          payment{payments.length > 1 ? 's' : ''}) · Balance at original amount:{' '}
          <strong>₹{(originalAmount - totalPaid).toLocaleString('en-IN')}</strong>
        </div>
      )}
      {renderPersonalFields()}
      {renderServiceFields()}
      {renderFeeFields()}
      {amountChanged && (
        <div className={styles.warningBox}>
          <strong>
            ⚠ This record has ₹{totalPaid.toLocaleString('en-IN')} already paid against it.
          </strong>
          <div className={styles.warningRow}>
            <span>Original amount:</span>
            <span>₹{originalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.warningRowBold}>
            <span>New amount:</span>
            <span>
              ₹{currentAmount.toLocaleString('en-IN')} ({currentAmount > originalAmount ? '+' : ''}₹
              {(currentAmount - originalAmount).toLocaleString('en-IN')})
            </span>
          </div>
          <label className={styles.ackLabel}>
            <input
              type="checkbox"
              checked={acknowledgedAmountChange}
              onChange={(e) => setAcknowledgedAmountChange(e.target.checked)}
              className={styles.ackCheckbox}
            />
            <span className={styles.ackText}>
              I understand this record has existing payments and want to proceed anyway.
            </span>
          </label>
        </div>
      )}
      <div className={styles.buttonRow}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || (amountChanged && !acknowledgedAmountChange)}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}