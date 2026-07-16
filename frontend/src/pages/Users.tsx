import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api';
import { User, Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import NeoSelect from '@/components/NeoSelect';
import Modal from '@/components/Modal';

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
    onError: (e: unknown) => {
      const errObj = e as { response?: { data?: { message?: string } } };
      setErr(errObj?.response?.data?.message || 'Failed to create user.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      setEditForm({});
      setErr('');
    },
    onError: (e: unknown) => {
      const errObj = e as { response?: { data?: { message?: string } } };
      setErr(errObj?.response?.data?.message || 'Failed to update user.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({ name: u.name, role: u.role, isActive: u.isActive, password: '' });
    setErr('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErr('All fields are required.');
      return;
    }
    createMutation.mutate(form);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload: typeof editForm = { ...editForm };
    if (!payload.password) delete payload.password;
    delete payload.email;
    updateMutation.mutate({ id: editing.id, data: payload });
  };

  const isAdmin = me?.role === 'admin';

  return (
    <div>
      <div className="page-header">
        <div className="page-title">User management</div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAdd(true);
              setErr('');
            }}
          >
            + Add user
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                  <th style={{ width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt="Avatar"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--accent-light)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 12,
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                        )}
                        <span>{u.name}</span>
                        {u.id === me?.id && (
                          <span className="badge badge-blue" style={{ marginLeft: 2, fontSize: 10 }}>
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}
                      >
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
                        <button className="btn btn-sm" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        {u.id !== me?.id && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              if (confirm(`Delete user "${u.name}"? This cannot be undone.`))
                                deleteMutation.mutate(u.id);
                            }}
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAdd && (
        <Modal
          title="Add new user"
          onClose={() => {
            setShowAdd(false);
            setErr('');
            setForm(emptyForm);
          }}
        >
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Full name <span className="required-star">*</span></label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Akash Patil"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Email address <span className="required-star">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password <span className="required-star">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <NeoSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val as Role })}
                options={[
                  { value: 'operator', label: 'Operator — can add & edit records' },
                  { value: 'admin', label: 'Admin — full access + user management' },
                ]}
              />
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>
                Operators cannot delete records or manage users.
              </div>
            </div>
            {err && (
              <div className="alert-error" style={{ marginBottom: 12 }}>
                {err}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create user'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowAdd(false);
                  setErr('');
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit user modal */}
      {editing && (
        <Modal
          title={`Edit — ${editing.name}`}
          onClose={() => {
            setEditing(null);
            setErr('');
          }}
        >
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Full name</label>
              <input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={editForm.password || ''}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <NeoSelect
                value={editForm.role || ''}
                onChange={(val) => setEditForm({ ...editForm, role: val as Role })}
                options={[
                  { value: 'operator', label: 'Operator' },
                  { value: 'admin', label: 'Admin' },
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
                  { value: 'false', label: 'Inactive (cannot log in)' },
                ]}
              />
            </div>
            {err && (
              <div className="alert-error" style={{ marginBottom: 12 }}>
                {err}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditing(null);
                  setErr('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
