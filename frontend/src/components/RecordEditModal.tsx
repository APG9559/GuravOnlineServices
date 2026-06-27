import { useState, useEffect } from 'react';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import {
  PropertyCard, PassportRecord, PanCardRecord, VoterCardRecord, Gazette, WaterSupply, PropertyTax,
} from '@/types';

type SubTab = 'affidavits' | 'marriages' | 'birthDeath' | 'tradeLicenses' | 'panCards' | 'passports' | 'voterCards' | 'propertyCards' | 'shopAct' | 'gazettes' | 'waterSupplies' | 'propertyTaxes';

interface RecordEditModalProps {
  type: SubTab;
  record: any;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}

export default function RecordEditModal({ type, record, onClose, onSave, saving }: RecordEditModalProps) {
  switch (type) {
    case 'affidavits':
      return (
        <SimpleEditModal
          title="Edit affidavit"
          fields={[
            ['customerName', 'Customer name'],
            ['phone', 'Phone'],
            ['purpose', 'Purpose'],
            ['authorizerName', 'Authorizer name'],
            ['dateOfService', 'Date of service', 'date'],
            ['amountCharged', 'Amount (₹)', 'number'],
            ['remark', 'Remark (Reason for discount)'],
          ]}
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'birthDeath':
      return (
        <SimpleEditModal
          title="Edit birth/death record"
          fields={[
            ['customerName', 'Customer name'],
            ['phone', 'Phone'],
            ['personName', 'Person name'],
            ['eventDate', 'Event date', 'date'],
            ['dateOfService', 'Date of service', 'date'],
            ['numberOfCopies', 'No. of copies', 'number'],
            ['amountCharged', 'Amount (₹)', 'number'],
          ]}
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'shopAct':
      return (
        <SimpleEditModal
          title="Edit shop act license"
          fields={[
            ['customerName', 'Customer name'],
            ['phone', 'Phone'],
            ['businessName', 'Business name'],
            ['email', 'Email'],
            ['dateOfService', 'Date of service', 'date'],
            ['amountCharged', 'Amount (₹)', 'number'],
          ]}
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'marriages':
      return (
        <SimpleEditModal
          title="Edit marriage record"
          fields={[
            ['contactName', 'Contact name'],
            ['phone', 'Phone'],
            ['spouse1Name', 'Husband'],
            ['spouse2Name', 'Wife'],
            ['marriageDate', 'Marriage date', 'date'],
            ['dateOfService', 'Date of service', 'date'],
            ['amountCharged', 'Amount (₹)', 'number'],
          ]}
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'tradeLicenses':
      return (
        <SimpleEditModal
          title="Edit trade license service record"
          fields={[
            ['tokenNo', 'Token number'],
            ['dateOfService', 'Date of service', 'date'],
            ['officialFee', 'Official fee (₹)', 'number'],
            ['serviceFee', 'Service fee (₹)', 'number'],
            ['protocolFee', 'Protocol fee (₹)', 'number'],
            ['miscFee', 'Misc fee (₹)', 'number'],
            ['amountCharged', 'Total charged (₹)', 'number'],
          ]}
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'propertyCards':
      return (
        <PropertyCardEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'passports':
      return (
        <PassportEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'panCards':
      return (
        <PanCardEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'voterCards':
      return (
        <VoterCardEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'gazettes':
      return (
        <GazetteEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'waterSupplies':
      return (
        <WaterSupplyEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    case 'propertyTaxes':
      return (
        <PropertyTaxEditModal
          record={record}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
        />
      );
    default:
      return null;
  }
}

// ── Modals Helper components ──
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem', paddingRight: '2.5rem' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function SimpleEditModal({ title, fields, record, onClose, onSave, saving }: {
  title: string;
  fields: [string, string, string?][];
  record: Record<string, any>;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({ ...record });
  return (
    <Modal title={title} onClose={onClose}>
      {fields.map(([key, label, type]) => (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <input
            type={type || 'text'}
            value={form[key] ?? ''}
            onChange={(e) => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PropertyCardEditModal({ record, onClose, onSave, saving }: {
  record: PropertyCard; onClose: () => void; onSave: (d: Partial<PropertyCard>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });
  return (
    <Modal title="Edit property card" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Record type</label>
        <NeoSelect
          value={form.recordType}
          onChange={(val) => setForm({ ...form, recordType: val as any })}
          options={[
            { value: 'Property Card', label: 'Property Card' },
            { value: '7/12 Card', label: '7/12 Card' },
            { value: '8A', label: '8A' }
          ]}
        />
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Property number</label><input value={form.propertyNumber} onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amountCharged} onChange={(e) => setForm({ ...form, amountCharged: parseFloat(e.target.value) })} /></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PassportEditModal({ record, onClose, onSave, saving }: {
  record: PassportRecord; onClose: () => void; onSave: (d: Partial<PassportRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Passport Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-3">
        <div className="form-group"><label>File No.</label><input value={form.fileNo || ''} onChange={(e) => setForm({ ...form, fileNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Appointment date</label>
          <NeoDatePicker
            value={form.appointmentDate || ''}
            onChange={(val) => setForm({ ...form, appointmentDate: val })}
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PanCardEditModal({ record, onClose, onSave, saving }: {
  record: PanCardRecord; onClose: () => void; onSave: (d: Partial<PanCardRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit PAN Card Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Acknowledgement No.</label><input value={form.ackNo || ''} onChange={(e) => setForm({ ...form, ackNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function VoterCardEditModal({ record, onClose, onSave, saving }: {
  record: VoterCardRecord; onClose: () => void; onSave: (d: Partial<VoterCardRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  const handleSave = () => {
    const payload = { ...form };
    if (payload.applicationType === 'New') {
      payload.epicNo = null as any;
    } else {
      payload.tokenNo = null as any;
    }
    onSave(payload);
  };

  return (
    <Modal title="Edit Voter Card Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Application Type</label>
        <NeoSelect
          value={form.applicationType}
          onChange={(val) => setForm({ ...form, applicationType: val as any })}
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
          <div className="form-group"><label>Token No. *</label><input value={form.tokenNo || ''} onChange={(e) => setForm({ ...form, tokenNo: e.target.value })} /></div>
        ) : (
          <div className="form-group"><label>EPIC No. *</label><input value={form.epicNo || ''} onChange={(e) => setForm({ ...form, epicNo: e.target.value })} /></div>
        )}
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function GazetteEditModal({ record, onClose, onSave, saving }: {
  record: Gazette; onClose: () => void; onSave: (d: Partial<Gazette>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Gazette Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Applicant name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Old name</label><input value={form.oldName} onChange={(e) => setForm({ ...form, oldName: e.target.value })} /></div>
        <div className="form-group"><label>New name</label><input value={form.newName} onChange={(e) => setForm({ ...form, newName: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Reason to Change Name</label>
        <textarea
          value={form.reasonToChangeName}
          onChange={(e) => setForm({ ...form, reasonToChangeName: e.target.value })}
          rows={2}
          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
        />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Token No.</label>
          <input
            value={form.tokenNo || ''}
            onChange={(e) => setForm({ ...form, tokenNo: e.target.value })}
            placeholder="e.g. TOK123456"
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function WaterSupplyEditModal({ record, onClose, onSave, saving }: {
  record: WaterSupply; onClose: () => void; onSave: (d: Partial<WaterSupply>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Water Supply Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Connection Address</label><input value={form.connectionAddress} onChange={(e) => setForm({ ...form, connectionAddress: e.target.value })} /></div>
        <div className="form-group"><label>Token Number</label><input value={form.applicationTokenNo} onChange={(e) => setForm({ ...form, applicationTokenNo: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Application Date</label>
          <NeoDatePicker
            value={form.applicationDate}
            onChange={(val) => setForm({ ...form, applicationDate: val })}
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>

      {form.serviceType === 'NewConnection' && (
        <>
          <div className="grid-2">
            <div className="form-group"><label>Plumber Name</label><input value={form.plumberName || ''} onChange={(e) => setForm({ ...form, plumberName: e.target.value })} /></div>
            <div className="form-group"><label>Plumber Phone</label><input value={form.plumberPhone || ''} onChange={(e) => setForm({ ...form, plumberPhone: e.target.value })} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>Contact Person Name</label><input value={form.contactPersonName || ''} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} /></div>
            <div className="form-group"><label>Contact Person Phone</label><input value={form.contactPersonPhone || ''} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} /></div>
          </div>
        </>
      )}

      {form.serviceType === 'ConnectionTransfer' && (
        <>
          <div className="grid-2">
            <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
            <div className="form-group"><label>Current Owner</label><input value={form.currentOwner || ''} onChange={(e) => setForm({ ...form, currentOwner: e.target.value })} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>New Owner Name</label><input value={form.newOwnerName || ''} onChange={(e) => setForm({ ...form, newOwnerName: e.target.value })} /></div>
            <div className="form-group"><label>New Owner Phone</label><input value={form.newOwnerPhone || ''} onChange={(e) => setForm({ ...form, newOwnerPhone: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label>Transfer Subtype</label>
            <NeoSelect
              value={form.transferSubtype || ''}
              onChange={(val) => setForm({ ...form, transferSubtype: val as any })}
              options={[
                { value: 'Purchase', label: 'Purchase' },
                { value: 'Inheritance', label: 'Inheritance' },
                { value: 'GiftDeed', label: 'Gift Deed' },
                { value: 'SubDivision', label: 'Property sub-division' }
              ]}
            />
          </div>
        </>
      )}

      {form.serviceType === 'ChangeOfUse' && (
        <>
          <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
          <div className="grid-2">
            <div className="form-group"><label>Current Usage</label><input value={form.currentUsage || ''} onChange={(e) => setForm({ ...form, currentUsage: e.target.value })} /></div>
            <div className="form-group"><label>New Usage</label><input value={form.newUsage || ''} onChange={(e) => setForm({ ...form, newUsage: e.target.value })} /></div>
          </div>
        </>
      )}

      {['WaterMeterDisconnection', 'WaterMeterReconnection', 'WaterMeterNoDuesCertificate', 'WaterMeterInspection'].includes(form.serviceType) && (
        <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
      )}

      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PropertyTaxEditModal({ record, onClose, onSave, saving }: {
  record: PropertyTax; onClose: () => void; onSave: (d: Partial<PropertyTax>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0) + Number(prev.protocolFee || 0)
    }));
  }, [form.officialFee, form.serviceFee, form.protocolFee]);

  return (
    <Modal title="Edit Property Tax Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Applicant name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div className="grid-2">
        <div className="form-group"><label>Property Tax No.</label><input value={form.propertyTaxNo} onChange={(e) => setForm({ ...form, propertyTaxNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>

      <div className="grid-3">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Protocol Fee (₹)</label><input type="number" value={form.protocolFee || 0} onChange={(e) => setForm({ ...form, protocolFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
