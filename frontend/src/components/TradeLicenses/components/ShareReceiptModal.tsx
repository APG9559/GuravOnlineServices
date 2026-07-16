import { useState } from 'react';
import { TradeLicenseRecord } from '@/types';
import { SERVICE_TYPE_LABELS } from '@/constants';
import { generateMessageUrl, replacePlaceholders } from '@/utils/messageTemplates';
import { messageLogsApi } from '@/api';

interface ShareReceiptModalProps {
  record: TradeLicenseRecord;
  onClose: () => void;
}

const DEFAULT_TEMPLATE_BODY =
  `Dear {CustomerName},\n\n` +
  `Please find the link to download/view the receipt for your Trade License ({ServiceType}) service:\n` +
  `{ReceiptUrl}\n\n` +
  `Thank you.\nGURAV ONLINE SERVICES`;

function getTemplateBody(): string {
  try {
    const stored = localStorage.getItem('quick_message_templates');
    if (stored) {
      const parsed = JSON.parse(stored);
      const found = parsed.find((t: { id: string; body?: string }) => t.id === 'tl_receipt_shared');
      if (found?.body) return found.body;
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_TEMPLATE_BODY;
}

export default function ShareReceiptModal({ record, onClose }: ShareReceiptModalProps) {
  const receiptUrl = `${window.location.origin}/share/receipt/trade-license/${record.id}`;
  const serviceTypeLabel = SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType;

  const primaryCustomer = record.business?.customers?.[0];
  const defaultName = primaryCustomer?.name || record.business?.name || '';
  const defaultPhone = (primaryCustomer?.phone || record.business?.phone || '')
    .replace(/^\+91/, '')
    .replace(/\D/g, '');

  const initialMsg = replacePlaceholders(getTemplateBody(), {
    CustomerName: defaultName,
    ServiceType: serviceTypeLabel,
    ReceiptUrl: receiptUrl,
  });

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(initialMsg);

  const handleNameChange = (newName: string) => {
    setName(newName);
    setMessage(
      replacePlaceholders(getTemplateBody(), {
        CustomerName: newName,
        ServiceType: serviceTypeLabel,
        ReceiptUrl: receiptUrl,
      }),
    );
  };

  const handleSend = (channel: 'whatsapp' | 'sms') => {
    messageLogsApi
      .create({
        module: 'tradeLicenses',
        templateId: 'tl_receipt_shared',
        templateLabel: 'Receipt Shared',
        channel,
        recipientName: name || undefined,
        recipientPhone: phone,
        messageBody: message,
        recordId: record.id,
      })
      .catch(() => {
        /* non-blocking — don't break the send */
      });
    const url = generateMessageUrl(channel, '+91', phone, message);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card modal-card"
        style={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          padding: '1.75rem 2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
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

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: '0.25rem' }}>📤 Share Receipt</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {record.business?.name} — {serviceTypeLabel}
        </div>

        {/* Receipt URL info */}
        <div
          style={{
            background: 'var(--accent-light)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            fontSize: 12,
            marginBottom: '1.25rem',
            wordBreak: 'break-all',
            color: 'var(--text-muted)',
            boxShadow: '2px 2px 0px var(--border)',
          }}
        >
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
          <label>Customer Phone <span className="required-star">*</span></label>
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
          <div
            style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}
          >
            {message.length} characters
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              background: '#25D366',
              borderColor: '#25D366',
              color: '#fff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            disabled={!phone || phone.length < 6}
            onClick={() => handleSend('whatsapp')}
          >
            💬 WhatsApp
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
              background: 'transparent',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
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
