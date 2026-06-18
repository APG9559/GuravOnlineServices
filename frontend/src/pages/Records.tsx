import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { affidavitsApi, marriagesApi, birthDeathApi } from '@/api';
import { Affidavit, Marriage, BirthDeathCertificate, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS, PaperType, AuthorizerType, CertificateType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AffidavitReceipt, MarriageReceipt, BirthDeathReceipt } from '@/components/ReceiptModal/Receipt';
import { usePricing, calcAffidavitTotal, calcMarriageTotal, calcBirthDeathTotal } from '@/hooks/usePricing';

type RecordTab = 'affidavits' | 'marriages' | 'birthDeath';

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const { pricing } = usePricing();
  const [tab, setTab] = useState<RecordTab>('affidavits');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editingAff, setEditingAff] = useState<Affidavit | null>(null);
  const [editingMar, setEditingMar] = useState<Marriage | null>(null);
  const [editingBd, setEditingBd] = useState<BirthDeathCertificate | null>(null);
  const [printAff, setPrintAff] = useState<Affidavit | null>(null);
  const [printMar, setPrintMar] = useState<Marriage | null>(null);
  const [printBd, setPrintBd] = useState<BirthDeathCertificate | null>(null);
  const affReceiptRef = useRef<HTMLDivElement>(null);
  const marReceiptRef = useRef<HTMLDivElement>(null);
  const bdReceiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const params = {
    ...(search ? { search } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { data: affidavits = [], isLoading: affLoading } = useQuery({
    queryKey: ['affidavits', params],
    queryFn: () => affidavitsApi.getAll(params).then((r) => r.data),
  });

  const { data: marriages = [], isLoading: marLoading } = useQuery({
    queryKey: ['marriages', params],
    queryFn: () => marriagesApi.getAll(params).then((r) => r.data),
  });

  const { data: birthDeathCerts = [], isLoading: bdLoading } = useQuery({
    queryKey: ['birth-death', params],
    queryFn: () => birthDeathApi.getAll(params).then((r) => r.data),
  });

  const deleteAff = useMutation({
    mutationFn: (id: string) => affidavitsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['affidavits'] }),
  });
  const deleteMar = useMutation({
    mutationFn: (id: string) => marriagesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marriages'] }),
  });
  const deleteBd = useMutation({
    mutationFn: (id: string) => birthDeathApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['birth-death'] }),
  });
  const updateAff = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Affidavit> }) =>
      affidavitsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affidavits'] }); setEditingAff(null); },
  });
  const updateMar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Marriage> }) =>
      marriagesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marriages'] }); setEditingMar(null); },
  });
  const updateBd = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BirthDeathCertificate> }) =>
      birthDeathApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['birth-death'] }); setEditingBd(null); },
  });

  const handlePrintAff = useReactToPrint({ content: () => affReceiptRef.current });
  const handlePrintMar = useReactToPrint({ content: () => marReceiptRef.current });
  const handlePrintBd = useReactToPrint({ content: () => bdReceiptRef.current });

  const exportAffidavits = () => {
    const rows = affidavits.map((r) => ({
      'Date': r.dateOfService,
      'Customer Name': r.customerName,
      'Phone': r.phone,
      'Purpose': r.purpose,
      'Paper Type': PAPER_LABELS[r.paperType],
      'Authorizer Type': AUTH_LABELS[r.authorizerType],
      'Authorizer Name': r.authorizerName || '',
      'Amount (₹)': r.amountCharged,
      'Created By': r.createdBy.name,
      'Created At': new Date(r.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Affidavits');
    XLSX.writeFile(wb, `affidavits_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportMarriages = () => {
    const rows = marriages.map((r) => ({
      'Date': r.dateOfService,
      'Contact Name': r.contactName,
      'Phone': r.phone,
      'Email': r.contactEmail || '',
      'Spouse 1': r.spouse1Name,
      'Spouse 2': r.spouse2Name,
      'Marriage Act': r.marriageAct,
      'Marriage Date': r.marriageDate,
      'Place': r.marriagePlace || '',
      'Witness 1': r.witness1Name || '',
      'Witness 2': r.witness2Name || '',
      'Witness 3': r.witness3Name || '',
      'Priest': r.priestDetails || '',
      'Services': (r.servicesProvided || []).join(', '),
      'Affidavits': r.affidavits && r.affidavits.length > 0
        ? r.affidavits.map((a) => `${a.customerName} — ${a.purpose}`).join('; ')
        : '',
      'Affidavits Amt (₹)': r.affidavits && r.affidavits.length > 0
        ? r.affidavits.reduce((sum, a) => sum + Number(a.amountCharged), 0)
        : '',
      'Amount (₹)': r.amountCharged,
      'Created By': r.createdBy.name,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marriages');
    XLSX.writeFile(wb, `marriages_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportBirthDeath = () => {
    const rows = birthDeathCerts.map((r) => ({
      'Date': r.dateOfService,
      'Type': r.certificateType,
      'Customer Name': r.customerName,
      'Phone': r.phone,
      'Person Name': r.personName,
      'Event Date': r.eventDate,
      'Copies': r.numberOfCopies,
      'Amount (₹)': r.amountCharged,
      'Created By': r.createdBy.name,
      'Created At': new Date(r.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BirthDeathCertificates');
    XLSX.writeFile(wb, `birth_death_certificates_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Records</div>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'affidavits' ? 'active' : ''}`} onClick={() => setTab('affidavits')}>
          Affidavits
          {affidavits.length > 0 && (
            <span className="badge badge-blue" style={{ marginLeft: 6 }}>{affidavits.length}</span>
          )}
        </button>
        <button className={`tab ${tab === 'marriages' ? 'active' : ''}`} onClick={() => setTab('marriages')}>
          Marriages
          {marriages.length > 0 && (
            <span className="badge badge-blue" style={{ marginLeft: 6 }}>{marriages.length}</span>
          )}
        </button>
        <button className={`tab ${tab === 'birthDeath' ? 'active' : ''}`} onClick={() => setTab('birthDeath')}>
          Birth/Death Cert.
          {birthDeathCerts.length > 0 && (
            <span className="badge badge-blue" style={{ marginLeft: 6 }}>{birthDeathCerts.length}</span>
          )}
        </button>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          style={{ flex: '1 1 180px', maxWidth: 260 }}
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input type="date" style={{ flex: '0 1 150px' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" style={{ flex: '0 1 150px' }} value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={() => { setSearch(''); setFrom(''); setTo(''); }}>Clear</button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-sm" onClick={tab === 'affidavits' ? exportAffidavits : tab === 'marriages' ? exportMarriages : exportBirthDeath}>
            ⬇ Export Excel
          </button>
        </div>
      </div>

      {/* Affidavits table */}
      {tab === 'affidavits' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          {affLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : affidavits.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No records found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Name</th><th>Phone</th>
                  <th>Purpose</th><th>Paper</th><th>Authorizer</th>
                  <th>Amount</th><th>By</th><th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {affidavits.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                    <td>{r.phone}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.purpose}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {r.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.authorizerType === 'magistrate' ? 'badge-green' : 'badge-amber'}`}>
                        {r.authorizerType === 'magistrate' ? 'Magistrate' : 'Notary'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm"
                          title="Print receipt"
                          onClick={() => { setPrintAff(r); setTimeout(handlePrintAff, 100); }}
                        >🖨</button>
                        <button className="btn btn-sm" onClick={() => setEditingAff(r)}>Edit</button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => { if (confirm('Delete this record?')) deleteAff.mutate(r.id); }}
                          >Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Marriages table */}
      {tab === 'marriages' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          {marLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : marriages.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No records found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Contact</th><th>Phone</th>
                  <th>Spouses</th><th>Act</th><th>Services</th>
                  <th>Amount</th><th>By</th><th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {marriages.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td style={{ fontWeight: 500 }}>{r.contactName}</td>
                    <td>{r.phone}</td>
                    <td style={{ fontSize: 12 }}>{r.spouse1Name} &amp; {r.spouse2Name}</td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>
                        {r.marriageAct === 'Hindu Marriage Act'
                          ? 'Hindu'
                          : r.marriageAct === 'Muslim Personal Law (Shariat)'
                            ? 'Muslim'
                            : 'Christian'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {(r.servicesProvided || []).length > 0
                        ? (r.servicesProvided || []).join(', ')
                        : '—'}
                    </td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm"
                          title="Print receipt"
                          onClick={() => { setPrintMar(r); setTimeout(handlePrintMar, 100); }}
                        >🖨</button>
                        <button className="btn btn-sm" onClick={() => setEditingMar(r)}>Edit</button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => { if (confirm('Delete this record?')) deleteMar.mutate(r.id); }}
                          >Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Birth/Death certificates table */}
      {tab === 'birthDeath' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          {bdLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : birthDeathCerts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No records found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Type</th><th>Customer</th><th>Phone</th>
                  <th>Person Name</th><th>Event Date</th><th>Copies</th>
                  <th>Amount</th><th>By</th><th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {birthDeathCerts.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td>
                      <span className={`badge ${r.certificateType === 'Birth' ? 'badge-green' : 'badge-amber'}`}>
                        {r.certificateType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                    <td>{r.phone}</td>
                    <td>{r.personName}</td>
                    <td>{r.eventDate}</td>
                    <td>{r.numberOfCopies}</td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm"
                          title="Print receipt"
                          onClick={() => { setPrintBd(r); setTimeout(handlePrintBd, 100); }}
                        >🖨</button>
                        <button className="btn btn-sm" onClick={() => setEditingBd(r)}>Edit</button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => { if (confirm('Delete this record?')) deleteBd.mutate(r.id); }}
                          >Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit modals */}
      {editingAff && (
        <AffidavitEditModal
          record={editingAff}
          pricing={pricing}
          onClose={() => setEditingAff(null)}
          onSave={(data) => updateAff.mutate({ id: editingAff.id, data })}
          saving={updateAff.isPending}
        />
      )}
      {editingMar && (
        <MarriageEditModal
          record={editingMar}
          pricing={pricing}
          onClose={() => setEditingMar(null)}
          onSave={(data) => updateMar.mutate({ id: editingMar.id, data })}
          saving={updateMar.isPending}
        />
      )}
      {editingBd && (
        <BirthDeathEditModal
          record={editingBd}
          pricing={pricing}
          onClose={() => setEditingBd(null)}
          onSave={(data) => updateBd.mutate({ id: editingBd.id, data })}
          saving={updateBd.isPending}
        />
      )}

      {/* Hidden print targets */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printAff && <AffidavitReceipt ref={affReceiptRef} record={printAff} />}
        {printMar && <MarriageReceipt ref={marReceiptRef} record={printMar} />}
        {printBd && <BirthDeathReceipt ref={bdReceiptRef} record={printBd} />}
      </div>
    </div>
  );
}

// ── Affidavit edit modal ──────────────────────────────────────────────────────
function AffidavitEditModal({ record, pricing, onClose, onSave, saving }: {
  record: Affidavit;
  pricing: Record<string, number>;
  onClose: () => void;
  onSave: (data: Partial<Affidavit>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  const set = (k: string, v: string | number) => {
    const updated = { ...form, [k]: v } as typeof form;
    if (k === 'paperType' || k === 'authorizerType') {
      const p = k === 'paperType' ? v as PaperType : form.paperType;
      const a = k === 'authorizerType' ? v as AuthorizerType : form.authorizerType;
      if (p && a) updated.amountCharged = calcAffidavitTotal(p, a, pricing).total;
    }
    setForm(updated);
  };

  return (
    <Modal title="Edit affidavit record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label>
          <input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
        </div>
        <div className="form-group"><label>Phone</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="form-group"><label>Purpose</label>
        <input value={form.purpose} onChange={(e) => set('purpose', e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Paper type</label>
          <select value={form.paperType} onChange={(e) => set('paperType', e.target.value)}>
            <option value="stamp500">₹{pricing.stamp500_cost} Stamp Paper</option>
            <option value="Plain">Plain Paper</option>
          </select>
        </div>
        <div className="form-group">
          <label>Authorized by</label>
          <select value={form.authorizerType} onChange={(e) => set('authorizerType', e.target.value)}>
            <option value="magistrate">Executive Magistrate (₹{pricing.magistrate_fee})</option>
            <option value="Notary">Notary Public (₹{pricing.notary_fee})</option>
          </select>
        </div>
      </div>
      {form.authorizerType === 'Notary' && (
        <div className="form-group">
          <label>Notary Public fee to deduct (₹)</label>
          <input
            type="number"
            value={form.notaryPublicFee ?? ''}
            onChange={(e) => set('notaryPublicFee', parseFloat(e.target.value) || 0)}
            placeholder="Amount paid to Notary Public"
          />
        </div>
      )}
      <div className="grid-2">
        <div className="form-group"><label>Authorizer name</label>
          <input value={form.authorizerName || ''} onChange={(e) => set('authorizerName', e.target.value)} />
        </div>
        <div className="form-group"><label>Date of service</label>
          <input type="date" value={form.dateOfService} onChange={(e) => set('dateOfService', e.target.value)} />
        </div>
      </div>
      <div className="form-group"><label>Amount charged (₹)</label>
        <input type="number" value={form.amountCharged}
          onChange={(e) => set('amountCharged', parseFloat(e.target.value))} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Marriage edit modal ───────────────────────────────────────────────────────
const MARRIAGE_SERVICES = ['Online form filling', 'Offline form filling', 'Document true copy'];

function MarriageEditModal({ record, pricing, onClose, onSave, saving }: {
  record: Marriage;
  pricing: Record<string, number>;
  onClose: () => void;
  onSave: (data: Partial<Marriage>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    ...record,
    servicesProvided: record.servicesProvided || [],
  });
  const [linkedAffs, setLinkedAffs] = useState<Affidavit[]>(record.affidavits || []);
  const [affSearch, setAffSearch] = useState('');
  const [showAffDrop, setShowAffDrop] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data: affResults = [] } = useQuery({
    queryKey: ['aff-edit-search', affSearch],
    queryFn: () => affidavitsApi.getAll(affSearch ? { search: affSearch } : {}).then((r) => r.data),
    enabled: affSearch.length >= 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowAffDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (k: string, v: string | number | string[]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const toggleService = (key: string) => {
    const next = form.servicesProvided.includes(key)
      ? form.servicesProvided.filter((s) => s !== key)
      : [...form.servicesProvided, key];
    const totalAffAmount = linkedAffs.reduce((sum, a) => sum + Number(a.amountCharged), 0);
    const newAmount = calcMarriageTotal(next, totalAffAmount, pricing);
    setForm({ ...form, servicesProvided: next, amountCharged: newAmount });
  };

  const selectAff = (aff: Affidavit) => {
    if (linkedAffs.some((x) => x.id === aff.id)) {
      setAffSearch('');
      setShowAffDrop(false);
      return;
    }
    const updated = [...linkedAffs, aff];
    setLinkedAffs(updated);
    setAffSearch('');
    setShowAffDrop(false);
    const totalAffAmount = updated.reduce((sum, a) => sum + Number(a.amountCharged), 0);
    const newAmount = calcMarriageTotal(form.servicesProvided, totalAffAmount, pricing);
    setForm((prev) => ({ ...prev, amountCharged: newAmount }));
  };

  const unlinkAff = (id: string) => {
    const updated = linkedAffs.filter((x) => x.id !== id);
    setLinkedAffs(updated);
    const totalAffAmount = updated.reduce((sum, a) => sum + Number(a.amountCharged), 0);
    const newAmount = calcMarriageTotal(form.servicesProvided, totalAffAmount, pricing);
    setForm((prev) => ({ ...prev, amountCharged: newAmount }));
  };

  return (
    <Modal title="Edit marriage record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Contact name</label>
          <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
        </div>
        <div className="form-group"><label>Phone</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="form-group"><label>Email</label>
        <input type="email" value={form.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} placeholder="Contact email" />
      </div>
      <div className="form-group"><label>Address</label>
        <input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Spouse 1 name</label>
          <input value={form.spouse1Name} onChange={(e) => set('spouse1Name', e.target.value)} />
        </div>
        <div className="form-group"><label>Spouse 2 name</label>
          <input value={form.spouse2Name} onChange={(e) => set('spouse2Name', e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Marriage act</label>
          <select value={form.marriageAct} onChange={(e) => set('marriageAct', e.target.value)}>
            <option value="Hindu Marriage Act">Hindu Marriage Act</option>
            <option value="Muslim Personal Law (Shariat)">Muslim Personal Law (Shariat)</option>
            <option value="Indian Christian Marriage Act">Indian Christian Marriage Act</option>
          </select>
        </div>
        <div className="form-group"><label>Date of marriage</label>
          <input type="date" value={form.marriageDate} onChange={(e) => set('marriageDate', e.target.value)} />
        </div>
      </div>
      <div className="form-group"><label>Place</label>
        <input value={form.marriagePlace || ''} onChange={(e) => set('marriagePlace', e.target.value)} />
      </div>
      <div className="grid-3">
        <div className="form-group"><label>Witness 1</label>
          <input value={form.witness1Name || ''} onChange={(e) => set('witness1Name', e.target.value)} />
        </div>
        <div className="form-group"><label>Witness 2</label>
          <input value={form.witness2Name || ''} onChange={(e) => set('witness2Name', e.target.value)} />
        </div>
        <div className="form-group"><label>Witness 3</label>
          <input value={form.witness3Name || ''} onChange={(e) => set('witness3Name', e.target.value)} />
        </div>
      </div>
      <div className="form-group"><label>Priest / officiant</label>
        <input value={form.priestDetails || ''} onChange={(e) => set('priestDetails', e.target.value)} />
      </div>
      <div className="form-group"><label>Date of service</label>
        <input type="date" value={form.dateOfService} onChange={(e) => set('dateOfService', e.target.value)} />
      </div>
      <div className="section-label">Services</div>
      {MARRIAGE_SERVICES.map((s) => (
        <div className="checkbox-row" key={s}>
          <input type="checkbox" checked={form.servicesProvided.includes(s)} onChange={() => toggleService(s)} />
          <label style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>{s}</label>
        </div>
      ))}
      <hr className="divider" />
      <div className="section-label">Linked affidavits</div>

      {linkedAffs.map((aff) => (
        <div key={aff.id} style={{
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '10px 14px', marginBottom: 8, background: 'var(--bg)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 500 }}>{aff.customerName} — {aff.phone}</div>
            <div style={{ color: 'var(--text-muted)' }}>
              {aff.purpose} · {PAPER_LABELS[aff.paperType]} · {AUTH_LABELS[aff.authorizerType]}
            </div>
            <div style={{ color: 'var(--primary)', fontWeight: 500, marginTop: 2 }}>
              ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => unlinkAff(aff.id)} style={{ flexShrink: 0 }}>✕</button>
        </div>
      ))}

      <div ref={dropRef} style={{ position: 'relative', marginBottom: 14 }}>
        <input
          placeholder="Search affidavit by name or phone to link..."
          value={affSearch}
          onChange={(e) => { setAffSearch(e.target.value); setShowAffDrop(true); }}
          onFocus={() => affSearch && setShowAffDrop(true)}
          style={{ width: '100%' }}
        />
        {showAffDrop && affResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--card-bg, #fff)', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: 180, overflowY: 'auto', marginTop: 4,
          }}>
            {affResults.map((aff) => {
              const isLinked = linkedAffs.some((x) => x.id === aff.id);
              return (
                <div
                  key={aff.id}
                  onClick={() => !isLinked && selectAff(aff)}
                  style={{
                    padding: '8px 14px',
                    cursor: isLinked ? 'not-allowed' : 'pointer',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                    opacity: isLinked ? 0.5 : 1,
                    background: isLinked ? 'var(--bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLinked) e.currentTarget.style.background = 'var(--bg, #f5f5f5)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLinked) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{aff.customerName} — {aff.phone}</span>
                    {isLinked && <span style={{ color: 'var(--text-hint)', fontSize: 11 }}>Already Linked</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {aff.purpose} · ₹{Number(aff.amountCharged).toLocaleString('en-IN')} · {aff.dateOfService}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="form-group"><label>Amount charged (₹)</label>
        <input type="number" value={form.amountCharged}
          onChange={(e) => set('amountCharged', parseFloat(e.target.value))} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave({ ...form, affidavitIds: linkedAffs.map((a) => a.id) })} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Birth/Death edit modal ────────────────────────────────────────────────────
function BirthDeathEditModal({ record, pricing, onClose, onSave, saving }: {
  record: BirthDeathCertificate;
  pricing: Record<string, number>;
  onClose: () => void;
  onSave: (data: Partial<BirthDeathCertificate>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  const set = (k: string, v: string | number) => {
    const updated = { ...form, [k]: v } as typeof form;
    if (k === 'numberOfCopies') {
      const copies = typeof v === 'number' ? v : parseInt(v as string) || 1;
      updated.amountCharged = calcBirthDeathTotal(copies, pricing).total;
    }
    setForm(updated);
  };

  return (
    <Modal title="Edit birth/death certificate record" onClose={onClose}>
      <div className="form-group">
        <label>Certificate type</label>
        <select value={form.certificateType} onChange={(e) => set('certificateType', e.target.value)}>
          <option value="Birth">Birth Certificate</option>
          <option value="Death">Death Certificate</option>
        </select>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label>
          <input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
        </div>
        <div className="form-group"><label>Phone</label>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>{form.certificateType === 'Death' ? 'Deceased name' : 'Baby name'}</label>
          <input value={form.personName} onChange={(e) => set('personName', e.target.value)} />
        </div>
        <div className="form-group">
          <label>{form.certificateType === 'Death' ? 'Date of death' : 'Date of birth'}</label>
          <input type="date" value={form.eventDate} onChange={(e) => set('eventDate', e.target.value)} />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Date of service</label>
          <input type="date" value={form.dateOfService} onChange={(e) => set('dateOfService', e.target.value)} />
        </div>
        <div className="form-group"><label>Number of copies</label>
          <input type="number" min={1} value={form.numberOfCopies}
            onChange={(e) => set('numberOfCopies', parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div className="form-group"><label>Amount charged (₹)</label>
        <input type="number" value={form.amountCharged}
          onChange={(e) => set('amountCharged', parseFloat(e.target.value))} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Shared modal shell ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.3)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', fontSize: 18,
          cursor: 'pointer', color: 'var(--text-muted)',
        }}>✕</button>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
