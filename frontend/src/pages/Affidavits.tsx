import { useState, useRef } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import { Affidavit } from '@/types';
import { AffidavitReceipt } from '@/components/ReceiptModal/Receipt';
import NewRecordForm from '@/components/Affidavits/NewRecordForm';
import SuccessModal from '@/components/Affidavits/SuccessModal';
import CustomerShareReceiptModal from '@/components/Customers/CustomerShareReceiptModal';

export default function AffidavitsPage() {
  const [savedRecord, setSavedRecord] = useState<Affidavit | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
          onShare={() => setShowShareModal(true)}
        />
      )}

      {showShareModal && savedRecord && (
        <CustomerShareReceiptModal
          service={{
            id: savedRecord.id,
            type: 'affidavit',
            typeName: 'Affidavit / Notary',
            dateOfService: savedRecord.dateOfService,
            amountCharged: savedRecord.amountCharged,
            description: `Affidavit - ${savedRecord.purpose}`,
            createdBy: savedRecord.createdBy?.name || '',
            createdAt: savedRecord.createdAt,
          }}
          customer={{
            id: savedRecord.customer?.id || '',
            name: savedRecord.customerName,
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

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <AffidavitReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
