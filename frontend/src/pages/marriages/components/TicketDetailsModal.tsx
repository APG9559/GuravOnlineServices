import { MarriageTicket } from '@/types';
import { getTicketBreakdown } from '../helpers';

interface TicketDetailsModalProps {
  ticket: MarriageTicket;
  pricing: Record<string, number>;
  servicesDef: { key: string; cost: number }[];
  onClose: () => void;
}

export default function TicketDetailsModal({
  ticket,
  pricing,
  servicesDef,
  onClose,
}: TicketDetailsModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 500, position: 'relative', padding: '1.5rem 2rem' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          ✕
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
          Ticket Details — {ticket.ticketNumber}
        </h3>

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
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Created At</span>
            <span style={{ fontWeight: 500 }}>{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div className="price-box" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>Estimation breakdown</div>
          {getTicketBreakdown(ticket, pricing, servicesDef).map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div className="price-row" style={{ marginBottom: 0 }}>
                <span>{item.label}</span>
                <span>₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
              {item.remark && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                  ↳ Remark: {item.remark}
                </div>
              )}
            </div>
          ))}
          <div className="price-total">
            <span className="price-total-label">Total Amount Charged</span>
            <span className="price-total-value">₹{Number(ticket.amountCharged).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
