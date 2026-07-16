import { useState, useEffect } from 'react';
import UpiQrCode from '@/components/UpiQrCode';
import NeoSelect from '@/components/NeoSelect';
import useDebounce from '@/hooks/useDebounce';

const accountOptions = [
  { value: 'Vaishali Gurav Saraswat Bank', label: 'Vaishali Gurav Saraswat Bank' },
  { value: 'Ashish Gurav SBI', label: 'Ashish Gurav SBI' },
  { value: 'Parshuram Gurav', label: 'Parshuram Gurav' },
  { value: 'Gauri Gurav', label: 'Gauri Gurav' },
  { value: 'Other', label: 'Other / Custom' },
];

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

  const [txRef, setTxRef] = useState('');

  const debouncedAmount = useDebounce(amount, 400);
  const debouncedNotes = useDebounce(notes, 400);

  const amtNum = parseFloat(debouncedAmount) || 0;

  useEffect(() => {
    if (amtNum > 0 && upiId) {
      // const accAbbr = payeeName
      //   .toUpperCase()
      //   .replace(/[^A-Z0-9]/g, '')
      //   .slice(0, 10);
      const noteAbbr = debouncedNotes.trim()
        ? debouncedNotes
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 10)
        : 'QUICK';
      const rand = Math.floor(100000 + Math.random() * 900000);
      setTxRef(`GOS-${noteAbbr}-${rand}`);
    }
  }, [upiId, payeeName, amtNum, debouncedNotes]);

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
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⚡ Quick UPI QR Generator
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            {isExpanded
              ? 'Configure and display a payment QR code instantly'
              : 'Click to expand and generate a quick payment QR code'}
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
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '2px dashed var(--border)',
          }}
        >
          <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
            {/* Form Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Amount (₹) <span className="required-star">*</span></label>
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
                <label>Payee Account <span className="required-star">*</span></label>
                <NeoSelect
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  options={accountOptions}
                />
              </div>

              {selectedAccount === 'Other' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Payee Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={customPayeeName}
                      onChange={(e) => setCustomPayeeName(e.target.value)}
                      placeholder="e.g. Gurav Online Services"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Payee UPI ID <span className="required-star">*</span></label>
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              {amtNum > 0 ? (
                <UpiQrCode
                  upiId={upiId}
                  payeeName={payeeName}
                  amount={amtNum}
                  transactionRef={txRef || `GOS-QUICK-${Date.now().toString().slice(-6)}`}
                  transactionNote={debouncedNotes.trim() || 'Quick Store Pay'}
                />
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '20px',
                    border: '2px dashed var(--border-light)',
                    borderRadius: 'var(--radius)',
                    width: '100%',
                  }}
                >
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
