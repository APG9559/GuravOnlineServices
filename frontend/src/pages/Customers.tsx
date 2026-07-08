import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
import { customersApi, waterSuppliesApi, propertyTaxesApi } from '@/api';
import { Customer, CustomerDetails, CustomerServiceUsage } from '@/types';
import {
  AffidavitReceipt, MarriageReceipt, BirthDeathReceipt,
  PropertyCardReceipt, ShopActLicenseReceipt,
  TradeLicenseReceipt, PanCardReceipt, PassportReceipt, GazetteReceipt, WaterSupplyReceipt, PropertyTaxReceipt
} from '@/components/ReceiptModal/Receipt';
import useIsMobile from '@/hooks/useIsMobile';
import useDebounce from '@/hooks/useDebounce';
import CustomerTable from '@/components/Customers/CustomerTable';
import CustomerHistoryPanel from '@/components/Customers/CustomerHistoryPanel';
import EditCustomerModal from '@/components/Customers/EditCustomerModal';

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
  const [printAff, setPrintAff] = useState<any>(null);
  const [printMar, setPrintMar] = useState<any>(null);
  const [printBd, setPrintBd] = useState<any>(null);
  const [printPc, setPrintPc] = useState<any>(null);
  const [printSal, setPrintSal] = useState<any>(null);
  const [printTl, setPrintTl] = useState<any>(null);
  const [printPan, setPrintPan] = useState<any>(null);
  const [printPassport, setPrintPassport] = useState<any>(null);
  const [printGazette, setPrintGazette] = useState<any>(null);
  const [printWaterSupply, setPrintWaterSupply] = useState<any>(null);
  const [printPropertyTax, setPrintPropertyTax] = useState<any>(null);

  const affReceiptRef = useRef<HTMLDivElement>(null);
  const marReceiptRef = useRef<HTMLDivElement>(null);
  const bdReceiptRef = useRef<HTMLDivElement>(null);
  const pcReceiptRef = useRef<HTMLDivElement>(null);
  const salReceiptRef = useRef<HTMLDivElement>(null);
  const tlReceiptRef = useRef<HTMLDivElement>(null);
  const panReceiptRef = useRef<HTMLDivElement>(null);
  const passportReceiptRef = useRef<HTMLDivElement>(null);
  const gazetteReceiptRef = useRef<HTMLDivElement>(null);
  const waterSupplyReceiptRef = useRef<HTMLDivElement>(null);
  const propertyTaxReceiptRef = useRef<HTMLDivElement>(null);

  const handlePrintAff = useAppPrint({ content: () => affReceiptRef.current });
  const handlePrintMar = useAppPrint({ content: () => marReceiptRef.current });
  const handlePrintBd = useAppPrint({ content: () => bdReceiptRef.current });
  const handlePrintPc = useAppPrint({ content: () => pcReceiptRef.current });
  const handlePrintSal = useAppPrint({ content: () => salReceiptRef.current });
  const handlePrintTl = useAppPrint({ content: () => tlReceiptRef.current });
  const handlePrintPan = useAppPrint({ content: () => panReceiptRef.current });
  const handlePrintPassport = useAppPrint({ content: () => passportReceiptRef.current });
  const handlePrintGazette = useAppPrint({ content: () => gazetteReceiptRef.current });
  const handlePrintWaterSupply = useAppPrint({ content: () => waterSupplyReceiptRef.current });
  const handlePrintPropertyTax = useAppPrint({ content: () => propertyTaxReceiptRef.current });

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
        .then((r) => r.data) as any as Promise<{ data: Customer[]; total: number; page: number; limit: number; totalPages: number }>,
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
    queryFn: () => customersApi.getOne(selectedCustomerId!).then(r => r.data),
    enabled: !!selectedCustomerId,
  });

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
  };

  const handlePrintReceipt = (service: CustomerServiceUsage) => {
    // Reconstruct the record parameters required by components in Receipt.tsx
    const mockRecord: any = {
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

      setPrintAff(mockRecord);
      setTimeout(handlePrintAff, 100);
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

      setPrintMar(mockRecord);
      setTimeout(handlePrintMar, 100);
    } else if (service.type === 'birth-death') {
      const isBirth = service.typeName.startsWith('Birth');
      const personMatch = service.description.match(/(?:for)\s*([^(]+)/);
      const personName = personMatch ? personMatch[1].trim() : 'Person';

      mockRecord.certificateType = isBirth ? 'Birth' : 'Death';
      mockRecord.personName = personName;
      mockRecord.eventDate = service.dateOfService;
      mockRecord.numberOfCopies = 1;

      setPrintBd(mockRecord);
      setTimeout(handlePrintBd, 100);
    } else if (service.type === 'property-card') {
      const recordType = service.typeName;
      const numMatch = service.description.match(/(?:Property No:)\s*(.+)$/);
      const propertyNumber = numMatch ? numMatch[1].trim() : 'N/A';

      mockRecord.recordType = recordType;
      mockRecord.propertyNumber = propertyNumber;

      setPrintPc(mockRecord);
      setTimeout(handlePrintPc, 100);
    } else if (service.type === 'shop-act') {
      const bizMatch = service.description.match(/(?:License for)\s*(.+)$/);
      const businessName = bizMatch ? bizMatch[1].trim() : 'Business';

      mockRecord.businessName = businessName;

      setPrintSal(mockRecord);
      setTimeout(handlePrintSal, 100);
    } else if (service.type === 'trade-license') {
      const match = service.description.match(/Business:\s*(.+?)\s*\((.+?)\)/);
      const bizName = match ? match[1].trim() : 'Business';
      const serviceType = match ? match[2].trim() : 'New';

      mockRecord.serviceType = serviceType;
      mockRecord.business = { name: bizName };
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      setPrintTl(mockRecord);
      setTimeout(handlePrintTl, 100);
    } else if (service.type === 'pan-card') {
      const appTypeMatch = service.description.match(/PAN Application\s*\((.+?)\)/);
      const applicationType = appTypeMatch ? appTypeMatch[1].trim() : 'New';
      const ackMatch = service.description.match(/Ack:\s*(.+)$/);
      const ackNo = ackMatch && ackMatch[1] !== 'N/A' ? ackMatch[1].trim() : null;

      mockRecord.applicationType = applicationType;
      mockRecord.ackNo = ackNo;
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      setPrintPan(mockRecord);
      setTimeout(handlePrintPan, 100);
    } else if (service.type === 'passport') {
      const appTypeMatch = service.description.match(/Passport Application\s*\((.+?)\)/);
      const applicationType = appTypeMatch ? appTypeMatch[1].trim() : 'Fresh';
      const fileMatch = service.description.match(/File No:\s*(.+)$/);
      const fileNo = fileMatch && fileMatch[1] !== 'N/A' ? fileMatch[1].trim() : null;

      mockRecord.applicationType = applicationType;
      mockRecord.fileNo = fileNo;
      mockRecord.officialFee = 0;
      mockRecord.serviceFee = service.amountCharged;

      setPrintPassport(mockRecord);
      setTimeout(handlePrintPassport, 100);
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

      setPrintGazette(mockRecord);
      setTimeout(handlePrintGazette, 100);
    } else if (service.type === 'water-supply') {
      waterSuppliesApi.getOne(service.id).then((res) => {
        if (res.data) {
          setPrintWaterSupply(res.data);
          setTimeout(handlePrintWaterSupply, 100);
        }
      }).catch((err) => {
        console.error("Failed to load water supply details", err);
      });
    } else if (service.type === 'property-tax') {
      propertyTaxesApi.getOne(service.id).then((res) => {
        if (res.data) {
          setPrintPropertyTax(res.data);
          setTimeout(handlePrintPropertyTax, 100);
        }
      }).catch((err) => {
        console.error("Failed to load property tax details", err);
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Customers</div>
      </div>

      <div className={`customers-layout ${selectedCustomerId && !isMobile ? 'two-col' : 'one-col'}`}>
        {/* Customer Directory List */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              placeholder="Search by name, phone, address..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ flex: 1 }}
            />
            {search && <button className="btn" onClick={() => handleSearchChange('')}>Clear</button>}
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
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
        {printAff && <AffidavitReceipt ref={affReceiptRef} record={printAff} />}
        {printMar && <MarriageReceipt ref={marReceiptRef} record={printMar} />}
        {printBd && <BirthDeathReceipt ref={bdReceiptRef} record={printBd} />}
        {printPc && <PropertyCardReceipt ref={pcReceiptRef} record={printPc} />}
        {printSal && <ShopActLicenseReceipt ref={salReceiptRef} record={printSal} />}
        {printTl && <TradeLicenseReceipt ref={tlReceiptRef} record={printTl} />}
        {printPan && <PanCardReceipt ref={panReceiptRef} record={printPan} />}
        {printPassport && <PassportReceipt ref={passportReceiptRef} record={printPassport} />}
        {printGazette && <GazetteReceipt ref={gazetteReceiptRef} record={printGazette} />}
        {printWaterSupply && <WaterSupplyReceipt ref={waterSupplyReceiptRef} record={printWaterSupply} />}
        {printPropertyTax && <PropertyTaxReceipt ref={propertyTaxReceiptRef} record={printPropertyTax} />}
      </div>
    </div>
  );
}
