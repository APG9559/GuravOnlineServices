import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api';
import { User, Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import NeoSelect from '@/components/NeoSelect';

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const emptyForm: UserFormState = { name: '', email: '', password: '', role: 'operator' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editForm, setEditForm] = useState<Partial<UserFormState & { isActive: boolean }>>({});
  const [err, setErr] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormState) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setForm(emptyForm);
      setErr('');
    },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Failed to create user.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      setEditForm({});
      setErr('');
    },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Failed to update user.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, isActive: u.isActive, password: '' });
    setErr('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setErr('All fields are required.'); return; }
    createMutation.mutate(form);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload: typeof editForm = { ...editForm };
    if (!payload.password) delete payload.password;
    updateMutation.mutate({ id: editing.id, data: payload });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">User management</div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setErr(''); }}>+ Add user</button>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>
                    {u.name}
                    {u.id === me?.id && (
                      <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10 }}>you</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" onClick={() => openEdit(u)}>Edit</button>
                      {u.id !== me?.id && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => { if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) deleteMutation.mutate(u.id); }}
                        >
                          Del
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found.</td></tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAdd && (
        <Modal title="Add new user" onClose={() => { setShowAdd(false); setErr(''); setForm(emptyForm); }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Full name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Akash Patil" autoFocus />
            </div>
            <div className="form-group">
              <label>Email address *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <NeoSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val as Role })}
                options={[
                  { value: 'operator', label: 'Operator — can add & edit records' },
                  { value: 'admin', label: 'Admin — full access + user management' }
                ]}
              />
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>
                Operators cannot delete records or manage users.
              </div>
            </div>
            {err && <div className="alert-error" style={{ marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" className="btn" onClick={() => { setShowAdd(false); setErr(''); setForm(emptyForm); }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit user modal */}
      {editing && (
        <Modal title={`Edit — ${editing.name}`} onClose={() => { setEditing(null); setErr(''); }}>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full name</label>
              <input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input type="password" value={editForm.password || ''} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <NeoSelect
                value={editForm.role || ''}
                onChange={(val) => setEditForm({ ...editForm, role: val as Role })}
                options={[
                  { value: 'operator', label: 'Operator' },
                  { value: 'admin', label: 'Admin' }
                ]}
              />
            </div>
            <div className="form-group">
              <label>Account status</label>
              <NeoSelect
                value={editForm.isActive ? 'true' : 'false'}
                onChange={(val) => setEditForm({ ...editForm, isActive: val === 'true' })}
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive (cannot log in)' }
                ]}
              />
            </div>
            {err && <div className="alert-error" style={{ marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn" onClick={() => { setEditing(null); setErr(''); }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
