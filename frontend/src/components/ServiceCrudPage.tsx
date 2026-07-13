import { useState, useRef, useCallback } from 'react';
import { useAppPrint } from '@/hooks/useAppPrint';
import SuccessModal from '@/components/SuccessModal';
import CustomerShareReceiptModal from '@/components/Customers/CustomerShareReceiptModal';
import type { CustomerServiceUsage, CustomerDetails } from '@/types';

interface CrudRecord {
  id: string;
  customerName: string;
  phone?: string;
  dateOfService: string;
  amountCharged: number;
  createdBy?: { name?: string };
  customer?: {
    id: string;
    name?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCrudPageConfig<T extends CrudRecord> {
  title: string;
  queryKey: string;
  receiptType: string;
  receiptTypeName: string;
  api: {
    create: (data: unknown) => Promise<{ data: T }>;
  };
  receiptComponent: React.ForwardRefExoticComponent<
    { record: T } & React.RefAttributes<HTMLDivElement>
  >;
  formComponent: React.ComponentType<{
    onSaveSuccess: (record: T) => void;
  }>;
  getDescription: (record: T) => string;
}

interface Props<T extends CrudRecord> {
  config: ServiceCrudPageConfig<T>;
}

export default function ServiceCrudPage<T extends CrudRecord>({ config }: Props<T>) {
  const [savedRecord, setSavedRecord] = useState<T | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const handleSaveSuccess = useCallback((record: T) => {
    setSavedRecord(record);
    setShowSuccessModal(true);
  }, []);

  const receiptService: CustomerServiceUsage | null = savedRecord
    ? {
        id: savedRecord.id,
        type: config.receiptType as CustomerServiceUsage['type'],
        typeName: config.receiptTypeName,
        dateOfService: savedRecord.dateOfService,
        amountCharged: savedRecord.amountCharged,
        description: config.getDescription(savedRecord),
        createdBy: savedRecord.createdBy?.name || '',
        createdAt: savedRecord.createdAt || '',
      }
    : null;

  const receiptCustomer: CustomerDetails | null = savedRecord?.customer
    ? {
        id: savedRecord.customer.id,
        name: savedRecord.customer.name || savedRecord.customerName,
        phone: savedRecord.customer.phone || savedRecord.phone || '',
        createdAt: savedRecord.customer.createdAt || '',
        updatedAt: savedRecord.customer.updatedAt || '',
        services: [],
        address: null,
        email: null,
      }
    : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{config.title}</div>
      </div>

      <config.formComponent onSaveSuccess={handleSaveSuccess} />

      {showSuccessModal && savedRecord && (
        <SuccessModal
          title={`${config.receiptTypeName} Record Saved!`}
          customerName={savedRecord.customerName}
          onClose={() => setShowSuccessModal(false)}
          onPrint={handlePrint}
          onShare={() => setShowShareModal(true)}
        />
      )}

      {showShareModal && savedRecord && receiptService && receiptCustomer && (
        <CustomerShareReceiptModal
          service={receiptService}
          customer={receiptCustomer}
          onClose={() => {
            setShowShareModal(false);
            setSavedRecord(null);
          }}
        />
      )}

      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <config.receiptComponent ref={receiptRef} record={savedRecord} />
        </div>
      )}
    </div>
  );
}
