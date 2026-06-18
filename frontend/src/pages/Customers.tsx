import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { customersApi } from '@/api';
import { Customer, CustomerDetails, CustomerServiceUsage } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AffidavitReceipt, MarriageReceipt, BirthDeathReceipt,
  PropertyCardReceipt, ShopActLicenseReceipt,
} from '@/components/ReceiptModal/Receipt';

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Edit State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editErr, setEditErr] = useState('');

  // Print States for historic receipt printing
  const [printAff, setPrintAff] = useState<any>(null);
  const [printMar, setPrintMar] = useState<any>(null);
  const [printBd, setPrintBd] = useState<any>(null);
  const [printPc, setPrintPc] = useState<any>(null);
  const [printSal, setPrintSal] = useState<any>(null);

  const affReceiptRef = useRef<HTMLDivElement>(null);
  const marReceiptRef = useRef<HTMLDivElement>(null);
  const bdReceiptRef = useRef<HTMLDivElement>(null);
  const pcReceiptRef = useRef<HTMLDivElement>(null);
  const salReceiptRef = useRef<HTMLDivElement>(null);

  const handlePrintAff = useReactToPrint({ content: () => affReceiptRef.current });
  const handlePrintMar = useReactToPrint({ content: () => marReceiptRef.current });
  const handlePrintBd = useReactToPrint({ content: () => bdReceiptRef.current });
  const handlePrintPc = useReactToPrint({ content: () => pcReceiptRef.current });
  const handlePrintSal = useReactToPrint({ content: () => salReceiptRef.current });

  // Get all customers
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll({ search }).then(r => r.data),
  });

  // Get active customer details (profile + timeline history)
  const { data: customerDetails, isLoading: detailsLoading } = useQuery<CustomerDetails>({
    queryKey: ['customerDetails', selectedCustomerId],
    queryFn: () => customersApi.getOne(selectedCustomerId!).then(r => r.data),
    enabled: !!selectedCustomerId,
  });

  // Edit profile mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => customersApi.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customerDetails', selectedCustomerId] });
      setEditingCustomer(null);
      setEditErr('');
    },
    onError: (e: any) => setEditErr(e?.response?.data?.message || 'Failed to update customer details.'),
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomerId(null);
    },
  });

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
    });
    setEditErr('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editForm.name || !editForm.phone) {
      setEditErr('Name and mobile number are required.');
      return;
    }
    updateMutation.mutate({ id: editingCustomer.id, data: editForm });
  };

  const handlePrintReceipt = (service: CustomerServiceUsage) => {
    // Reconstruct the record parameters required by components in Receipt.tsx
    const mockRecord: any = {
      id: service.id,
      customerName: customerDetails?.name || '',
      contactName: customerDetails?.name || '',
      phone: customerDetails?.phone || '',
      contactEmail: customerDetails?.email || '',
      email: customerDetails?.email || '',
      address: customerDetails?.address || '',
      dateOfService: service.dateOfService,
      amountCharged: service.amountCharged,
      createdBy: { name: service.createdBy },
      createdAt: service.createdAt,
    };

    // Depending on the service type, set correct print state and trigger print handler
    if (service.type === 'affidavit') {
      // Extract from description like "Purpose: Affidavit (Plain, magistrate)"
      const purposeMatch = service.description.match(/Purpose:\s*([^(]+)/);
      const purpose = purposeMatch ? purposeMatch[1].trim() : 'Affidavit';
      const paperType = service.description.includes('₹500 Stamp') ? 'stamp500' : 'Plain';
      const authorizerType = service.description.includes('Notary') ? 'Notary' : 'magistrate';

      mockRecord.purpose = purpose;
      mockRecord.paperType = paperType;
      mockRecord.authorizerType = authorizerType;

      setPrintAff(mockRecord);
      setTimeout(handlePrintAff, 100);
    } else if (service.type === 'marriage') {
      // Extract spouse names from "Marriage between Spouse1 & Spouse2 (Hindu Marriage Act)"
      const spousesMatch = service.description.match(/Marriage between\s*([^&]+)\s*&\s*([^(]+)/);
      const spouse1Name = spousesMatch ? spousesMatch[1].trim() : 'Spouse 1';
      const spouse2Name = spousesMatch ? spousesMatch[2].trim() : 'Spouse 2';
      
      const actMatch = service.description.match(/\(([^)]+)\)/);
      const marriageAct = actMatch ? actMatch[1] : 'Hindu Marriage Act';

      mockRecord.spouse1Name = spouse1Name;
      mockRecord.spouse2Name = spouse2Name;
      mockRecord.marriageAct = marriageAct;
      mockRecord.marriageDate = service.dateOfService;

      setPrintMar(mockRecord);
      setTimeout(handlePrintMar, 100);
    } else if (service.type === 'birth-death') {
      const isBirth = service.typeName.startsWith('Birth');
      const personMatch = service.description.match(/(?:for)\s*([^(]+)/);
      const personName = personMatch ? personMatch[1].trim() : 'Person';

      mockRecord.certificateType = isBirth ? 'Birth' : 'Death';
      mockRecord.personName = personName;
      mockRecord.eventDate = service.dateOfService;
      mockRecord.numberOfCopies = 1;

      setPrintBd(mockRecord);
      setTimeout(handlePrintBd, 100);
    } else if (service.type === 'property-card') {
      const recordType = service.typeName;
      const numMatch = service.description.match(/(?:Property No:)\s*(.+)$/);
      const propertyNumber = numMatch ? numMatch[1].trim() : 'N/A';

      mockRecord.recordType = recordType;
      mockRecord.propertyNumber = propertyNumber;

      setPrintPc(mockRecord);
      setTimeout(handlePrintPc, 100);
    } else if (service.type === 'shop-act') {
      const bizMatch = service.description.match(/(?:License for)\s*(.+)$/);
      const businessName = bizMatch ? bizMatch[1].trim() : 'Business';

      mockRecord.businessName = businessName;

      setPrintSal(mockRecord);
      setTimeout(handlePrintSal, 100);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Customers</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomerId ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Customer Directory List */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              placeholder="Search by name, phone, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            {search && <button className="btn" onClick={() => setSearch('')}>Clear</button>}
          </div>

          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading directory…</div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>First Visit</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{
                        cursor: 'pointer',
                        background: selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent',
                      }}
                      onClick={() => setSelectedCustomerId(c.id)}
                    >
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(c.id); }}>
                          History
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                        No customers found. Records saved in services will auto-create customers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Unified Service History View */}
        {selectedCustomerId && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  👤 {detailsLoading ? 'Loading profile...' : customerDetails?.name}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Registered on {customerDetails && new Date(customerDetails.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {customerDetails && (
                  <button className="btn btn-sm" onClick={() => handleEditClick(customerDetails)}>Edit Profile</button>
                )}
                <button className="btn btn-sm" style={{ minWidth: 32 }} onClick={() => setSelectedCustomerId(null)}>✕ Close</button>
              </div>
            </div>

            {detailsLoading ? (
              <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading details...</div>
            ) : customerDetails ? (
              <>
                {/* Profile Detail Badges */}
                <div className="grid-2" style={{ background: 'var(--bg)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Mobile No.</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.email || '—'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Residential Address</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{customerDetails.address || '—'}</span>
                  </div>
                </div>

                <div className="divider" style={{ margin: 0 }} />

                {/* Timeline */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Service History</span>
                    <span className="badge badge-blue">{customerDetails.services.length} services availed</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '420px', overflowY: 'auto', paddingRight: 4 }}>
                    {customerDetails.services.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          border: '0.5px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '10px 12px',
                          background: 'var(--surface)',
                          transition: 'box-shadow 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${
                            s.type === 'marriage' ? 'badge-amber' :
                            s.type === 'affidavit' ? 'badge-blue' :
                            s.type === 'birth-death' ? 'badge-green' : 'badge-red'
                          }`} style={{ fontSize: 11 }}>
                            {s.typeName}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(s.dateOfService).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, margin: '8px 0', color: 'var(--text)' }}>
                          {s.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Charged: </span>
                            <span style={{ fontWeight: 500 }}>₹{s.amountCharged}</span>
                            <span style={{ color: 'var(--text-hint)', fontSize: 11, marginLeft: 6 }}>by {s.createdBy}</span>
                          </div>
                          <button className="btn btn-sm" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => handlePrintReceipt(s)}>
                            🖨 Print Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                    {customerDetails.services.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '2rem' }}>
                        No service records linked to this customer yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Edit Customer Profile Modal */}
      {editingCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
            <button onClick={() => setEditingCustomer(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem' }}>Edit Customer Profile</div>
            
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="10-digit number"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Residential Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Street, Town, Pin Code"
                  rows={3}
                />
              </div>

              {editErr && <div className="alert-error" style={{ marginBottom: 12 }}>{editErr}</div>}
              
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save Profile'}
                </button>
                <button type="button" className="btn" onClick={() => setEditingCustomer(null)}>Cancel</button>
                
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => {
                      if (confirm(`Delete customer "${editingCustomer.name}"? This deletes the customer profile. Historic records will stay intact with their foreign keys set to null.`)) {
                        deleteMutation.mutate(editingCustomer.id);
                        setEditingCustomer(null);
                      }
                    }}
                  >
                    Delete Customer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden print targets for Printing Receipts */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printAff && <AffidavitReceipt ref={affReceiptRef} record={printAff} />}
        {printMar && <MarriageReceipt ref={marReceiptRef} record={printMar} />}
        {printBd && <BirthDeathReceipt ref={bdReceiptRef} record={printBd} />}
        {printPc && <PropertyCardReceipt ref={pcReceiptRef} record={printPc} />}
        {printSal && <ShopActLicenseReceipt ref={salReceiptRef} record={printSal} />}
      </div>
    </div>
  );
}
