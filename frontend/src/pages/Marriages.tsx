import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { usePricing } from '@/hooks/usePricing';
import { MarriageReceipt } from '@/components/ReceiptModal/Receipt';
import { Marriage, MarriageTicket } from '@/types';
import EstimationTab from './marriages/components/EstimationTab';
import TicketsTab from './marriages/components/TicketsTab';
import AddRecordTab from './marriages/components/AddRecordTab';
import TicketDetailsModal from './marriages/components/TicketDetailsModal';

type TabType = 'estimation' | 'tickets' | 'add';

export default function MarriagesPage() {
  const [tab, setTab] = useState<TabType>('estimation');
  const [savedRecord, setSavedRecord] = useState<Marriage | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [prefillTicket, setPrefillTicket] = useState<MarriageTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<MarriageTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<MarriageTicket | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const { pricing } = usePricing();

  const SERVICES = useMemo(() => [
    { key: 'Online form filling', cost: pricing.online_form },
    { key: 'Offline form filling', cost: pricing.offline_form },
    { key: 'Document true copy', cost: pricing.true_copy },
    { key: 'Misc (Form, Xerox Copies)', cost: pricing.marriage_misc_fee ?? 0 },
  ], [pricing]);

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Marriage Registration</div>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${tab === 'estimation' ? 'active' : ''}`}
          onClick={() => {
            setTab('estimation');
          }}
        >
          Estimation
        </button>
        <button
          className={`tab ${tab === 'tickets' ? 'active' : ''}`}
          onClick={() => {
            setTab('tickets');
            setEditingTicket(null);
          }}
        >
          Tickets
        </button>
        <button
          className={`tab ${tab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setTab('add');
            setPrefillTicket(null);
            setEditingTicket(null);
          }}
        >
          Add record
        </button>
      </div>

      {/* Tab 1: Estimation */}
      {tab === 'estimation' && (
        <EstimationTab
          editingTicket={editingTicket}
          onCancelEdit={() => {
            setEditingTicket(null);
            setTab('tickets');
          }}
          onSuccess={() => {
            setEditingTicket(null);
            setTab('tickets');
          }}
          pricing={pricing}
          servicesDef={SERVICES}
        />
      )}

      {/* Tab 2: Tickets */}
      {tab === 'tickets' && (
        <TicketsTab
          onView={(ticket) => setViewingTicket(ticket)}
          onProceed={(ticket) => {
            setPrefillTicket(ticket);
            setTab('add');
          }}
          onEdit={(ticket) => {
            setEditingTicket(ticket);
            setTab('estimation');
          }}
        />
      )}

      {/* Tab 3: Add Record */}
      {tab === 'add' && (
        <AddRecordTab
          prefillTicket={prefillTicket}
          onClearPrefill={() => setPrefillTicket(null)}
          onSaveSuccess={(record) => {
            setSavedRecord(record);
            setShowSuccessModal(true);
            setPrefillTicket(null);
          }}
          pricing={pricing}
          servicesDef={SERVICES}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && savedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Marriage Record Saved!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Record for {savedRecord.contactName} has been stored successfully.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => { handlePrint(); setShowSuccessModal(false); }}>
                🖨 Print Receipt
              </button>
              <button className="btn" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {viewingTicket && (
        <TicketDetailsModal
          ticket={viewingTicket}
          pricing={pricing}
          servicesDef={SERVICES}
          onClose={() => setViewingTicket(null)}
        />
      )}

      {/* Printed Receipt Target */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <MarriageReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
