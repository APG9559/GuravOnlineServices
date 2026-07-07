import { useMemo } from 'react';
import {
  affidavitsApi, marriagesApi, birthDeathApi, propertyCardsApi,
  shopActLicensesApi, tradeLicensesApi, panCardsApi, passportsApi, voterCardsApi, gazettesApi, waterSuppliesApi, propertyTaxesApi
} from '@/api';
import {
  WATER_SERVICE_TYPE_LABELS, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS, SERVICE_TYPE_LABELS,
  PROPERTY_TAX_SERVICE_TYPE_LABELS, SubTab, PaperType, AuthorizerType, CertificateType,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AffidavitReceipt, MarriageReceipt, BirthDeathReceipt,
  PropertyCardReceipt, ShopActLicenseReceipt, TradeLicenseReceipt, PanCardReceipt, PassportReceipt, VoterCardReceipt, GazetteReceipt, WaterSupplyReceipt, PropertyTaxReceipt,
} from '@/components/ReceiptModal/Receipt';
import { usePricing } from '@/hooks/usePricing';
import RecordEditModal from '@/components/RecordEditModal';
import ViewRecordModal from '@/components/ViewRecordModal';
import { useToast } from '@/context/ToastContext';

// Hooks & Subcomponents
import { useRecordsFilter, TopCategory } from '@/components/Records/hooks/useRecordsFilter';
import FilterBar from '@/components/Records/components/FilterBar';
import RecordsTable from '@/components/Records/components/RecordsTable';

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const matches = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (matches) {
    const [, year, month, day] = matches;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

const COLUMNS_MAP: Record<SubTab, { header: string; className?: string; style?: React.CSSProperties; render: (row: any, index: number) => React.ReactNode }[]> = {
  affidavits: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Purpose', render: (r) => (
        <div style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <div>{r.purpose}</div>
          {r.affidavitNo && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }} title={r.affidavitNo}>No: {r.affidavitNo}</div>}
          {r.remark && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }} title={r.remark}>Remark: {r.remark}</div>}
        </div>
      )
    },
    { header: 'Paper', render: (r) => <span className="badge badge-blue">{r.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}</span> },
    { header: 'Auth', render: (r) => <span className={`badge ${r.authorizerType === 'magistrate' ? 'badge-green' : 'badge-amber'}`}>{r.authorizerType === 'magistrate' ? 'Magistrate' : 'Notary'}</span> },
  ],
  marriages: [
    { header: 'Contact', render: (r) => r.contactName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Spouses', render: (r) => <span style={{ fontSize: 12 }}>{r.spouse1Name} &amp; {r.spouse2Name}</span> },
    { header: 'Act', render: (r) => <span className="badge badge-blue" style={{ fontSize: 11 }}>{r.marriageAct === 'Hindu Marriage Act' ? 'Hindu' : r.marriageAct === 'Muslim Personal Law (Shariat)' ? 'Muslim' : 'Christian'}</span> },
  ],
  birthDeath: [
    { header: 'Type', render: (r) => <span className={`badge ${r.certificateType === 'Birth' ? 'badge-green' : 'badge-amber'}`}>{r.certificateType}</span> },
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Person', render: (r) => r.personName },
    { header: 'Event Date', render: (r) => fmtDate(r.eventDate) },
    { header: 'Copies', render: (r) => r.numberOfCopies, style: { textAlign: 'center' } },
  ],
  propertyCards: [
    { header: 'Type', render: (r) => <span className="badge badge-blue">{r.recordType}</span> },
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Property No.', render: (r) => r.propertyNumber },
  ],
  shopAct: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Business', render: (r) => r.businessName },
    { header: 'Email', render: (r) => r.email || '—', style: { color: 'var(--text-muted)', fontSize: 12 } },
  ],
  tradeLicenses: [
    { header: 'Service', render: (r) => <span className="badge badge-blue">{SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
    { header: 'Business Name', render: (r) => r.business?.name || '—', style: { fontWeight: 500 } },
    { header: 'License No', render: (r) => r.business?.licenseNo ? <span className="badge badge-green" style={{ fontSize: 11 }}>{r.business.licenseNo}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { header: 'Phone', render: (r) => r.business?.phone || '—' },
    { header: 'Token', render: (r) => r.tokenNo || '—' },
  ],
  waterSupplies: [
    { header: 'Service Type', render: (r) => <span className="badge badge-green">{WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
    { header: 'Customer Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Connection Address', render: (r) => r.connectionAddress, style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
    { header: 'Token', render: (r) => r.applicationTokenNo },
  ],
  propertyTaxes: [
    { header: 'Service Type', render: (r) => <span className="badge badge-green">{PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
    { header: 'Customer Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Address', render: (r) => r.address, style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
    { header: 'Property Tax No.', render: (r) => r.propertyTaxNo },
  ],
  panCards: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
    { header: 'Ack No.', render: (r) => r.ackNo || '—' },
    { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
    { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
  ],
  passports: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
    { header: 'File No.', render: (r) => r.fileNo || '—' },
    { header: 'Appointment Date', render: (r) => fmtDate(r.appointmentDate) },
    { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
    { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
  ],
  voterCards: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
    { header: 'Token / EPIC No.', render: (r) => r.applicationType === 'New' ? `Token: ${r.tokenNo || '—'}` : `EPIC: ${r.epicNo || '—'}` },
    { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
    { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
  ],
  gazettes: [
    { header: 'Token No', render: (r) => r.tokenNo || '—', style: { fontWeight: 600 } },
    { header: 'Applicant Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Old Name', render: (r) => r.oldName },
    { header: 'New Name', render: (r) => r.newName },
    { header: 'Reason to Change', render: (r) => <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reasonToChangeName}>{r.reasonToChangeName}</div> },
    { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
    { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
  ],
};

const EXPORT_MAPPERS: Record<SubTab, {
  sheetName: string;
  fileName: string;
  mapRow: (r: any) => Record<string, any>;
}> = {
  affidavits: {
    sheetName: 'Affidavits',
    fileName: 'affidavits',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Purpose: r.purpose, 'Affidavit No': r.affidavitNo || '', Paper: PAPER_LABELS[r.paperType as PaperType], Authorizer: AUTH_LABELS[r.authorizerType as AuthorizerType], 'Auth Name': r.authorizerName || '', Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  marriages: {
    sheetName: 'Marriages',
    fileName: 'marriages',
    mapRow: (r) => ({ Date: r.dateOfService, Contact: r.contactName, Phone: r.phone, Spouse1: r.spouse1Name, Spouse2: r.spouse2Name, Act: r.marriageAct, MarriageDate: r.marriageDate, Services: (r.servicesProvided || []).join(', '), Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  birthDeath: {
    sheetName: 'BirthDeath',
    fileName: 'birth_death',
    mapRow: (r) => ({ Date: r.dateOfService, Type: CERT_TYPE_LABELS[r.certificateType as CertificateType], Name: r.customerName, Phone: r.phone, PersonName: r.personName, EventDate: r.eventDate, Copies: r.numberOfCopies, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  propertyCards: {
    sheetName: 'PropertyCards',
    fileName: 'property_cards',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.recordType, PropertyNo: r.propertyNumber, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  shopAct: {
    sheetName: 'ShopActLicenses',
    fileName: 'shop_act',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Business: r.businessName, Email: r.email || '', Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  tradeLicenses: {
    sheetName: 'TradeLicenses',
    fileName: 'trade_licenses',
    mapRow: (r) => ({ Date: r.dateOfService, Service: SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType, Business: r.business?.name || '—', LicenseNo: r.business?.licenseNo || '—', Phone: r.business?.phone || '—', TokenNo: r.tokenNo || '—', LicenseFee: r.licenseFee, FireFee: r.fireFee || 0, ServiceFee: r.serviceFee, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  panCards: {
    sheetName: 'PanCards',
    fileName: 'pan_cards',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'Ack No': r.ackNo || '', Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  passports: {
    sheetName: 'Passports',
    fileName: 'passports',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'File No': r.fileNo || '', 'Appointment Date': r.appointmentDate || '', Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  voterCards: {
    sheetName: 'VoterCards',
    fileName: 'voter_cards',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'Token No': r.tokenNo || '', 'EPIC No': r.epicNo || '', 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  gazettes: {
    sheetName: 'Gazettes',
    fileName: 'gazettes',
    mapRow: (r) => ({ Date: r.dateOfService, 'Token No': r.tokenNo || '', Name: r.customerName, Phone: r.phone, 'Old Name': r.oldName, 'New Name': r.newName, Reason: r.reasonToChangeName, 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  waterSupplies: {
    sheetName: 'WaterSupplies',
    fileName: 'water_supply',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType, Address: r.connectionAddress, Token: r.applicationTokenNo, 'App Date': r.applicationDate, 'Plumber Name': r.plumberName || '', 'Plumber Phone': r.plumberPhone || '', 'Contact Name': r.contactPersonName || '', 'Contact Phone': r.contactPersonPhone || '', 'Connection No': r.connectionNo || '', 'Current Owner': r.currentOwner || '', 'New Owner Name': r.newOwnerName || '', 'New Owner Phone': r.newOwnerPhone || '', 'Transfer Subtype': r.transferSubtype ? (({ Purchase: 'By Purchase', Inheritance: 'By Inheritance', GiftDeed: 'By Gift Deed', SubDivision: 'By Property sub-division', CourtOrder: 'By Court Order' } as Record<string, string>)[r.transferSubtype] || r.transferSubtype) : '', 'Current Usage': r.currentUsage || '', 'New Usage': r.newUsage || '', 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
  propertyTaxes: {
    sheetName: 'PropertyTaxes',
    fileName: 'property_tax',
    mapRow: (r) => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType, Address: r.address, 'Property Tax No': r.propertyTaxNo, 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, 'Protocol Fee': r.protocolFee, Amount: r.amountCharged, By: r.createdBy?.name }),
  },
};

const RECEIPT_MAP: Record<SubTab, React.ComponentType<{ record: any }>> = {
  affidavits: AffidavitReceipt,
  marriages: MarriageReceipt,
  birthDeath: BirthDeathReceipt,
  propertyCards: PropertyCardReceipt,
  shopAct: ShopActLicenseReceipt,
  tradeLicenses: TradeLicenseReceipt,
  panCards: PanCardReceipt,
  passports: PassportReceipt,
  voterCards: VoterCardReceipt,
  gazettes: GazetteReceipt,
  waterSupplies: WaterSupplyReceipt,
  propertyTaxes: PropertyTaxReceipt,
};

const API_MAP: Record<SubTab, any> = {
  affidavits: affidavitsApi,
  marriages: marriagesApi,
  birthDeath: birthDeathApi,
  propertyCards: propertyCardsApi,
  shopAct: shopActLicensesApi,
  tradeLicenses: tradeLicensesApi,
  panCards: panCardsApi,
  passports: passportsApi,
  voterCards: voterCardsApi,
  gazettes: gazettesApi,
  waterSupplies: waterSuppliesApi,
  propertyTaxes: propertyTaxesApi,
};

export default function RecordsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { pricing } = usePricing();

  const recordsFilter = useRecordsFilter();
  const {
    topCategory,
    subTab,
    setSubTab,
    search,
    setSearch,
    debouncedSearch,
    from,
    setFrom,
    to,
    setTo,
    editingRecord,
    setEditingRecord,
    viewingRecord,
    setViewingRecord,
    printRecord,
    currentPage,
    setCurrentPage,
    PAGE_SIZE,
    recordsList,
    totalCount,
    totalPages,
    isLoading,
    deleteMutation,
    updateMutation,
    triggerPrint,
    handleTopCategoryChange,
    receiptRef,
  } = recordsFilter;

  const KMC_SUB_TABS = [
    { key: 'marriages' as SubTab, label: 'Marriages', count: subTab === 'marriages' ? totalCount : 0 },
    { key: 'birthDeath' as SubTab, label: 'Birth/Death', count: subTab === 'birthDeath' ? totalCount : 0 },
    { key: 'tradeLicenses' as SubTab, label: 'Trade Licenses', count: subTab === 'tradeLicenses' ? totalCount : 0 },
    { key: 'waterSupplies' as SubTab, label: 'Water Supply', count: subTab === 'waterSupplies' ? totalCount : 0 },
    { key: 'propertyTaxes' as SubTab, label: 'Property Tax', count: subTab === 'propertyTaxes' ? totalCount : 0 },
  ];

  const CSC_SUB_TABS = [
    { key: 'panCards' as SubTab, label: 'PAN Cards', count: subTab === 'panCards' ? totalCount : 0 },
    { key: 'passports' as SubTab, label: 'Passports', count: subTab === 'passports' ? totalCount : 0 },
  ];

  const AAPLE_SARKAR_SUB_TABS = [
    { key: 'affidavits' as SubTab, label: 'Affidavits', count: subTab === 'affidavits' ? totalCount : 0 },
    { key: 'propertyCards' as SubTab, label: 'Property Cards', count: subTab === 'propertyCards' ? totalCount : 0 },
    { key: 'shopAct' as SubTab, label: 'Shop Act Licenses', count: subTab === 'shopAct' ? totalCount : 0 },
    { key: 'gazettes' as SubTab, label: 'Gazette', count: subTab === 'gazettes' ? totalCount : 0 },
    { key: 'voterCards' as SubTab, label: 'Voter Cards', count: subTab === 'voterCards' ? totalCount : 0 },
  ];

  const KMC_COUNT = KMC_SUB_TABS.reduce((acc, t) => acc + t.count, 0);
  const CSC_COUNT = CSC_SUB_TABS.reduce((acc, t) => acc + t.count, 0);
  const AAPLE_SARKAR_COUNT = AAPLE_SARKAR_SUB_TABS.reduce((acc, t) => acc + t.count, 0);

  const TOP_CATEGORIES = [
    { key: 'KMC' as TopCategory, label: 'KMC Services', count: KMC_COUNT },
    { key: 'CSC' as TopCategory, label: 'CSC Services', count: CSC_COUNT },
    { key: 'AapleSarkar' as TopCategory, label: 'Aaple Sarkar Services', count: AAPLE_SARKAR_COUNT },
  ];

  const currentSubTabs =
    topCategory === 'KMC'
      ? KMC_SUB_TABS
      : topCategory === 'CSC'
        ? CSC_SUB_TABS
        : AAPLE_SARKAR_SUB_TABS;

  const todayStr = () => new Date().toISOString().split('T')[0];

  const exportCurrent = async () => {
    const config = EXPORT_MAPPERS[subTab];
    if (!config) return;
    const exportParams = {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
    try {
      const response = await API_MAP[subTab].getAll(exportParams);
      const allRecords = response.data;
      const rows = allRecords.map(config.mapRow);
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
      XLSX.writeFile(wb, `${config.fileName}_${todayStr()}.xlsx`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to export records.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <div className="page-title">Records</div>
      </div>

      {/* Top Level Category Tabs */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {TOP_CATEGORIES.map(({ key, label, count }) => (
          <button key={key} className={`tab ${topCategory === key ? 'active' : ''}`} onClick={() => handleTopCategoryChange(key)}>
            {label}
            {count > 0 && <span className="badge badge-blue" style={{ marginLeft: 6 }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Sub tabs nested */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', background: 'var(--bg)', borderWidth: '2px', padding: '4px', scale: '0.95', transformOrigin: 'left center', marginBottom: '1.5rem' }}>
        {currentSubTabs.map(({ key, label, count }) => (
          <button key={key} className={`tab ${subTab === key ? 'active' : ''}`} onClick={() => setSubTab(key)} style={{ padding: '6px 10px', fontSize: '12px' }}>
            {label}
            {count > 0 && <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: '10px', padding: '2px 6px' }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        exportCurrent={exportCurrent}
      />

      {/* Unified Table */}
      <RecordsTable
        isLoading={isLoading}
        recordsList={recordsList}
        columns={COLUMNS_MAP[subTab]}
        currentPage={currentPage}
        PAGE_SIZE={PAGE_SIZE}
        totalPages={totalPages}
        totalCount={totalCount}
        setCurrentPage={setCurrentPage}
        onPrint={(r) => triggerPrint(subTab, r)}
        onEdit={(r) => setEditingRecord({ type: subTab, data: r })}
        onDelete={isAdmin ? (id) => deleteMutation.mutate({ type: subTab, id }) : undefined}
        onView={(r) => setViewingRecord({ type: subTab, data: r })}
        isAdmin={isAdmin}
      />

      {/* Dynamic Edit Modal */}
      {editingRecord && (
        <RecordEditModal
          type={editingRecord.type}
          record={editingRecord.data}
          onClose={() => setEditingRecord(null)}
          onSave={(data) => updateMutation.mutate({ type: editingRecord.type, id: editingRecord.data.id, data })}
          saving={updateMutation.isPending}
        />
      )}

      {/* Dynamic View Detail Modal */}
      {viewingRecord && (
        <ViewRecordModal
          type={viewingRecord.type}
          record={viewingRecord.data}
          pricing={pricing}
          onClose={() => setViewingRecord(null)}
        />
      )}

      {/* Hidden print targets */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printRecord && (() => {
          const ReceiptComp = RECEIPT_MAP[printRecord.type];
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
