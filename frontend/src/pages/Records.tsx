import { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppPrint } from '@/hooks/useAppPrint';
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
import NeoDatePicker from '@/components/NeoDatePicker';
import RecordEditModal from '@/components/RecordEditModal';
import ViewRecordModal from '@/components/ViewRecordModal';
import useDebounce from '@/hooks/useDebounce';

function fmtDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const matches = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (matches) {
    const [, year, month, day] = matches;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

type TopCategory = 'KMC' | 'CSC' | 'AapleSarkar';

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
    mapRow: (r) => ({ Date: r.dateOfService, Service: SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType, Business: r.business?.name || '—', LicenseNo: r.business?.licenseNo || '—', Phone: r.business?.phone || '—', TokenNo: r.tokenNo || '—', OfficialFee: r.officialFee, ServiceFee: r.serviceFee, Amount: r.amountCharged, By: r.createdBy?.name }),
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

const QUERY_KEY_MAP: Record<SubTab, string> = {
  affidavits: 'affidavits',
  marriages: 'marriages',
  birthDeath: 'birth-death',
  tradeLicenses: 'trade-licenses',
  panCards: 'pan-cards',
  passports: 'passports',
  voterCards: 'voter-cards',
  propertyCards: 'property-cards',
  shopAct: 'shop-act-licenses',
  gazettes: 'gazettes',
  waterSupplies: 'waterSupplies',
  propertyTaxes: 'propertyTaxes',
};

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const { pricing } = usePricing();

  const [topCategory, setTopCategory] = useState<TopCategory>('KMC');
  const [subTab, setSubTab] = useState<SubTab>('affidavits');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Unified State
  const [editingRecord, setEditingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [viewingRecord, setViewingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [printRecord, setPrintRecord] = useState<{ type: SubTab; data: any } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Reset page when subTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [subTab]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useAppPrint({ content: () => receiptRef.current });
  const qc = useQueryClient();

  const params = useMemo(() => ({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }), [debouncedSearch, from, to]);

  // Queries
  const { data: affidavits = [], isLoading: affLoading } = useQuery({ queryKey: ['affidavits', params], queryFn: () => affidavitsApi.getAll(params).then(r => r.data), enabled: subTab === 'affidavits' });
  const { data: marriages = [], isLoading: marLoading } = useQuery({ queryKey: ['marriages', params], queryFn: () => marriagesApi.getAll(params).then(r => r.data), enabled: subTab === 'marriages' });
  const { data: birthDeathCerts = [], isLoading: bdLoading } = useQuery({ queryKey: ['birth-death', params], queryFn: () => birthDeathApi.getAll(params).then(r => r.data), enabled: subTab === 'birthDeath' });
  const { data: propertyCards = [], isLoading: pcLoading } = useQuery({ queryKey: ['property-cards', params], queryFn: () => propertyCardsApi.getAll(params).then(r => r.data), enabled: subTab === 'propertyCards' });
  const { data: shopActLicenses = [], isLoading: salLoading } = useQuery({ queryKey: ['shop-act-licenses', params], queryFn: () => shopActLicensesApi.getAll(params).then(r => r.data), enabled: subTab === 'shopAct' });
  const { data: tradeLicenses = [], isLoading: tlLoading } = useQuery({ queryKey: ['trade-licenses', params], queryFn: () => tradeLicensesApi.getAll(params).then(r => r.data), enabled: subTab === 'tradeLicenses' });
  const { data: panCards = [], isLoading: panLoading } = useQuery({ queryKey: ['pan-cards', params], queryFn: () => panCardsApi.getAll(params).then(r => r.data), enabled: subTab === 'panCards' });
  const { data: passports = [], isLoading: passportLoading } = useQuery({ queryKey: ['passports', params], queryFn: () => passportsApi.getAll(params).then(r => r.data), enabled: subTab === 'passports' });
  const { data: voterCards = [], isLoading: voterLoading } = useQuery({ queryKey: ['voter-cards', params], queryFn: () => voterCardsApi.getAll(params).then(r => r.data), enabled: subTab === 'voterCards' });
  const { data: gazettes = [], isLoading: gazetteLoading } = useQuery({ queryKey: ['gazettes', params], queryFn: () => gazettesApi.getAll(params).then(r => r.data), enabled: subTab === 'gazettes' });
  const { data: waterSupplies = [], isLoading: wsLoading } = useQuery({ queryKey: ['waterSupplies', params], queryFn: () => waterSuppliesApi.getAll(params).then(r => r.data), enabled: subTab === 'waterSupplies' });
  const { data: propertyTaxes = [], isLoading: ptLoading } = useQuery({ queryKey: ['propertyTaxes', params], queryFn: () => propertyTaxesApi.getAll(params).then(r => r.data), enabled: subTab === 'propertyTaxes' });

  // Unified Mutations
  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: SubTab; id: string }) => API_MAP[type].delete(id),
    onSuccess: (_, { type }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY_MAP[type]] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, id, data }: { type: SubTab; id: string; data: any }) => API_MAP[type].update(id, data),
    onSuccess: (_, { type }) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY_MAP[type]] });
      setEditingRecord(null);
    },
  });

  const triggerPrint = (tab: SubTab, row: any) => {
    setPrintRecord({ type: tab, data: row });
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const currentConfig = {
    data: subTab === 'affidavits' ? affidavits :
      subTab === 'marriages' ? marriages :
        subTab === 'birthDeath' ? birthDeathCerts :
          subTab === 'propertyCards' ? propertyCards :
            subTab === 'shopAct' ? shopActLicenses :
              subTab === 'tradeLicenses' ? tradeLicenses :
                subTab === 'panCards' ? panCards :
                  subTab === 'passports' ? passports :
                    subTab === 'voterCards' ? voterCards :
                      subTab === 'gazettes' ? gazettes :
                        subTab === 'waterSupplies' ? waterSupplies :
                          propertyTaxes,
    isLoading: subTab === 'affidavits' ? affLoading :
      subTab === 'marriages' ? marLoading :
        subTab === 'birthDeath' ? bdLoading :
          subTab === 'propertyCards' ? pcLoading :
            subTab === 'shopAct' ? salLoading :
              subTab === 'tradeLicenses' ? tlLoading :
                subTab === 'panCards' ? panLoading :
                  subTab === 'passports' ? passportLoading :
                    subTab === 'voterCards' ? voterLoading :
                      subTab === 'gazettes' ? gazetteLoading :
                        subTab === 'waterSupplies' ? wsLoading :
                          ptLoading,
    onPrint: (r: any) => triggerPrint(subTab, r),
    onEdit: (r: any) => setEditingRecord({ type: subTab, data: r }),
    onDelete: (id: string) => deleteMutation.mutate({ type: subTab, id }),
    columns: COLUMNS_MAP[subTab],
  };

  const KMC_SUB_TABS = [
    { key: 'affidavits' as SubTab, label: 'Affidavits', count: affidavits?.length || 0 },
    { key: 'marriages' as SubTab, label: 'Marriages', count: marriages?.length || 0 },
    { key: 'birthDeath' as SubTab, label: 'Birth/Death', count: birthDeathCerts?.length || 0 },
    { key: 'tradeLicenses' as SubTab, label: 'Trade Licenses', count: tradeLicenses?.length || 0 },
    { key: 'waterSupplies' as SubTab, label: 'Water Supply', count: waterSupplies?.length || 0 },
    { key: 'propertyTaxes' as SubTab, label: 'Property Tax', count: propertyTaxes?.length || 0 },
  ];

  const CSC_SUB_TABS = [
    { key: 'panCards' as SubTab, label: 'PAN Cards', count: panCards?.length || 0 },
    { key: 'passports' as SubTab, label: 'Passports', count: passports?.length || 0 },
  ];

  const AAPLE_SARKAR_SUB_TABS = [
    { key: 'propertyCards' as SubTab, label: 'Property Cards', count: propertyCards?.length || 0 },
    { key: 'shopAct' as SubTab, label: 'Shop Act Licenses', count: shopActLicenses?.length || 0 },
    { key: 'gazettes' as SubTab, label: 'Gazette', count: gazettes?.length || 0 },
    { key: 'voterCards' as SubTab, label: 'Voter Cards', count: voterCards?.length || 0 },
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

  const handleTopCategoryChange = (cat: TopCategory) => {
    setTopCategory(cat);
    if (cat === 'KMC') setSubTab('affidavits');
    else if (cat === 'CSC') setSubTab('panCards');
    else setSubTab('propertyCards');
  };

  const exportCurrent = async () => {
    const config = EXPORT_MAPPERS[subTab];
    if (!config) return;
    const rows = currentConfig.data.map(config.mapRow);
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
    XLSX.writeFile(wb, `${config.fileName}_${today()}.xlsx`);
  };

  const today = () => new Date().toISOString().split('T')[0];

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return currentConfig.data.slice(start, start + PAGE_SIZE);
  }, [currentConfig.data, currentPage]);

  const totalPages = Math.ceil(currentConfig.data.length / PAGE_SIZE);

  const EmptyRow = () => <tr><td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: 14 }}>No records found.</td></tr>;
  const LoadingRow = () => <tr><td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading…</td></tr>;

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

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="filter-inputs-grid">
          <input className="search-input" placeholder="Search name, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <NeoDatePicker className="date-input" value={from} onChange={(val) => setFrom(val)} placeholder="From date" />
          <NeoDatePicker className="date-input" value={to} onChange={(val) => setTo(val)} placeholder="To date" />
        </div>
        <div className="filter-actions-row">
          <button className="btn btn-sm" onClick={() => { setSearch(''); setFrom(''); setTo(''); }}>Clear</button>
          <div className="export-btn-wrapper">
            <button className="btn btn-sm" onClick={exportCurrent}>⬇ Export Excel</button>
          </div>
        </div>
      </div>

      {/* ── Unified Config-driven Table ── */}
      {(() => {
        if (!currentConfig) return null;

        return (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      {currentConfig.columns.map((col, idx) => (
                        <th key={idx} className={col.className} style={col.style}>{col.header}</th>
                      ))}
                      <th>Amount</th>
                      <th>By</th>
                      <th style={{ width: 120 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentConfig.isLoading ? (
                      <LoadingRow />
                    ) : currentConfig.data.length === 0 ? (
                      <EmptyRow />
                    ) : (
                      paginatedData.map((r, i) => (
                        <tr key={r.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{i + 1 + (currentPage - 1) * PAGE_SIZE}</td>
                          <td>{fmtDate(r.dateOfService)}</td>
                          {currentConfig.columns.map((col, idx) => (
                            <td key={idx} className={col.className} style={col.style}>
                              {col.render(r, i)}
                            </td>
                          ))}
                          <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy?.name || '—'}</td>
                          <td>
                            <ActionBtns
                              onPrint={() => currentConfig.onPrint(r)}
                              onEdit={() => currentConfig.onEdit(r)}
                              onDelete={isAdmin && currentConfig.onDelete ? () => {
                                if (confirm('Delete?')) currentConfig.onDelete!(r.id);
                              } : undefined}
                              onView={() => setViewingRecord({ type: subTab, data: r })}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {!currentConfig.isLoading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ minWidth: '80px' }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Page {currentPage} of {totalPages} ({currentConfig.data.length} records)
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ minWidth: '80px' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        );
      })()}

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

// Helper components
function ActionBtns({ onPrint, onEdit, onDelete, onView }: { onPrint: () => void; onEdit: () => void; onDelete?: () => void; onView?: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {onView && <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="View breakdown/details" onClick={onView}>👁 View</button>}
      <button className="btn btn-sm btn-success-soft" title="Print receipt" onClick={onPrint}>🖨</button>
      <button className="btn btn-sm" onClick={onEdit}>Edit</button>
      {onDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Del</button>}
    </div>
  );
}
