import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/api';
import { Customer } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onDeleted: () => void;
  selectedCustomerId: string;
}

export default function EditCustomerModal({
  customer,
  onClose,
  onDeleted,
  selectedCustomerId,
}: EditCustomerModalProps) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editErr, setEditErr] = useState('');

  // Set default values when customer changes
  useEffect(() => {
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setEditErr('');
  }, [customer]);

  // Edit profile mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => customersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customerDetails', selectedCustomerId] });
      onClose();
    },
    onError: (e: any) => setEditErr(e?.response?.data?.message || 'Failed to update customer details.'),
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      onDeleted();
      onClose();
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name) {
      setEditErr('Name is required.');
      return;
    }
    updateMutation.mutate({ id: customer.id, data: editForm });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          ✕
        </button>
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
            <label>Mobile Number</label>
            <input
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="Mobile number"
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
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>

            {isAdmin && (
              <button
                type="button"
                className="btn btn-danger"
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  if (confirm(`Delete customer "${customer.name}"? This deletes the customer profile. Historic records will stay intact with their foreign keys set to null.`)) {
                    deleteMutation.mutate(customer.id);
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
  );
}
