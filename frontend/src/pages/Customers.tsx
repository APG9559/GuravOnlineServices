import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { customersApi, waterSuppliesApi, propertyTaxesApi } from '@/api';
import { Customer, CustomerDetails, CustomerServiceUsage } from '@/types';
import {
  AffidavitReceipt,
  MarriageReceipt,
  BirthDeathReceipt,
  PropertyCardReceipt,
  ShopActLicenseReceipt,
  TradeLicenseReceipt,
  PanCardReceipt,
  PassportReceipt,
  GazetteReceipt,
  WaterSupplyReceipt,
  PropertyTaxReceipt,
} from '@/components/ReceiptModal/Receipt';
import useIsMobile from '@/hooks/useIsMobile';
import useDebounce from '@/hooks/useDebounce';
import CustomerTable from '@/components/Customers/CustomerTable';
import CustomerHistoryPanel from '@/components/Customers/CustomerHistoryPanel';
import EditCustomerModal from '@/components/Customers/EditCustomerModal';

const RECEIPT_MAP: Record<string, React.ComponentType<{ record: never }>> = {
  affidavit: AffidavitReceipt as never,
  marriage: MarriageReceipt as never,
  'birth-death': BirthDeathReceipt as never,
  'property-card': PropertyCardReceipt as never,
  'shop-act': ShopActLicenseReceipt as never,
  'trade-license': TradeLicenseReceipt as never,
  'pan-card': PanCardReceipt as never,
  passport: PassportReceipt as never,
  gazette: GazetteReceipt as never,
  'water-supply': WaterSupplyReceipt as never,
  'property-tax': PropertyTaxReceipt as never,
};

