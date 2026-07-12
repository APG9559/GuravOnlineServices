import { useState, useRef, useMemo } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import { usePricing } from '@/hooks/usePricing';
import { MarriageReceipt } from '@/components/ReceiptModal/Receipt';
import { Marriage, MarriageTicket } from '@/types';
import EstimationTab from '@/components/Marriages/EstimationTab';
import TicketsTab from '@/components/Marriages/TicketsTab';
import AddRecordTab from '@/components/Marriages/AddRecordTab';
import TicketDetailsModal from '@/components/Marriages/TicketDetailsModal';
import CustomerShareReceiptModal from '@/components/Customers/CustomerShareReceiptModal';

type TabType = 'estimation' | 'tickets' | 'add';

export default function MarriagesPage() {
  const [tab, setTab] = useState<TabType>('estimation');
  const [savedRecord, setSavedRecord] = useState<Marriage | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [prefillTicket, setPrefillTicket] = useState<MarriageTicket | null>(null);
  const [prefillMode, setPrefillMode] = useState<'save_ticket' | 'complete_record'>('complete_record');
  const [editingTicket, setEditingTicket] = useState<MarriageTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<MarriageTicket | null>(null);
  const [savedTicket, setSavedTicket] = useState<MarriageTicket | null>(null);
  const [showTicketSavedModal, setShowTicketSavedModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const handleShowConfirm = (title: string, message: React.ReactNode, onConfirm: () => void) => {
    setAlertModal({
      show: true,
      title,
      message,
      onConfirm,
      confirmText: 'Yes, Proceed',
      cancelText: 'Cancel'
    });
  };

  const receiptRef = useRef<HTMLDivElement>(null);
  const { pricing } = usePricing();

  const SERVICES = useMemo(() => [
    { key: 'Online form filling', cost: pricing.online_form },
    { key: 'Offline form filling', cost: pricing.offline_form },
    { key: 'Document true copy', cost: pricing.true_copy },
    { key: 'Misc (Form - Xerox Copies)', cost: pricing.marriage_misc_fee ?? 0 },
  ], [pricing]);

  const handlePrint = useAppPrint({ content: () => receiptRef.current });

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
            setPrefillMode('save_ticket');
            setTab('add');
          }}
          onProceedComplete={(ticket) => {
            setPrefillTicket(ticket);
            setPrefillMode('complete_record');
            setTab('add');
          }}
          onEdit={(ticket) => {
            setEditingTicket(ticket);
            setTab('estimation');
          }}
          onShowAlert={(title, message) => {
            setAlertModal({ show: true, title, message });
          }}
          onShowConfirm={handleShowConfirm}
        />
      )}

      {/* Tab 3: Add Record */}
      {tab === 'add' && (
        <AddRecordTab
          prefillTicket={prefillTicket}
          prefillMode={prefillMode}
          onClearPrefill={() => setPrefillTicket(null)}
          onSaveSuccess={(record) => {
            setSavedRecord(record);
            setShowSuccessModal(true);
            setPrefillTicket(null);
          }}
          onSaveTicketSuccess={(ticket) => {
            setSavedTicket(ticket);
            setShowTicketSavedModal(true);
            setPrefillTicket(null);
            setTab('tickets');
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
              <button className="btn btn-success-soft" onClick={() => { setShowSuccessModal(false); setShowShareModal(true); }}>
                💬 Share
              </button>
              <button className="btn" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && savedRecord && (
        <CustomerShareReceiptModal
          service={{
            id: savedRecord.id,
            type: 'marriage',
            typeName: 'Marriage Registration',
            dateOfService: savedRecord.dateOfService,
            amountCharged: savedRecord.amountCharged,
            description: `Marriage Registration: ${savedRecord.spouse1Name} 💍 ${savedRecord.spouse2Name}`,
            createdBy: savedRecord.createdBy?.name || '',
            createdAt: savedRecord.createdAt,
          }}
          customer={{
            id: savedRecord.customer?.id || '',
            name: savedRecord.contactName,
            phone: savedRecord.phone || '',
            createdAt: savedRecord.customer?.createdAt || '',
            updatedAt: savedRecord.customer?.updatedAt || '',
            services: [],
          }}
          onClose={() => {
            setShowShareModal(false);
            setSavedRecord(null);
          }}
        />
      )}

      {/* Ticket Saved Success Modal */}
      {showTicketSavedModal && savedTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            <button
              onClick={() => setShowTicketSavedModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>💾</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>Ticket State Saved!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Ticket state for {savedTicket.contactName} ({savedTicket.ticketNumber}) has been updated and saved successfully.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowTicketSavedModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Neo-Brutalist Alert Modal */}
      {alertModal?.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1010, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card modal-card" style={{ width: '100%', maxWidth: 400, position: 'relative', textAlign: 'center', padding: '2rem' }}>
            {!alertModal.onConfirm && (
              <button
                onClick={() => {
                  if (alertModal.onCancel) alertModal.onCancel();
                  setAlertModal(null);
                }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            )}
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: '0.5rem' }}>{alertModal.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {alertModal.message}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {alertModal.onConfirm ? (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      alertModal.onConfirm?.();
                      setAlertModal(null);
                    }}
                  >
                    {alertModal.confirmText || 'Confirm'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (alertModal.onCancel) alertModal.onCancel();
                      setAlertModal(null);
                    }}
                  >
                    {alertModal.cancelText || 'Cancel'}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setAlertModal(null)}>
                  Okay
                </button>
              )}
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
          onProceed={(ticket) => {
            setPrefillTicket(ticket);
            setPrefillMode('complete_record');
            setTab('add');
          }}
          onEdit={(ticket) => {
            setViewingTicket(null);
            setEditingTicket(ticket);
            setTab('estimation');
          }}
          onShowAlert={(title, message) => {
            setAlertModal({ show: true, title, message });
          }}
          onShowConfirm={handleShowConfirm}
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
