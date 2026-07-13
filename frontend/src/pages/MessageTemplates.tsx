import { useState, useEffect } from 'react';
import { MessageTemplate } from '@/types';
import { MessageModule } from '@/utils/messageTemplates';
import { messageTemplatesApi } from '@/api/services';
import Modal from '@/components/Modal';
import NeoSelect from '@/components/NeoSelect';

const MODULE_OPTIONS: { value: MessageModule | '*'; label: string }[] = [
  { value: '*', label: 'All Modules (Global)' },
  { value: 'general', label: 'General' },
  { value: 'birthDeath', label: 'Birth/Death' },
  { value: 'marriages', label: 'Marriage Registration' },
  { value: 'tradeLicenses', label: 'Trade Licenses' },
  { value: 'waterSupplies', label: 'Water Supply' },
  { value: 'propertyTaxes', label: 'Property Tax' },
  { value: 'panCards', label: 'PAN Cards' },
  { value: 'passports', label: 'Passports' },
  { value: 'affidavits', label: 'Affidavits' },
  { value: 'propertyCards', label: 'Property Cards' },
  { value: 'shopAct', label: 'Shop Act' },
  { value: 'gazettes', label: 'Gazette' },
  { value: 'voterCards', label: 'Voter Cards' },
];

const MODULE_LABEL_MAP: Record<string, string> = {
  '*': 'All Modules',
  general: 'General',
  birthDeath: 'Birth/Death',
  marriages: 'Marriage Registration',
  tradeLicenses: 'Trade Licenses',
  waterSupplies: 'Water Supply',
  propertyTaxes: 'Property Tax',
  panCards: 'PAN Cards',
  passports: 'Passports',
  affidavits: 'Affidavits',
  propertyCards: 'Property Cards',
  shopAct: 'Shop Act',
  gazettes: 'Gazette',
  voterCards: 'Voter Cards',
};

interface TemplateFormData {
  label: string;
  modules: (MessageModule | '*')[];
  body: string;
}