export default function CustomersPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Edit State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Print States for historic receipt printing
  const [printRecord, setPrintRecord] = useState<{ type: string; data: Record<string, unknown> } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });

  const triggerPrint = (type: string, recordData: Record<string, unknown>) => {
    setPrintRecord({ type, data: recordData });
    setTimeout(handlePrint, 100);
  };

  // Get all customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch, page],
    queryFn: () =>
      customersApi
        .getAll({
          search: debouncedSearch,
          page: page.toString(),
          limit: limit.toString(),
        })
        .then((r) => r.data) as unknown as Promise<{
        data: Customer[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>,
  });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1); // Reset to first page when search changes
  };

  // Get active customer details (profile + timeline history)
  const { data: customerDetails, isLoading: detailsLoading } = useQuery<CustomerDetails>({
    queryKey: ['customerDetails', selectedCustomerId],
    queryFn: () => customersApi.getOne(selectedCustomerId!).then((r) => r.data),
    enabled: !!selectedCustomerId,
  });

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
  };

  const handlePrintReceipt = (service: CustomerServiceUsage) => {
    // Reconstruct the record parameters required by components in Receipt.tsx
    const mockRecord: Record<string, unknown> = {
      id: service.id,
      customerName: customerDetails?.name || '',
      contactName: customerDetails?.name || '',
      phone: customerDetails?.phone || '',
      contactEmail: customerDetails?.email || '',
      email: customerDetails?.email || '',
      address: customerDetails?.address || '',
      dateOfService: service.dateOfService,
      amountCharged: service.amountCharged,
      createdBy: { name: service.createdBy },
      createdAt: service.createdAt,
    };

    // Depending on the service type, set correct print state and trigger print handler
    if (service.type === 'affidavit') {
      // Extract from description like "Purpose: Affidavit (Plain, magistrate)"
      const purposeMatch = service.description.match(/Purpose:\s*([^(]+)/);
      const purpose = purposeMatch ? purposeMatch[1].trim() : 'Affidavit';
      const paperType = service.description.includes('₹500 Stamp') ? 'stamp500' : 'Plain';
      const authorizerType = service.description.includes('Notary') ? 'Notary' : 'magistrate';

      mockRecord.purpose = purpose;
      mockRecord.paperType = paperType;
      mockRecord.authorizerType = authorizerType;

      triggerPrint('affidavit', mockRecord);
    } else if (service.type === 'marriage') {
      // Extract spouse names from "Marriage between Spouse1 & Spouse2 (Hindu Marriage Act)"
      const spousesMatch = service.description.match(/Marriage between\s*([^&]+)\s*&\s*([^(]+)/);
      const spouse1Name = spousesMatch ? spousesMatch[1].trim() : 'Spouse 1';
      const spouse2Name = spousesMatch ? spousesMatch[2].trim() : 'Spouse 2';

      const actMatch = service.description.match(/\(([^)]+)\)/);
      const marriageAct = actMatch ? actMatch[1] : 'Hindu Marriage Act';

      mockRecord.spouse1Name = spouse1Name;
      mockRecord.spouse2Name = spouse2Name;
      mockRecord.marriageAct = marriageAct;
      mockRecord.marriageDate = service.dateOfService;

      triggerPrint('marriage', mockRecord);
    } else if (service.type === 'birth-death') {
      const isBirth = service.typeName.startsWith('Birth');
      const personMatch = service.description.match(/(?:for)\s*([^(]+)/);
      const personName = personMatch ? personMatch[1].trim() : 'Person';

      mockRecord.certificateType = isBirth ? 'Birth' : 'Death';
      mockRecord.personName = personName;
      mockRecord.eventDate = service.dateOfService;
      mockRecord.numberOfCopies = 1;

      triggerPrint('birth-death', mockRecord);
    } else if (service.type === 'property-card') {
      const recordType = service.typeName;
      const numMatch = service.description.match(/(?:Property No:)\s*(.+)$/);
      const propertyNumber = numMatch ? numMatch[1].trim() : 'N/A';

      mockRecord.recordType = recordType;
      mockRecord.propertyNumber = propertyNumber;

      triggerPrint('property-card', mockRecord);
    } else if (service.type === 'shop-act') {
      const bizMatch = service.description.match(/(?:License for)\s*(.+)$/);
      const businessName = bizMatch ? bizMatch[1].trim() : 'Business';

      mockRecord.businessName = businessName;

      triggerPrint('shop-act', mockRecord);
    } else if (service.type === 'trade-license') {
      const match = service.description.match(/Business:\s*(.+?)\s*\((.+?)\)/);
      const bizName = match ? match[1].trim() : 'Business';
      const serviceType = match ? match[2].trim() : 'New';

      mockRecord.serviceType = serviceType;
      mockRecord.business = { name: bizName };
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      triggerPrint('trade-license', mockRecord);
    } else if (service.type === 'pan-card') {
      const appTypeMatch = service.description.match(/PAN Application\s*\((.+?)\)/);
      const applicationType = appTypeMatch ? appTypeMatch[1].trim() : 'New';
      const ackMatch = service.description.match(/Ack:\s*(.+)$/);
      const ackNo = ackMatch && ackMatch[1] !== 'N/A' ? ackMatch[1].trim() : null;

      mockRecord.applicationType = applicationType;
      mockRecord.ackNo = ackNo;
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      triggerPrint('pan-card', mockRecord);
    } else if (service.type === 'passport') {
      const appTypeMatch = service.description.match(/Passport Application\s*\((.+?)\)/);
      const applicationType = appTypeMatch ? appTypeMatch[1].trim() : 'Fresh';
      const fileMatch = service.description.match(/File No:\s*(.+)$/);
      const fileNo = fileMatch && fileMatch[1] !== 'N/A' ? fileMatch[1].trim() : null;

      mockRecord.applicationType = applicationType;
      mockRecord.fileNo = fileNo;
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      triggerPrint('passport', mockRecord);
    } else if (service.type === 'gazette') {
      const namesMatch = service.description.match(/Name Change:\s*(.+?)\s*→\s*(.+?)\s*\(Reason:/);
      const oldName = namesMatch ? namesMatch[1].trim() : '';
      const newName = namesMatch ? namesMatch[2].trim() : '';
      const reasonMatch = service.description.match(/\(Reason:\s*(.+?)\)/);
      const reasonToChangeName = reasonMatch ? reasonMatch[1].trim() : '';

      mockRecord.oldName = oldName;
      mockRecord.newName = newName;
      mockRecord.reasonToChangeName = reasonToChangeName;
      mockRecord.officialFee = 500;
      mockRecord.serviceFee = service.amountCharged - 500;

      triggerPrint('gazette', mockRecord);
    } else if (service.type === 'water-supply') {
      waterSuppliesApi
        .getById(service.id)
        .then((res) => {
          if (res.data) {
            triggerPrint('water-supply', res.data as unknown as Record<string, unknown>);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load water supply details', err);
        });
    } else if (service.type === 'property-tax') {
      propertyTaxesApi
        .getOne(service.id)
        .then((res) => {
          if (res.data) {
            triggerPrint('property-tax', res.data as unknown as Record<string, unknown>);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to load property tax details', err);
        });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Customers</div>
      </div>

      <div
        className={`customers-layout ${selectedCustomerId && !isMobile ? 'two-col' : 'one-col'}`}
      >
        {/* Customer Directory List */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              placeholder="Search by name, phone, address..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ flex: 1 }}
            />
            {search && (
              <button className="btn" onClick={() => handleSearchChange('')}>
                Clear
              </button>
            )}
          </div>

          <CustomerTable
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            isMobile={isMobile}
            isLoading={isLoading}
            page={page}
            limit={limit}
          />

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{ minWidth: '80px' }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Page {page} of {totalPages} ({total} customers)
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{ minWidth: '80px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Customer Unified Service History View — Desktop: side panel */}
        {selectedCustomerId && !isMobile && (
          <CustomerHistoryPanel
            customerDetails={customerDetails}
            detailsLoading={detailsLoading}
            onEditClick={handleEditClick}
            onClose={() => setSelectedCustomerId(null)}
            onPrintReceipt={handlePrintReceipt}
          />
        )}
      </div>

      {/* Mobile History Modal */}
      {selectedCustomerId && isMobile && (
        <div className="mobile-history-overlay" onClick={() => setSelectedCustomerId(null)}>
          <div className="mobile-history-modal" onClick={(e) => e.stopPropagation()}>
            <CustomerHistoryPanel
              customerDetails={customerDetails}
              detailsLoading={detailsLoading}
              onEditClick={handleEditClick}
              onClose={() => setSelectedCustomerId(null)}
              onPrintReceipt={handlePrintReceipt}
              isMobileModal
            />
          </div>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {editingCustomer && selectedCustomerId && (
        <EditCustomerModal
          customer={editingCustomer}
          selectedCustomerId={selectedCustomerId}
          onClose={() => setEditingCustomer(null)}
          onDeleted={() => setSelectedCustomerId(null)}
        />
      )}

      {/* Hidden print targets for Printing Receipts */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printRecord &&
          (() => {
            const ReceiptComp = RECEIPT_MAP[printRecord.type] as React.ComponentType<{ record: Record<string, unknown> }> | undefined;
            return ReceiptComp ? (
              <div ref={receiptRef}>
                <ReceiptComp record={printRecord.data} />
              </div>
            ) : null;
          })()}
      </div>
    </div>
  );
}
