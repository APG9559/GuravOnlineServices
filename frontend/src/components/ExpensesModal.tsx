import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api';
import NeoDatePicker from './NeoDatePicker';
import NeoSelect from './NeoSelect';

interface ExpensesModalProps {
  user: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
}

const SHOP_TYPES = [
  'Monthly Electricity Bill',
  'Yearly Property Tax',
  'Monthly Property Rent',
  'Paper Ream',
  'Xerox Machine Maintenance',
  'Daily Tea & Snacks',
  'Daily Affidavit Xerox',
  'KMC Employee Payout',
  'Other',
];

const HOME_TYPES = [
  'Weekly Grocery',
  'LPG Cylinder',
  'TV Cable Recharge',
  'Mobile Recharge',
  'Petrol',
  'Home Electricity Bill',
  'Monthly Flat Maintenance',
  'Medicines',
  'Personal Well-beings',
  'Hotel Expense',
  'Travel Expense',
  'Ceremony Gifts Expense',
  'Other',
];

export default function ExpensesModal({ user, onClose }: ExpensesModalProps) {
  const qc = useQueryClient();
  const [category, setCategory] = useState<'Shop' | 'Home'>('Shop');
  const [type, setType] = useState<string>('Monthly Electricity Bill');
  const [customType, setCustomType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  // KMC Employee fields
  const [empName, setEmpName] = useState<string>('');
  const [empDate, setEmpDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [err, setErr] = useState<string>('');

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', user.id],
    queryFn: () => expensesApi.getAll({ userId: user.id }).then((r) => r.data),
  });

  // Create expense
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof expensesApi.create>[0]) => expensesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', user.id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      // Reset form
      setAmount('');
      setCustomType('');
      setDescription('');
      setEmpName('');
      setErr('');
    },
    onError: (e: unknown) => {
      const errObj = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(errObj?.response?.data?.message || 'Failed to save expense.');
    },
  });

  // Delete expense
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', user.id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCategoryChange = (cat: 'Shop' | 'Home') => {
    setCategory(cat);
    if (cat === 'Shop') {
      setType(SHOP_TYPES[0]);
    } else {
      setType(HOME_TYPES[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErr('Please enter a valid amount.');
      return;
    }

    let finalType = type;
    if (type === 'Other') {
      if (!customType.trim()) {
        setErr('Please specify the custom expense type.');
        return;
      }
      finalType = customType.trim();
    }

    let finalDesc = description.trim();
    if (type === 'KMC Employee Payout') {
      if (!empName.trim()) {
        setErr("Please specify the employee's name.");
        return;
      }
      finalDesc = `Employee: ${empName.trim()}, Payout Date: ${empDate}. ${finalDesc}`.trim();
    }

    createMutation.mutate({
      category,
      type: finalType,
      amount: parseFloat(amount),
      date,
      description: finalDesc || null,
      userId: user.id,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 750,
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '1.5rem',
        }}
      >
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

        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: '1.25rem' }}>
          Expenses — {user.name} ({user.role})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Add Expense Form */}
          <div style={{ borderRight: '1px solid var(--border)', paddingRight: '1.5rem' }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 12,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 6,
              }}
            >
              Declare Expense
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Category</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${category === 'Shop' ? 'btn-primary' : ''}`}
                    onClick={() => handleCategoryChange('Shop')}
                    style={{ flex: 1 }}
                  >
                    Shop
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${category === 'Home' ? 'btn-primary' : ''}`}
                    onClick={() => handleCategoryChange('Home')}
                    style={{ flex: 1 }}
                  >
                    Home
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Expense Type</label>
                <NeoSelect
                  value={type}
                  onChange={(val) => setType(val)}
                  options={(category === 'Shop' ? SHOP_TYPES : HOME_TYPES).map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />
              </div>

              {type === 'Other' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Specify Type <span className="required-star">*</span></label>
                  <input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="e.g. Paper Ream Brand X"
                  />
                </div>
              )}

              {type === 'KMC Employee Payout' && (
                <div
                  style={{
                    background: 'var(--bg)',
                    padding: 8,
                    borderRadius: 4,
                    marginBottom: 12,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label>Employee Name <span className="required-star">*</span></label>
                    <input
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="Name of employee"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 4 }}>
                    <label>Payout Date <span className="required-star">*</span></label>
                    <NeoDatePicker value={empDate} onChange={(val) => setEmpDate(val)} />
                  </div>
                </div>
              )}

              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group">
                  <label>Amount (₹) <span className="required-star">*</span></label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount spent"
                  />
                </div>
                <div className="form-group">
                  <label>Date <span className="required-star">*</span></label>
                  <NeoDatePicker value={date} onChange={(val) => setDate(val)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Description / Remarks</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    resize: 'vertical',
                  }}
                />
              </div>

              {err && (
                <div className="alert-error" style={{ marginBottom: 12 }}>
                  {err}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving…' : 'Add Expense'}
              </button>
            </form>
          </div>

          {/* Expenses List */}
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 12,
                borderBottom: '1px solid var(--border)',
                paddingBottom: 6,
              }}
            >
              Recent Expenses
            </div>
            {isLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : expenses.length === 0 ? (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  textAlign: 'center',
                  marginTop: '2rem',
                }}
              >
                No expenses declared.
              </div>
            ) : (
              <div
                style={{
                  overflowY: 'auto',
                  maxHeight: '48vh',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      background: 'var(--surface)',
                      border: '2.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: 10,
                      boxShadow: '2px 2px 0px var(--border)',
                      position: 'relative',
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: e.category === 'Shop' ? 'var(--primary)' : 'var(--success)',
                        }}
                      >
                        {e.category} / {e.type}
                      </span>
                      <span style={{ color: 'rgb(220, 38, 38)' }}>
                        ₹{Number(e.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>
                      Date: {e.date}
                    </div>
                    {e.description && (
                      <div
                        style={{
                          background: 'var(--bg)',
                          padding: '4px 6px',
                          borderRadius: 4,
                          fontStyle: 'italic',
                          wordBreak: 'break-word',
                        }}
                      >
                        {e.description}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this expense?')) {
                          deleteMutation.mutate(e.id);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
