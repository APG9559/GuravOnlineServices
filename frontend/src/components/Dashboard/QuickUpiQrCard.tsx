import { useState, useEffect } from 'react';
import UpiQrCode from '@/components/UpiQrCode';

export default function QuickUpiQrCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState<string>('100');
  const [selectedAccount, setSelectedAccount] = useState<string>('Vaishali Gurav Saraswat Bank');
  const [upiId, setUpiId] = useState<string>('');
  const [payeeName, setPayeeName] = useState<string>('');
  const [customUpiId, setCustomUpiId] = useState<string>('');
  const [customPayeeName, setCustomPayeeName] = useState<string>('');
  const [notes, setNotes] = useState<string>('Quick Store Pay');

  useEffect(() => {
    const lower = selectedAccount.toLowerCase();
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
    } else {
      setUpiId(customUpiId);
      setPayeeName(customPayeeName || 'Gurav Online Services');
    }
  }, [selectedAccount, customUpiId, customPayeeName]);

  const amtNum = parseFloat(amount) || 0;

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.5rem',
        border: '3px solid var(--border)',
        boxShadow: 'var(--neo-shadow)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚡ Quick UPI QR Generator
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {isExpanded ? 'Configure and display a payment QR code instantly' : 'Click to expand and generate a quick payment QR code'}
          </p>
        </div>
        <button
          className="btn btn-sm"
          style={{ padding: '4px 10px', fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '2px dashed var(--border)' }}>
          <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
            {/* Form Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['100', '200', '500', '1000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: amount === preset ? 'var(--accent)' : 'var(--surface)',
                        boxShadow: '1.5px 1.5px 0px var(--border)',
                      }}
                      onClick={() => setAmount(preset)}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Payee Account *</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2.5px solid var(--border)', borderRadius: 'var(--radius)' }}
                >
                  <option value="Vaishali Gurav Saraswat Bank">Vaishali Gurav Saraswat Bank</option>
                  <option value="Ashish Gurav SBI">Ashish Gurav SBI</option>
                  <option value="Parshuram Gurav">Parshuram Gurav</option>
                  <option value="Gauri Gurav">Gauri Gurav</option>
                  <option value="Other">Other / Custom</option>
                </select>
              </div>

              {selectedAccount === 'Other' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Payee Name *</label>
                    <input
                      type="text"
                      value={customPayeeName}
                      onChange={(e) => setCustomPayeeName(e.target.value)}
                      placeholder="e.g. Gurav Online Services"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Payee UPI ID *</label>
                    <input
                      type="text"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      placeholder="e.g. merchant@okaxis"
                    />
                  </div>
                </>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Transaction Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Quick Pay"
                />
              </div>
            </div>

            {/* QR Code Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              {amtNum > 0 ? (
                <UpiQrCode
                  upiId={upiId}
                  payeeName={payeeName}
                  amount={amtNum}
                  transactionRef={`DASH-${Date.now()}`}
                  transactionNote={notes.trim() || 'Quick Store Pay'}
                />
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius)', width: '100%' }}>
                  Enter a valid amount greater than ₹0 to generate the QR Code.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