const EMPTY_FORM: TemplateFormData = {
  label: '',
  modules: ['*'],
  body: '',
};

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<MessageModule | '*' | 'all'>('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({ ...EMPTY_FORM });

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await messageTemplatesApi.getAll();
      setTemplates(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──
  const filtered = templates.filter((t) => {
    // Module filter
    if (filterModule !== 'all') {
      if (!t.modules.includes('*') && !t.modules.includes(filterModule as MessageModule)) {
        return false;
      }
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchLabel = t.label.toLowerCase().includes(q);
      const matchBody = t.body.toLowerCase().includes(q);
      if (!matchLabel && !matchBody) return false;
    }
    return true;
  });

  // ── CRUD Handlers ──
  const handleCreate = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingTemplate(null);
    setIsCreating(true);
  };

  const handleEdit = (t: MessageTemplate) => {
    setFormData({
      label: t.label,
      modules: [...t.modules] as (MessageModule | '*')[],
      body: t.body,
    });
    setEditingTemplate(t);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formData.label.trim() || !formData.body.trim()) return;

    try {
      if (editingTemplate) {
        // Update existing
        const res = await messageTemplatesApi.update(editingTemplate.id, {
          label: formData.label.trim(),
          modules: formData.modules,
          body: formData.body,
        });
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? res.data : t)));
      } else {
        // Create new
        const res = await messageTemplatesApi.create({
          label: formData.label.trim(),
          modules: formData.modules,
          body: formData.body,
        });
        setTemplates((prev) => [...prev, res.data]);
      }
      setIsCreating(false);
      setEditingTemplate(null);
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await messageTemplatesApi.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeletingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleModuleToggle = (mod: MessageModule | '*') => {
    setFormData((prev) => {
      const has = prev.modules.includes(mod);
      let next: (MessageModule | '*')[];

      if (mod === '*') {
        // Toggle global: if turning on, set to ['*'] only; if off, set to empty
        next = has ? [] : ['*'];
      } else {
        if (has) {
          next = prev.modules.filter((m) => m !== mod);
        } else {
          // Remove '*' if adding a specific module
          next = [...prev.modules.filter((m) => m !== '*'), mod];
        }
      }

      // Ensure at least one module is selected
      if (next.length === 0) next = ['*'];

      return { ...prev, modules: next };
    });
  };

  // Find placeholders in the template body
  const bodyPlaceholders = formData.body.match(/\{[A-Za-z]+\}/g) || [];
  const uniquePlaceholders = [...new Set(bodyPlaceholders)];

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading message templates...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger-color, red)' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Message Templates</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Template
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: 'var(--accent-light)',
          border: '0.5px solid rgba(24,95,165,0.25)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: 13,
          color: 'var(--text)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <div>
          <strong>Configure message templates</strong> used in the Quick Message feature on the
          Dashboard. Use placeholders like{' '}
          <code
            style={{ background: 'var(--bg)', padding: '1px 4px', borderRadius: 4, fontSize: 12 }}
          >
            {'{CustomerName}'}
          </code>
          ,{' '}
          <code
            style={{ background: 'var(--bg)', padding: '1px 4px', borderRadius: 4, fontSize: 12 }}
          >
            {'{ApplicationNo}'}
          </code>
          ,{' '}
          <code
            style={{ background: 'var(--bg)', padding: '1px 4px', borderRadius: 4, fontSize: 12 }}
          >
            {'{ServiceType}'}
          </code>{' '}
          etc. in your templates. They will be replaced with actual values when sending.
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, margin: 0 }}
          />
          <NeoSelect
            value={filterModule}
            onChange={(val) => setFilterModule(val as MessageModule | '*')}
            options={[
              { value: 'all', label: 'All Modules' },
              ...MODULE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
            style={{ maxWidth: 200 }}
          />
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginLeft: 'auto',
            }}
          >
            {filtered.length} of {templates.length} templates
          </span>
        </div>
      </div>

      {/* Templates Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1rem',
        }}
      >
        {filtered.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
          >
            {/* Header Row */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.label}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.modules.map((m) => (
                    <span
                      key={m}
                      className={`badge ${m === '*' ? 'badge-green' : 'badge-blue'}`}
                      style={{ fontSize: 10, padding: '2px 6px' }}
                    >
                      {MODULE_LABEL_MAP[m] || m}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="btn btn-sm"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  onClick={() => handleEdit(t)}
                  title="Edit template"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-sm"
                  style={{ padding: '3px 8px', fontSize: 11, background: 'var(--danger-bg)' }}
                  onClick={() => setDeletingId(t.id)}
                  title="Delete template"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div
              style={{
                background: 'var(--bg)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
                fontSize: 12,
                fontFamily: "'Space Grotesk', monospace",
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: 'var(--text)',
                maxHeight: 150,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {t.body}
            </div>

            {/* Placeholders Used */}
            {(() => {
              const ph = t.body.match(/\{[A-Za-z]+\}/g);
              if (!ph || ph.length === 0) return null;
              const unique = [...new Set(ph)];
              return (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {unique.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 6px',
                        background: 'var(--warning-bg)',
                        borderRadius: 4,
                        border: '1px solid var(--border-light)',
                        color: '#000',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}
        >
          No templates match your filters.
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {isCreating && (
        <Modal
          title={editingTemplate ? 'Edit Template' : 'New Template'}
          onClose={() => {
            setIsCreating(false);
            setEditingTemplate(null);
            setFormData({ ...EMPTY_FORM });
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Template Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Template Name *</label>
              <input
                type="text"
                placeholder="e.g. Application Submitted"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            {/* Module Assignment */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Applicable Modules</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {MODULE_OPTIONS.map((o) => {
                  const isActive = formData.modules.includes(o.value as MessageModule | '*');
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-primary' : ''}`}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        ...(isActive
                          ? {}
                          : { background: 'var(--bg)', color: 'var(--text-muted)' }),
                      }}
                      onClick={() => handleModuleToggle(o.value as MessageModule | '*')}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Body */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Message Body *</label>
              <textarea
                className="qm-message-textarea"
                rows={12}
                placeholder={`Dear {CustomerName},\n\nYour application has been submitted successfully.\n\nApplication No: {ApplicationNo}\n\nThank you.\nGURAV ONLINE SERVICES`}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <span className="qm-char-count">{formData.body.length} chars</span>
              </div>
            </div>

            {/* Detected Placeholders */}
            {uniquePlaceholders.length > 0 && (
              <div>
                <label style={{ marginBottom: 4 }}>Detected Placeholders</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {uniquePlaceholders.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        background: 'var(--warning-bg)',
                        borderRadius: 4,
                        border: '1.5px solid var(--border)',
                        color: '#000',
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Insert Placeholders */}
            <div>
              <label style={{ marginBottom: 4 }}>Quick Insert Placeholder</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  '{CustomerName}',
                  '{Phone}',
                  '{ApplicationNo}',
                  '{ServiceType}',
                  '{TradeLicenseNo}',
                  '{ConnectionNo}',
                  '{PropertyTaxNo}',
                  '{AppointmentDate}',
                  '{AppointmentTime}',
                  '{DueAmount}',
                  '{Amount}',
                  '{OfficeName}',
                  '{OperatorName}',
                ].map((placeholder) => (
                  <button
                    key={placeholder}
                    type="button"
                    className="btn btn-sm"
                    style={{ padding: '3px 8px', fontSize: 10, background: 'var(--bg)' }}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        body: prev.body + placeholder,
                      }));
                    }}
                    title={`Insert ${placeholder}`}
                  >
                    + {placeholder}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                  setFormData({ ...EMPTY_FORM });
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!formData.label.trim() || !formData.body.trim()}
                onClick={handleSave}
              >
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Delete Template</div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              Are you sure you want to delete the template "
              <strong>{templates.find((t) => t.id === deletingId)?.label}</strong>"? This action
              cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => setDeletingId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deletingId)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
