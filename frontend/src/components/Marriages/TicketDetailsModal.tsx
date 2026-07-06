import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarriageTicket, PAYMENT_MODES } from '@/types';
import { usePaymentAccounts } from '@/hooks/usePaymentAccounts';
import { marriagesApi, settingsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { getTicketBreakdown, getEntryAmount } from './helpers';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';
import UpiQrCode from '@/components/UpiQrCode';

interface TicketDetailsModalProps {
  ticket: MarriageTicket;
  pricing: Record<string, number>;
  servicesDef: { key: string; cost: number }[];
  onClose: () => void;
  onProceed?: (ticket: MarriageTicket) => void;
  onShowAlert?: (title: string, message: React.ReactNode) => void;
}

export default function TicketDetailsModal({
  ticket: initialTicket,
  pricing,
  servicesDef,
  onClose,
  onProceed,
  onShowAlert,
}: TicketDetailsModalProps) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();

  // Freshly fetch the ticket with its payments relations
  const { data: ticket = initialTicket } = useQuery({
    queryKey: ['marriage-ticket', initialTicket.id],
    queryFn: () => marriagesApi.getTicketById(initialTicket.id).then((r) => r.data),
    initialData: initialTicket,
    staleTime: 5000,
  });

  // State for adding a payment
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const {
    paymentMode,
    setPaymentMode,
    selectedAccount,
    setSelectedAccount,
    customAccount,
    setCustomAccount,
    isOtherSelected,
    accountOptions,
    resolvedAccount,
    reset: resetAccounts,
  } = usePaymentAccounts();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');

  useEffect(() => {
    if (paymentMode === 'UPI') {
      const lower = (selectedAccount || '').toLowerCase();
      if (lower.includes('vaishali')) {
        setUpiId(import.meta.env.VITE_UPI_ID_VAISHALI || '9890692659@upi');
        setPayeeName('Vaishali Gurav');
      } else if (lower.includes('ashish')) {
        setUpiId(import.meta.env.VITE_UPI_ID_ASHISH || '9112019559@upi');
        setPayeeName('Ashish Gurav');
      } else if (lower.includes('parshuram')) {
        setUpiId(import.meta.env.VITE_UPI_ID_PARSHURAM || '9372725588@upi');
        setPayeeName('Parshuram Gurav');
      } else if (lower.includes('gauri')) {
        setUpiId(import.meta.env.VITE_UPI_ID_GAURI || '7066115942@barodampay');
        setPayeeName('Gauri Gurav');
      } else if (selectedAccount === 'Other') {
        setPayeeName(customAccount || 'Gurav Online Services');
      }
    } else {
      setUpiId('');
      setPayeeName('');
    }
  }, [paymentMode, selectedAccount, customAccount]);

  // Mutations
  const addPaymentMut = useMutation({
    mutationFn: (data: any) => marriagesApi.addPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-ticket', ticket.id] });
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
      // Reset form
      setAmount('');
      resetAccounts();
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
      setShowAddForm(false);
    },
  });

  const deletePaymentMut = useMutation({
    mutationFn: (id: string) => marriagesApi.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marriage-ticket', ticket.id] });
      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
    },
  });

  const [affidavitsPaidSeparately, setAffidavitsPaidSeparately] = useState(() => {
    if (ticket?.questionnaireData?.affidavitsPaidSeparately !== undefined) {
      return ticket.questionnaireData.affidavitsPaidSeparately;
    }
    return pricing.marriage_affidavits_paid_separately !== 0;
  });

  useEffect(() => {
    if (ticket?.questionnaireData?.affidavitsPaidSeparately !== undefined) {
      setAffidavitsPaidSeparately(ticket.questionnaireData.affidavitsPaidSeparately);
    } else if (pricing.marriage_affidavits_paid_separately !== undefined) {
      setAffidavitsPaidSeparately(pricing.marriage_affidavits_paid_separately !== 0);
    }
  }, [ticket?.questionnaireData?.affidavitsPaidSeparately, pricing.marriage_affidavits_paid_separately]);

  const estimatedAffidavitTotal = useMemo(() => {
    if (!ticket || !ticket.questionnaireData) return 0;
    const q = ticket.questionnaireData;
    let affTotal = 0;
    if (q) {
      const getAmt = (entry: any) => getEntryAmount(entry, pricing);
      if (q.husband) {
        affTotal += getAmt(q.husband.birthDateProof);
        affTotal += getAmt(q.husband.residenceProof);
        affTotal += getAmt(q.husband.identityProof);
      }
      if (q.wife) {
        affTotal += getAmt(q.wife.birthDateProof);
        affTotal += getAmt(q.wife.residenceProof);
        affTotal += getAmt(q.wife.identityProof);
      }
      affTotal += getAmt(q.weddingInvitation);
      affTotal += getAmt(q.firstMarriage);
      affTotal += getAmt(q.intercasteMarriage);
      affTotal += getAmt(q.notRegisteredAnywhereElse);
    }
    return affTotal;
  }, [ticket, pricing]);

  // Computations
  const payments = ticket.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amountCharged = Number(ticket.amountCharged) - (affidavitsPaidSeparately ? estimatedAffidavitTotal : 0);
  const balance = amountCharged - totalPaid;

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (!paymentMode) {
      setError('Please select a payment mode.');
      return;
    }
    if (!selectedAccount) {
      setError('Please select a target account.');
      return;
    }
    if (isOtherSelected && !customAccount.trim()) {
      setError('Please specify the other account name.');
      return;
    }
    if (!paymentDate) {
      setError('Please select a payment date.');
      return;
    }

    addPaymentMut.mutate({
      amount: amtVal,
      paymentMode,
      account: resolvedAccount,
      paymentDate,
      notes: notes.trim() || undefined,
      ticketId: ticket.id,
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This action is permanent.')) {
      deletePaymentMut.mutate(paymentId);
    }
  };

  const modeOptions = PAYMENT_MODES.map((m) => ({ value: m, label: m }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 540, position: 'relative', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1.5rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}
        >
          ✕
        </button>
        <div style={{ overflowY: 'auto', padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
            Ticket Details — {ticket.ticketNumber}
          </h3>

        {/* Customer Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: '1.5rem', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Customer Name</span>
            <span style={{ fontWeight: 500 }}>{ticket.contactName}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
            <span style={{ fontWeight: 500 }}>{ticket.phone}</span>
          </div>
          {ticket.contactEmail && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Email</span>
              <span style={{ fontWeight: 500 }}>{ticket.contactEmail}</span>
            </div>
          )}
          {ticket.address && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Address</span>
              <span style={{ fontWeight: 500 }}>{ticket.address}</span>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Primary Contact Type</span>
            <span style={{ fontWeight: 500 }}>
              {ticket.isPrimaryContactSpouse ?? true
                ? `One of the Spouses (${ticket.primaryContactSpouseType === 'wife' ? 'Wife' : 'Husband'})`
                : 'Someone who came to enquire for Spouses'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Status</span>
            <span className={`badge ${ticket.status === 'Completed'
              ? 'badge-green'
              : ticket.status === 'Confirmed'
                ? 'badge-amber'
                : 'badge-blue'
              }`} style={{ display: 'inline-block', marginTop: 4 }}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Estimation Breakdown */}
        <div className="price-box" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>Estimation breakdown</div>
          {(() => {
            const AFFIDAVIT_LABELS = [
              'Husband - Birth Date Proof',
              'Husband - Residence Proof',
              'Husband - Identity Proof',
              'Wife - Birth Date Proof',
              'Wife - Residence Proof',
              'Wife - Identity Proof',
              'Wedding Invitation',
              'First Marriage',
              'Intercaste Marriage',
              'Not Registered Anywhere Else'
            ];

            return getTicketBreakdown(ticket, pricing, servicesDef).map((item, i) => {
              const isAff = AFFIDAVIT_LABELS.some(prefix => item.label.startsWith(prefix));
              const displayAmt = isAff && affidavitsPaidSeparately ? 0 : item.amount;

              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div className="price-row" style={{ marginBottom: 0 }}>
                    <span>{item.label}</span>
                    <span>
                      {isAff && affidavitsPaidSeparately ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>Paid separately</span>
                      ) : (
                        `₹${displayAmt.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>
                  {item.remark && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                      ↳ Remark: {item.remark}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Toggle checkbox for separate affidavit billing */}
          {estimatedAffidavitTotal > 0 && (
            <div className="checkbox-row" style={{ margin: '12px 0', padding: '8px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="modal-affidavits-paid-separately"
                checked={affidavitsPaidSeparately}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAffidavitsPaidSeparately(checked);
                  settingsApi.updateMany({ marriage_affidavits_paid_separately: checked ? 1 : 0 })
                    .then(() => {
                      qc.invalidateQueries({ queryKey: ['pricing-map'] });
                    })
                    .catch((err) => {
                      console.error('Failed to save checkbox preference to DB', err);
                    });

                  marriagesApi.updateTicket(ticket.id, {
                    questionnaireData: {
                      ...ticket.questionnaireData,
                      affidavitsPaidSeparately: checked,
                    },
                  })
                    .then(() => {
                      qc.invalidateQueries({ queryKey: ['marriage-ticket', ticket.id] });
                      qc.invalidateQueries({ queryKey: ['marriage-tickets'] });
                    })
                    .catch((err) => {
                      console.error('Failed to save ticket preference to DB', err);
                    });
                }}
                style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
              />
              <label htmlFor="modal-affidavits-paid-separately" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                Affidavits executed & paid separately (excludes ₹{estimatedAffidavitTotal} from this ticket)
              </label>
            </div>
          )}

          <div className="price-total" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <span className="price-total-label">
              {affidavitsPaidSeparately ? 'Marriage Ticket amount' : 'Total Amount Charged'}
            </span>
            <span className="price-total-value">
              ₹{amountCharged.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payments and Balance Section */}
        {ticket.status !== 'Inquired' && (
          <div style={{ border: '2px solid var(--border)', borderRadius: '6px', padding: '16px', marginBottom: '20px', boxShadow: '2px 2px 0px var(--border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700 }}>Payments & Balance</h4>

            {/* Summary Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px', background: 'var(--bg)', padding: '10px', borderRadius: '4px', marginBottom: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Charged: </span>
                <span style={{ fontWeight: 600 }}>₹{amountCharged.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                <span style={{ fontWeight: 600, color: 'var(--success-text, #15803d)' }}>₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Balance: </span>
                <span style={{ fontWeight: 700, color: balance <= 0 ? 'var(--success-text, #15803d)' : '#dc2626' }}>
                  ₹{balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment History List */}
            {payments.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
                No payments recorded.
              </div>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px' }}>Date</th>
                      <th style={{ padding: '6px 8px' }}>Amt</th>
                      <th style={{ padding: '6px 8px' }}>Mode/Acc</th>
                      <th style={{ padding: '6px 8px' }}>By</th>
                      {isAdmin && <th style={{ padding: '6px 8px', textAlign: 'center' }}>Act</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div>{p.paymentMode}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.account}</div>
                          {p.notes && <div style={{ fontSize: '10px', fontStyle: 'italic', color: 'var(--text-muted)' }}>Notes: {p.notes}</div>}
                        </td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>
                          {p.createdBy?.name || 'Operator'}
                        </td>
                        {isAdmin && (
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              disabled={deletePaymentMut.isPending}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px 6px', fontSize: '14px' }}
                              title="Delete Payment"
                            >
                              🗑
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Inline Add Payment Form */}
            {ticket.status !== 'Completed' && (
              <div>
                {!showAddForm ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowAddForm(true)}
                    style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                  >
                    ➕ Add Payment
                  </button>
                ) : (
                  <form onSubmit={handleAddPaymentSubmit} style={{ marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600 }}>Record New Payment</h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Amount (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Amount"
                          style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Mode *</label>
                          <NeoSelect
                            value={paymentMode}
                            onChange={setPaymentMode}
                            options={modeOptions}
                            placeholder="Select Mode"
                            style={{ height: '32px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Account *</label>
                          <NeoSelect
                            value={selectedAccount}
                            onChange={setSelectedAccount}
                            options={accountOptions}
                            placeholder={paymentMode ? "Select Account" : "Select Mode First"}
                            disabled={!paymentMode}
                            style={{ height: '32px' }}
                          />
                        </div>
                      </div>

                      {isOtherSelected && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Specify Account *</label>
                          <input
                            type="text"
                            value={customAccount}
                            onChange={(e) => setCustomAccount(e.target.value)}
                            placeholder="e.g. Vaishali Gurav GPay"
                            style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                            required
                          />
                        </div>
                      )}

                      {paymentMode === 'UPI' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {selectedAccount === 'Other' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Payee Name *</label>
                              <input
                                type="text"
                                value={payeeName}
                                onChange={(e) => setPayeeName(e.target.value)}
                                placeholder="e.g. Gurav Online Services"
                                style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                                required
                              />
                            </div>
                          )}
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Payee UPI ID *</label>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="e.g. merchant@okaxis"
                              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                              required
                            />
                          </div>

                          <UpiQrCode
                            upiId={upiId}
                            payeeName={payeeName}
                            amount={parseFloat(amount) || 0}
                            transactionRef={`${ticket.ticketNumber}-${Date.now()}`}
                            transactionNote={`Payment for Marriage Ticket ${ticket.ticketNumber}`}
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Payment Date *</label>
                        <NeoDatePicker
                          value={paymentDate}
                          onChange={setPaymentDate}
                          style={{ height: '32px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Notes</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Remarks"
                          style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                        />
                      </div>

                      {error && (
                        <div style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 500 }}>
                          ⚠️ {error}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setShowAddForm(false);
                            setError('');
                          }}
                          disabled={addPaymentMut.isPending}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-sm btn-primary"
                          disabled={addPaymentMut.isPending}
                        >
                          {addPaymentMut.isPending ? 'Saving...' : 'Save Payment'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
          {ticket.status === 'Confirmed' && onProceed && (() => {
            const isFullyPaid = balance <= 0;
            return (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!isFullyPaid) {
                    if (onShowAlert) {
                      onShowAlert(
                        'Payment Balance Remaining',
                        <span>
                          Cannot complete ticket. There is a remaining balance of <strong style={{ fontWeight: 700 }}><u> ₹{balance.toLocaleString('en-IN')} </u></strong>.
                          <br /><br />
                          Please record the remaining payment first.
                        </span>
                      );
                    } else {
                      alert(`Cannot complete ticket. There is a remaining balance of ₹${balance.toLocaleString('en-IN')}.\n\nPlease record the remaining payment first.`);
                    }
                    return;
                  }
                  onClose();
                  onProceed(ticket);
                }}
                style={!isFullyPaid ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                Complete
              </button>
            );
          })()}
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
  );
}
