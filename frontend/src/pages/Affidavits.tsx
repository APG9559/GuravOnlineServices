import { useState, useRef } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import { Affidavit } from '@/types';
import { AffidavitReceipt } from '@/components/ReceiptModal/Receipt';
import NewRecordForm from '@/components/Affidavits/NewRecordForm';
import SuccessModal from '@/components/Affidavits/SuccessModal';

export default function AffidavitsPage() {
  const [savedRecord, setSavedRecord] = useState<Affidavit | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Affidavit / Notary</div>
      </div>

      {/* ── Add record form ── */}
      <NewRecordForm
        onSaveSuccess={(record) => {
          setSavedRecord(record);
          setShowSuccessModal(true);
        }}
      />

      {/* Success Modal Popup */}
      {showSuccessModal && savedRecord && (
        <SuccessModal
          savedRecord={savedRecord}
          onClose={() => setShowSuccessModal(false)}
          onPrint={handlePrint}
        />
      )}

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <AffidavitReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
