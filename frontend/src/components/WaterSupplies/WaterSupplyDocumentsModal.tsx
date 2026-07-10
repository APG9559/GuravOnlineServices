import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WaterServiceRecord } from '@/types';
import { waterSuppliesApi } from '@/api';
import NeoSelect from '@/components/NeoSelect';

interface WaterSupplyDocumentsModalProps {
  record: WaterServiceRecord;
  onClose: () => void;
}

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'Property Tax Receipt',
  'Ownership Proof / Index II',
  'Plumber Completion Certificate',
  'No Objection Certificate (NOC)',
  'Old Water Bill',
  'Identity Proof',
  'Other',
];

export default function WaterSupplyDocumentsModal({
  record: initialRecord,
  onClose,
}: WaterSupplyDocumentsModalProps) {
  const qc = useQueryClient();

  // Freshly fetch the record with its documents relations
  const { data: record = initialRecord } = useQuery({
    queryKey: ['water-record', initialRecord.id],
    queryFn: () => waterSuppliesApi.getById(initialRecord.id).then((r) => r.data),
    initialData: initialRecord,
    staleTime: 5000,
  });

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [fileName, setFileName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  // Mutations
  const addDocumentMut = useMutation({
    mutationFn: (data: any) => waterSuppliesApi.addDocument(record.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-record', record.id] });
      qc.invalidateQueries({ queryKey: ['water-records'] });
      setDocumentType('');
      setFileName('');
      setRemarks('');
      setError('');
      setShowAddForm(false);
    },
  });

  const deleteDocumentMut = useMutation({
    mutationFn: (id: string) => waterSuppliesApi.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-record', record.id] });
      qc.invalidateQueries({ queryKey: ['water-records'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!documentType) {
      setError('Please select a document type.');
      return;
    }
    if (!fileName.trim()) {
      setError('Please upload a file or enter a filename.');
      return;
    }

    addDocumentMut.mutate({
      documentType,
      fileName: fileName.trim(),
      remarks: remarks.trim() || undefined,
    });
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('Are you sure you want to remove this document attachment?')) {
      deleteDocumentMut.mutate(docId);
    }
  };

  const typeOptions = DOCUMENT_TYPES.map((t) => ({ value: t, label: t }));

  const documents = record.documents || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 500, position: 'relative', padding: '1.5rem 2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Documents — {record.connection?.currentOwner || 'Water Connection'}
        </h3>

        {/* Documents List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>Attached Documents</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: 12 }}
            >
              {showAddForm ? 'Cancel' : '+ Attach Document'}
            </button>
          </div>

          {documents.length === 0 && !showAddForm ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)' }}>
              No documents attached yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg)',
                    boxShadow: '2px 2px 0px var(--border)',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.documentType}</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'underline', marginTop: 2, wordBreak: 'break-all' }}>
                      📄 {doc.fileName}
                    </div>
                    {(doc.remarks || doc.createdBy) && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {doc.remarks && <span>{doc.remarks}</span>}
                        {doc.createdBy && <span> • added by {doc.createdBy.name}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="btn btn-sm"
                    disabled={deleteDocumentMut.isPending}
                    style={{
                      padding: '3px 8px',
                      background: 'var(--danger-bg)',
                      border: '1.5px solid var(--border)',
                      color: 'var(--danger)',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Document Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} style={{ border: '2.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', background: 'var(--surface)', boxShadow: '3px 3px 0px var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, textTransform: 'uppercase' }}>Attach New Document</div>

            {error && <div className="alert-error" style={{ marginBottom: 12, fontSize: 13 }}>{error}</div>}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Document Type *</label>
              <NeoSelect
                value={documentType}
                onChange={setDocumentType}
                options={typeOptions}
                placeholder="Select Type"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Upload File *</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="water-doc-upload"
                />
                <label
                  htmlFor="water-doc-upload"
                  className="btn"
                  style={{ fontSize: 12, cursor: 'pointer', background: 'var(--accent-light)', border: '2px solid var(--border)' }}
                >
                  Choose File
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName || 'No file chosen'}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Or Enter Filename Manually</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. aadhaar_front.jpg"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Remarks (optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Verified original copy"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={addDocumentMut.isPending}
              style={{ width: '100%' }}
            >
              {addDocumentMut.isPending ? 'Uploading…' : 'Attach Document'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
