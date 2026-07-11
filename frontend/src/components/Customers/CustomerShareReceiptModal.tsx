import { useState } from 'react';
import { CustomerDetails, CustomerServiceUsage } from '@/types';
import { generateMessageUrl } from '@/utils/messageTemplates';
import { messageLogsApi } from '@/api';

interface CustomerShareReceiptModalProps {
  service: CustomerServiceUsage;
  customer: CustomerDetails;
  onClose: () => void;
}

const STORAGE_KEY = 'quick_message_templates';

function getTemplateBody(serviceTypeName: string): string {
  // Try to find a stored override for a matching module-level template
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Use the first matching receipt template if user has customised one
      const found = parsed.find((t: any) => t.id === 'generic_receipt_shared');
      if (found?.body) return found.body;
    }
  } catch { /* fall through */ }
  return (
    `Dear {CustomerName},\n\n` +
    `Please find the link to view your receipt for the ${serviceTypeName} service:\n` +
    `{ReceiptUrl}\n\n` +
    `Thank you.\nGURAV ONLINE SERVICES`
  );
}

export default function CustomerShareReceiptModal({
  service,
  customer,
  onClose,
}: CustomerShareReceiptModalProps) {
  const receiptUrl = `${window.location.origin}/share/receipt/${service.type}/${service.id}`;
  const defaultPhone = (customer.phone || '').replace(/^\+91/, '').replace(/\D/g, '');
  const defaultName = customer.name || '';

  const buildMessage = (name: string) =>
    getTemplateBody(service.typeName)
      .replace(/{CustomerName}/g, name)
      .replace(/{ReceiptUrl}/g, receiptUrl);

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(() => buildMessage(defaultName));

  const handleNameChange = (val: string) => {
    setName(val);
    setMessage(buildMessage(val));
  };

  const handleSend = (channel: 'whatsapp' | 'sms') => {
    messageLogsApi.create({
      module: service.type.replace('-', '') === 'tradelicense' ? 'tradeLicenses' : service.type,
      templateId: 'generic_receipt_shared',
      templateLabel: 'Receipt Shared',
      channel,
      recipientName: name || undefined,
      recipientPhone: phone,
      messageBody: message,
      recordId: service.id,
    }).catch(() => { /* non-blocking */ });
    const url = generateMessageUrl(channel, '+91', phone, message);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card modal-card"
        style={{
          width: '100%', maxWidth: 480, position: 'relative',
          padding: '1.75rem 2rem', maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', fontSize: 18,
            cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          ✕
        </button>

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: '0.25rem' }}>
          📤 Share Receipt
        </h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {service.typeName} — {new Date(service.dateOfService).toLocaleDateString('en-IN')}
        </div>

        {/* Receipt URL */}
        <div style={{
          background: 'var(--accent-light)', border: '2px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: 12, marginBottom: '1.25rem',
          wordBreak: 'break-all', color: 'var(--text-muted)',
          boxShadow: '2px 2px 0px var(--border)',
        }}>
          🔗 {receiptUrl}
        </div>

        {/* Name */}
        <div className="form-group">
          <label>Customer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Ramesh Patil"
          />
        </div>

        {/* Phone */}
        <div className="form-group">
          <label>Customer Phone *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="10-digit mobile number"
            maxLength={10}
          />
        </div>

        {/* Message Preview */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Message Preview</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            style={{ fontFamily: 'inherit', fontSize: 13, resize: 'vertical' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
            {message.length} characters
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{
              flex: 1, background: '#25D366', borderColor: '#25D366',
              color: '#fff', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            disabled={!phone || phone.length < 6}
            onClick={() => handleSend('whatsapp')}
          >
            💬 WhatsApp
          </button>
          <button
            className="btn"
            style={{
              flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)',
              background: 'transparent', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            disabled={!phone || phone.length < 6}
            onClick={() => handleSend('sms')}
          >
            ✉️ SMS
          </button>
        </div>
      </div>
    </div>
  );
}
