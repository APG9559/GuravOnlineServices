import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import {
  affidavitsApi, marriagesApi, birthDeathApi, propertyCardsApi,
  shopActLicensesApi, tradeLicensesApi, panCardsApi, passportsApi, voterCardsApi, gazettesApi, waterSuppliesApi, propertyTaxesApi
} from '@/api';
import {
  Affidavit, Marriage, BirthDeathCertificate, PropertyCard, ShopActLicense, TradeLicenseRecord,
  PanCardRecord, PassportRecord, VoterCardRecord, Gazette, WaterSupply, WATER_SERVICE_TYPE_LABELS, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS, PaperType, AuthorizerType, SERVICE_TYPE_LABELS,
  PropertyTax, PROPERTY_TAX_SERVICE_TYPE_LABELS,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  AffidavitReceipt, MarriageReceipt, BirthDeathReceipt,
  PropertyCardReceipt, ShopActLicenseReceipt, TradeLicenseReceipt, PanCardReceipt, PassportReceipt, VoterCardReceipt, GazetteReceipt, WaterSupplyReceipt, PropertyTaxReceipt,
} from '@/components/ReceiptModal/Receipt';
import { usePricing } from '@/hooks/usePricing';
import NeoSelect from '@/components/NeoSelect';
import NeoDatePicker from '@/components/NeoDatePicker';

type TopCategory = 'KMC' | 'CSC' | 'AapleSarkar';
type SubTab = 'affidavits' | 'marriages' | 'birthDeath' | 'tradeLicenses' | 'panCards' | 'passports' | 'voterCards' | 'propertyCards' | 'shopAct' | 'gazettes' | 'waterSupplies' | 'propertyTaxes';

export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const { pricing } = usePricing();

  const [topCategory, setTopCategory] = useState<TopCategory>('KMC');
  const [subTab, setSubTab] = useState<SubTab>('affidavits');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // edit state
  const [editingAff, setEditingAff] = useState<Affidavit | null>(null);
  const [editingMar, setEditingMar] = useState<Marriage | null>(null);
  const [editingBd, setEditingBd] = useState<BirthDeathCertificate | null>(null);
  const [editingPc, setEditingPc] = useState<PropertyCard | null>(null);
  const [editingSal, setEditingSal] = useState<ShopActLicense | null>(null);
  const [editingTl, setEditingTl] = useState<TradeLicenseRecord | null>(null);
  const [editingPan, setEditingPan] = useState<PanCardRecord | null>(null);
  const [editingPassport, setEditingPassport] = useState<PassportRecord | null>(null);
  const [editingVoter, setEditingVoter] = useState<VoterCardRecord | null>(null);
  const [editingGazette, setEditingGazette] = useState<Gazette | null>(null);
  const [editingWaterSupply, setEditingWaterSupply] = useState<WaterSupply | null>(null);
  const [editingPropertyTax, setEditingPropertyTax] = useState<PropertyTax | null>(null);

  // print state
  const [printAff, setPrintAff] = useState<Affidavit | null>(null);
  const [printMar, setPrintMar] = useState<Marriage | null>(null);
  const [printBd, setPrintBd] = useState<BirthDeathCertificate | null>(null);
  const [printPc, setPrintPc] = useState<PropertyCard | null>(null);
  const [printSal, setPrintSal] = useState<ShopActLicense | null>(null);
  const [printTl, setPrintTl] = useState<TradeLicenseRecord | null>(null);
  const [printPan, setPrintPan] = useState<PanCardRecord | null>(null);
  const [printPassport, setPrintPassport] = useState<PassportRecord | null>(null);
  const [printVoter, setPrintVoter] = useState<VoterCardRecord | null>(null);
  const [printGazette, setPrintGazette] = useState<Gazette | null>(null);
  const [printWaterSupply, setPrintWaterSupply] = useState<WaterSupply | null>(null);
  const [printPropertyTax, setPrintPropertyTax] = useState<PropertyTax | null>(null);

  const affReceiptRef = useRef<HTMLDivElement>(null);
  const marReceiptRef = useRef<HTMLDivElement>(null);
  const bdReceiptRef = useRef<HTMLDivElement>(null);
  const pcReceiptRef = useRef<HTMLDivElement>(null);
  const salReceiptRef = useRef<HTMLDivElement>(null);
  const tlReceiptRef = useRef<HTMLDivElement>(null);
  const panReceiptRef = useRef<HTMLDivElement>(null);
  const passportReceiptRef = useRef<HTMLDivElement>(null);
  const voterReceiptRef = useRef<HTMLDivElement>(null);
  const gazetteReceiptRef = useRef<HTMLDivElement>(null);
  const waterSupplyReceiptRef = useRef<HTMLDivElement>(null);
  const propertyTaxReceiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const params = {
    ...(search ? { search } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { data: affidavits = [], isLoading: affLoading } = useQuery({ queryKey: ['affidavits', params], queryFn: () => affidavitsApi.getAll(params).then(r => r.data) });
  const { data: marriages = [], isLoading: marLoading } = useQuery({ queryKey: ['marriages', params], queryFn: () => marriagesApi.getAll(params).then(r => r.data) });
  const { data: birthDeathCerts = [], isLoading: bdLoading } = useQuery({ queryKey: ['birth-death', params], queryFn: () => birthDeathApi.getAll(params).then(r => r.data) });
  const { data: propertyCards = [], isLoading: pcLoading } = useQuery({ queryKey: ['property-cards', params], queryFn: () => propertyCardsApi.getAll(params).then(r => r.data) });
  const { data: shopActLicenses = [], isLoading: salLoading } = useQuery({ queryKey: ['shop-act-licenses', params], queryFn: () => shopActLicensesApi.getAll(params).then(r => r.data) });
  const { data: tradeLicenses = [], isLoading: tlLoading } = useQuery({ queryKey: ['trade-licenses', params], queryFn: () => tradeLicensesApi.getAll(params).then(r => r.data) });
  const { data: panCards = [], isLoading: panLoading } = useQuery({ queryKey: ['pan-cards', params], queryFn: () => panCardsApi.getAll(params).then(r => r.data) });
  const { data: passports = [], isLoading: passportLoading } = useQuery({ queryKey: ['passports', params], queryFn: () => passportsApi.getAll(params).then(r => r.data) });
  const { data: voterCards = [], isLoading: voterLoading } = useQuery({ queryKey: ['voter-cards', params], queryFn: () => voterCardsApi.getAll(params).then(r => r.data) });
  const { data: gazettes = [], isLoading: gazetteLoading } = useQuery({ queryKey: ['gazettes', params], queryFn: () => gazettesApi.getAll(params).then(r => r.data) });
  const { data: waterSupplies = [], isLoading: wsLoading } = useQuery({ queryKey: ['waterSupplies', params], queryFn: () => waterSuppliesApi.getAll(params).then(r => r.data) });
  const { data: propertyTaxes = [], isLoading: ptLoading } = useQuery({ queryKey: ['propertyTaxes', params], queryFn: () => propertyTaxesApi.getAll(params).then(r => r.data) });

  const deleteAff = useMutation({ mutationFn: (id: string) => affidavitsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['affidavits'] }) });
  const deleteMar = useMutation({ mutationFn: (id: string) => marriagesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['marriages'] }) });
  const deleteBd = useMutation({ mutationFn: (id: string) => birthDeathApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['birth-death'] }) });
  const deletePc = useMutation({ mutationFn: (id: string) => propertyCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['property-cards'] }) });
  const deleteSal = useMutation({ mutationFn: (id: string) => shopActLicensesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-act-licenses'] }) });
  const deleteTl = useMutation({ mutationFn: (id: string) => tradeLicensesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['trade-licenses'] }) });
  const deletePan = useMutation({ mutationFn: (id: string) => panCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['pan-cards'] }) });
  const deletePassport = useMutation({ mutationFn: (id: string) => passportsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['passports'] }) });
  const deleteVoter = useMutation({ mutationFn: (id: string) => voterCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-cards'] }) });
  const deleteGazette = useMutation({ mutationFn: (id: string) => gazettesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['gazettes'] }) });
  const deleteWaterSupply = useMutation({ mutationFn: (id: string) => waterSuppliesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['waterSupplies'] }) });
  const deletePropertyTax = useMutation({ mutationFn: (id: string) => propertyTaxesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['propertyTaxes'] }) });

  const updateAff = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Affidavit> }) => affidavitsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['affidavits'] }); setEditingAff(null); } });
  const updateMar = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Marriage> }) => marriagesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['marriages'] }); setEditingMar(null); } });
  const updateBd = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BirthDeathCertificate> }) => birthDeathApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['birth-death'] }); setEditingBd(null); } });
  const updatePc = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<PropertyCard> }) => propertyCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['property-cards'] }); setEditingPc(null); } });
  const updateSal = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<ShopActLicense> }) => shopActLicensesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['shop-act-licenses'] }); setEditingSal(null); } });
  const updateTl = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<TradeLicenseRecord> }) => tradeLicensesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['trade-licenses'] }); setEditingTl(null); } });
  const updatePan = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<PanCardRecord> }) => panCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['pan-cards'] }); setEditingPan(null); } });
  const updatePassport = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<PassportRecord> }) => passportsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['passports'] }); setEditingPassport(null); } });
  const updateVoter = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<VoterCardRecord> }) => voterCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['voter-cards'] }); setEditingVoter(null); } });
  const updateGazette = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Gazette> }) => gazettesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gazettes'] }); setEditingGazette(null); } });
  const updateWaterSupply = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<WaterSupply> }) => waterSuppliesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['waterSupplies'] }); setEditingWaterSupply(null); } });
  const updatePropertyTax = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<PropertyTax> }) => propertyTaxesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['propertyTaxes'] }); setEditingPropertyTax(null); } });

  const handlePrintAff = useReactToPrint({ content: () => affReceiptRef.current });
  const handlePrintMar = useReactToPrint({ content: () => marReceiptRef.current });
  const handlePrintBd = useReactToPrint({ content: () => bdReceiptRef.current });
  const handlePrintPc = useReactToPrint({ content: () => pcReceiptRef.current });
  const handlePrintWaterSupply = useReactToPrint({ content: () => waterSupplyReceiptRef.current });
  const handlePrintPropertyTax = useReactToPrint({ content: () => propertyTaxReceiptRef.current });
  const handlePrintSal = useReactToPrint({ content: () => salReceiptRef.current });
  const handlePrintTl = useReactToPrint({ content: () => tlReceiptRef.current });
  const handlePrintPan = useReactToPrint({ content: () => panReceiptRef.current });
  const handlePrintPassport = useReactToPrint({ content: () => passportReceiptRef.current });
  const handlePrintVoter = useReactToPrint({ content: () => voterReceiptRef.current });
  const handlePrintGazette = useReactToPrint({ content: () => gazetteReceiptRef.current });

  const exportCurrent = () => {
    if (subTab === 'affidavits') {
      const rows = affidavits.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Purpose: r.purpose, Paper: PAPER_LABELS[r.paperType], Authorizer: AUTH_LABELS[r.authorizerType], 'Auth Name': r.authorizerName || '', Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'Affidavits', `affidavits_${today()}.xlsx`);
    } else if (subTab === 'marriages') {
      const rows = marriages.map(r => ({ Date: r.dateOfService, Contact: r.contactName, Phone: r.phone, Spouse1: r.spouse1Name, Spouse2: r.spouse2Name, Act: r.marriageAct, MarriageDate: r.marriageDate, Services: (r.servicesProvided || []).join(', '), Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'Marriages', `marriages_${today()}.xlsx`);
    } else if (subTab === 'birthDeath') {
      const rows = birthDeathCerts.map(r => ({ Date: r.dateOfService, Type: CERT_TYPE_LABELS[r.certificateType], Name: r.customerName, Phone: r.phone, PersonName: r.personName, EventDate: r.eventDate, Copies: r.numberOfCopies, Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'BirthDeath', `birth_death_${today()}.xlsx`);
    } else if (subTab === 'propertyCards') {
      const rows = propertyCards.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.recordType, PropertyNo: r.propertyNumber, Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'PropertyCards', `property_cards_${today()}.xlsx`);
    } else if (subTab === 'shopAct') {
      const rows = shopActLicenses.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Business: r.businessName, Email: r.email || '', Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'ShopActLicenses', `shop_act_${today()}.xlsx`);
    } else if (subTab === 'panCards') {
      const rows = panCards.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'Ack No': r.ackNo || '', Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'PanCards', `pan_cards_${today()}.xlsx`);
    } else if (subTab === 'passports') {
      const rows = passports.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'File No': r.fileNo || '', 'Appointment Date': r.appointmentDate || '', Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'Passports', `passports_${today()}.xlsx`);
    } else if (subTab === 'voterCards') {
      const rows = voterCards.map(r => ({ Date: r.dateOfService, Name: r.customerName, Phone: r.phone, Type: r.applicationType, 'Token No': r.tokenNo || '', 'EPIC No': r.epicNo || '', 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'VoterCards', `voter_cards_${today()}.xlsx`);
    } else if (subTab === 'gazettes') {
      const rows = gazettes.map(r => ({ Date: r.dateOfService, 'Token No': r.tokenNo || '', Name: r.customerName, Phone: r.phone, 'Old Name': r.oldName, 'New Name': r.newName, Reason: r.reasonToChangeName, 'Official Fee': r.officialFee, 'Service Fee': r.serviceFee, Amount: r.amountCharged, By: r.createdBy.name }));
      writeXlsx(rows, 'Gazettes', `gazettes_${today()}.xlsx`);
    } else if (subTab === 'waterSupplies') {
      const rows = waterSupplies.map(r => ({
        Date: r.dateOfService,
        Name: r.customerName,
        Phone: r.phone,
        Type: WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
        Address: r.connectionAddress,
        Token: r.applicationTokenNo,
        'App Date': r.applicationDate,
        'Plumber Name': r.plumberName || '',
        'Plumber Phone': r.plumberPhone || '',
        'Contact Name': r.contactPersonName || '',
        'Contact Phone': r.contactPersonPhone || '',
        'Connection No': r.connectionNo || '',
        'Current Owner': r.currentOwner || '',
        'New Owner Name': r.newOwnerName || '',
        'New Owner Phone': r.newOwnerPhone || '',
        'Transfer Subtype': r.transferSubtype || '',
        'Current Usage': r.currentUsage || '',
        'New Usage': r.newUsage || '',
        'Official Fee': r.officialFee,
        'Service Fee': r.serviceFee,
        Amount: r.amountCharged,
        By: r.createdBy.name,
      }));
      writeXlsx(rows, 'WaterSupplies', `water_supply_${today()}.xlsx`);
    } else if (subTab === 'propertyTaxes') {
      const rows = propertyTaxes.map(r => ({
        Date: r.dateOfService,
        Name: r.customerName,
        Phone: r.phone,
        Type: PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
        Address: r.address,
        'Property Tax No': r.propertyTaxNo,
        'Official Fee': r.officialFee,
        'Service Fee': r.serviceFee,
        'Protocol Fee': r.protocolFee,
        Amount: r.amountCharged,
        By: r.createdBy.name,
      }));
      writeXlsx(rows, 'PropertyTaxes', `property_tax_${today()}.xlsx`);
    } else {
      const rows = tradeLicenses.map(r => ({
        Date: r.dateOfService,
        Service: SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
        Business: r.business?.name || '—',
        LicenseNo: r.business?.licenseNo || '—',
        Phone: r.business?.phone || '—',
        TokenNo: r.tokenNo || '—',
        OfficialFee: r.officialFee,
        ServiceFee: r.serviceFee,
        Amount: r.amountCharged,
        By: r.createdBy.name,
      }));
      writeXlsx(rows, 'TradeLicenses', `trade_licenses_${today()}.xlsx`);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];
  const writeXlsx = (rows: object[], sheet: string, file: string) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, file);
  };

  const KMC_SUB_TABS = [
    { key: 'affidavits' as SubTab, label: 'Affidavits', count: affidavits.length },
    { key: 'marriages' as SubTab, label: 'Marriages', count: marriages.length },
    { key: 'birthDeath' as SubTab, label: 'Birth/Death', count: birthDeathCerts.length },
    { key: 'tradeLicenses' as SubTab, label: 'Trade Licenses', count: tradeLicenses.length },
    { key: 'waterSupplies' as SubTab, label: 'Water Supply', count: waterSupplies.length },
    { key: 'propertyTaxes' as SubTab, label: 'Property Tax', count: propertyTaxes.length },
  ];

  const CSC_SUB_TABS = [
    { key: 'panCards' as SubTab, label: 'PAN Cards', count: panCards.length },
    { key: 'passports' as SubTab, label: 'Passports', count: passports.length },
  ];

  const AAPLE_SARKAR_SUB_TABS = [
    { key: 'propertyCards' as SubTab, label: 'Property Cards', count: propertyCards.length },
    { key: 'shopAct' as SubTab, label: 'Shop Act Licenses', count: shopActLicenses.length },
    { key: 'gazettes' as SubTab, label: 'Gazette', count: gazettes.length },
    { key: 'voterCards' as SubTab, label: 'Voter Cards', count: voterCards.length },
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

  const EmptyRow = () => <tr><td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: 14 }}>No records found.</td></tr>;
  const LoadingRow = () => <tr><td colSpan={20} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading…</td></tr>;

  return (
    <div>
      <div className="page-header">
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


      {/* ── Affidavits ── */}
      {subTab === 'affidavits' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Purpose</th><th>Paper</th><th>Auth</th><th>Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {affLoading ? <LoadingRow /> : affidavits.length === 0 ? <EmptyRow /> : affidavits.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div>{r.purpose}</div>
                    {r.remark && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }} title={r.remark}>Remark: {r.remark}</div>}
                  </td>
                  <td><span className="badge badge-blue">{r.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}</span></td>
                  <td><span className={`badge ${r.authorizerType === 'magistrate' ? 'badge-green' : 'badge-amber'}`}>{r.authorizerType === 'magistrate' ? 'Magistrate' : 'Notary'}</span></td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintAff(r); setTimeout(handlePrintAff, 100); }} onEdit={() => setEditingAff(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteAff.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Marriages ── */}
      {subTab === 'marriages' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Contact</th><th>Phone</th><th>Spouses</th><th>Act</th><th>Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {marLoading ? <LoadingRow /> : marriages.length === 0 ? <EmptyRow /> : marriages.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.contactName}</td>
                  <td>{r.phone}</td>
                  <td style={{ fontSize: 12 }}>{r.spouse1Name} &amp; {r.spouse2Name}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{r.marriageAct === 'Hindu Marriage Act' ? 'Hindu' : r.marriageAct === 'Muslim Personal Law (Shariat)' ? 'Muslim' : 'Christian'}</span></td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintMar(r); setTimeout(handlePrintMar, 100); }} onEdit={() => setEditingMar(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteMar.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Birth/Death ── */}
      {subTab === 'birthDeath' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Name</th><th>Phone</th><th>Person</th><th>Event Date</th><th>Copies</th><th>Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {bdLoading ? <LoadingRow /> : birthDeathCerts.length === 0 ? <EmptyRow /> : birthDeathCerts.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td><span className={`badge ${r.certificateType === 'Birth' ? 'badge-green' : 'badge-amber'}`}>{r.certificateType}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td>{r.personName}</td>
                  <td>{r.eventDate}</td>
                  <td style={{ textAlign: 'center' }}>{r.numberOfCopies}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintBd(r); setTimeout(handlePrintBd, 100); }} onEdit={() => setEditingBd(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteBd.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Property Cards ── */}
      {subTab === 'propertyCards' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Name</th><th>Phone</th><th>Property No.</th><th>Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {pcLoading ? <LoadingRow /> : propertyCards.length === 0 ? <EmptyRow /> : propertyCards.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td><span className="badge badge-blue">{r.recordType}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td>{r.propertyNumber}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintPc(r); setTimeout(handlePrintPc, 100); }} onEdit={() => setEditingPc(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deletePc.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Shop Act Licenses ── */}
      {subTab === 'shopAct' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Business</th><th>Email</th><th>Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {salLoading ? <LoadingRow /> : shopActLicenses.length === 0 ? <EmptyRow /> : shopActLicenses.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td>{r.businessName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.email || '—'}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintSal(r); setTimeout(handlePrintSal, 100); }} onEdit={() => setEditingSal(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteSal.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Trade Licenses ── */}
      {subTab === 'tradeLicenses' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Service</th>
                <th>Business Name</th>
                <th>License No</th>
                <th>Phone</th>
                <th>Token</th>
                <th>Amount</th>
                <th>By</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {tlLoading ? (
                <LoadingRow />
              ) : tradeLicenses.length === 0 ? (
                <EmptyRow />
              ) : (
                tradeLicenses.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td>
                      <span className="badge badge-blue">
                        {SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.business?.name || '—'}</td>
                    <td>
                      {r.business?.licenseNo ? (
                        <span className="badge badge-green" style={{ fontSize: 11 }}>
                          {r.business.licenseNo}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>{r.business?.phone || '—'}</td>
                    <td>{r.tokenNo || '—'}</td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <ActionBtns
                        onPrint={() => {
                          setPrintTl(r);
                          setTimeout(handlePrintTl, 100);
                        }}
                        onEdit={() => setEditingTl(r)}
                        onDelete={
                          isAdmin
                            ? () => {
                              if (confirm('Delete?')) deleteTl.mutate(r.id);
                            }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Water Supplies ── */}
      {subTab === 'waterSupplies' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Service Type</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Connection Address</th>
                <th>Token</th>
                <th>Amount</th>
                <th>By</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {wsLoading ? (
                <LoadingRow />
              ) : waterSupplies.length === 0 ? (
                <EmptyRow />
              ) : (
                waterSupplies.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td>
                      <span className="badge badge-green">
                        {WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                    <td>{r.phone}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.connectionAddress}</td>
                    <td>{r.applicationTokenNo}</td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <ActionBtns
                        onPrint={() => {
                          setPrintWaterSupply(r);
                          setTimeout(handlePrintWaterSupply, 100);
                        }}
                        onEdit={() => setEditingWaterSupply(r)}
                        onDelete={
                          isAdmin
                            ? () => {
                              if (confirm('Delete?')) deleteWaterSupply.mutate(r.id);
                            }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Property Taxes ── */}
      {subTab === 'propertyTaxes' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Service Type</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Property Tax No.</th>
                <th>Amount</th>
                <th>By</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {ptLoading ? (
                <LoadingRow />
              ) : propertyTaxes.length === 0 ? (
                <EmptyRow />
              ) : (
                propertyTaxes.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>{r.dateOfService}</td>
                    <td>
                      <span className="badge badge-green">
                        {PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                    <td>{r.phone}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.address}>{r.address}</td>
                    <td>{r.propertyTaxNo}</td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                    <td>
                      <ActionBtns
                        onPrint={() => {
                          setPrintPropertyTax(r);
                          setTimeout(handlePrintPropertyTax, 100);
                        }}
                        onEdit={() => setEditingPropertyTax(r)}
                        onDelete={
                          isAdmin
                            ? () => {
                              if (confirm('Delete?')) deletePropertyTax.mutate(r.id);
                            }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PAN Cards ── */}
      {subTab === 'panCards' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Type</th><th>Ack No.</th><th>Official Fee</th><th>Service Fee</th><th>Total Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {panLoading ? <LoadingRow /> : panCards.length === 0 ? <EmptyRow /> : panCards.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td><span className="badge badge-blue">{r.applicationType}</span></td>
                  <td>{r.ackNo || '—'}</td>
                  <td>₹{Number(r.officialFee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(r.serviceFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintPan(r); setTimeout(handlePrintPan, 100); }} onEdit={() => setEditingPan(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deletePan.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Passports ── */}
      {subTab === 'passports' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Type</th><th>File No.</th><th>Appointment Date</th><th>Official Fee</th><th>Service Fee</th><th>Total Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {passportLoading ? <LoadingRow /> : passports.length === 0 ? <EmptyRow /> : passports.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td><span className="badge badge-blue">{r.applicationType}</span></td>
                  <td>{r.fileNo || '—'}</td>
                  <td>{r.appointmentDate || '—'}</td>
                  <td>₹{Number(r.officialFee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(r.serviceFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintPassport(r); setTimeout(handlePrintPassport, 100); }} onEdit={() => setEditingPassport(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deletePassport.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Voter Cards ── */}
      {subTab === 'voterCards' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Type</th><th>Token / EPIC No.</th><th>Official Fee</th><th>Service Fee</th><th>Total Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {voterLoading ? <LoadingRow /> : voterCards.length === 0 ? <EmptyRow /> : voterCards.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td><span className="badge badge-blue">{r.applicationType}</span></td>
                  <td>{r.applicationType === 'New' ? `Token: ${r.tokenNo || '—'}` : `EPIC: ${r.epicNo || '—'}`}</td>
                  <td>₹{Number(r.officialFee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(r.serviceFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintVoter(r); setTimeout(handlePrintVoter, 100); }} onEdit={() => setEditingVoter(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteVoter.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Gazettes ── */}
      {subTab === 'gazettes' && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Token No</th><th>Applicant Name</th><th>Phone</th><th>Old Name</th><th>New Name</th><th>Reason to Change</th><th>Official Fee</th><th>Service Fee</th><th>Total Amount</th><th>By</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {gazetteLoading ? <LoadingRow /> : gazettes.length === 0 ? <EmptyRow /> : gazettes.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td>{r.dateOfService}</td>
                  <td style={{ fontWeight: 600 }}>{r.tokenNo || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td>{r.phone}</td>
                  <td>{r.oldName}</td>
                  <td>{r.newName}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reasonToChangeName}>{r.reasonToChangeName}</td>
                  <td>₹{Number(r.officialFee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{Number(r.serviceFee || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.createdBy.name}</td>
                  <td><ActionBtns onPrint={() => { setPrintGazette(r); setTimeout(handlePrintGazette, 100); }} onEdit={() => setEditingGazette(r)} onDelete={isAdmin ? () => { if (confirm('Delete?')) deleteGazette.mutate(r.id); } : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modals */}
      {editingAff && <SimpleEditModal title="Edit affidavit" fields={[['customerName', 'Customer name'], ['phone', 'Phone'], ['purpose', 'Purpose'], ['authorizerName', 'Authorizer name'], ['dateOfService', 'Date of service', 'date'], ['amountCharged', 'Amount (₹)', 'number'], ['remark', 'Remark (Reason for discount)']]} record={editingAff} onClose={() => setEditingAff(null)} onSave={(d) => updateAff.mutate({ id: editingAff.id, data: d })} saving={updateAff.isPending} />}
      {editingBd && <SimpleEditModal title="Edit birth/death record" fields={[['customerName', 'Customer name'], ['phone', 'Phone'], ['personName', 'Person name'], ['eventDate', 'Event date', 'date'], ['dateOfService', 'Date of service', 'date'], ['numberOfCopies', 'No. of copies', 'number'], ['amountCharged', 'Amount (₹)', 'number']]} record={editingBd} onClose={() => setEditingBd(null)} onSave={(d) => updateBd.mutate({ id: editingBd.id, data: d })} saving={updateBd.isPending} />}
      {editingPc && <PropertyCardEditModal record={editingPc} onClose={() => setEditingPc(null)} onSave={(d) => updatePc.mutate({ id: editingPc.id, data: d })} saving={updatePc.isPending} />}
      {editingSal && <SimpleEditModal title="Edit shop act license" fields={[['customerName', 'Customer name'], ['phone', 'Phone'], ['businessName', 'Business name'], ['email', 'Email'], ['dateOfService', 'Date of service', 'date'], ['amountCharged', 'Amount (₹)', 'number']]} record={editingSal} onClose={() => setEditingSal(null)} onSave={(d) => updateSal.mutate({ id: editingSal.id, data: d })} saving={updateSal.isPending} />}
      {editingMar && <SimpleEditModal title="Edit marriage record" fields={[['contactName', 'Contact name'], ['phone', 'Phone'], ['spouse1Name', 'Husband'], ['spouse2Name', 'Wife'], ['marriageDate', 'Marriage date', 'date'], ['dateOfService', 'Date of service', 'date'], ['amountCharged', 'Amount (₹)', 'number']]} record={editingMar} onClose={() => setEditingMar(null)} onSave={(d) => updateMar.mutate({ id: editingMar.id, data: d })} saving={updateMar.isPending} />}
      {editingTl && <SimpleEditModal title="Edit trade license service record" fields={[['tokenNo', 'Token number'], ['dateOfService', 'Date of service', 'date'], ['officialFee', 'Official fee (₹)', 'number'], ['serviceFee', 'Service fee (₹)', 'number'], ['protocolFee', 'Protocol fee (₹)', 'number'], ['miscFee', 'Misc fee (₹)', 'number'], ['amountCharged', 'Total charged (₹)', 'number']]} record={editingTl} onClose={() => setEditingTl(null)} onSave={(d) => updateTl.mutate({ id: editingTl.id, data: d })} saving={updateTl.isPending} />}
      {editingPan && <PanCardEditModal record={editingPan} onClose={() => setEditingPan(null)} onSave={(d) => updatePan.mutate({ id: editingPan.id, data: d })} saving={updatePan.isPending} />}
      {editingPassport && <PassportEditModal record={editingPassport} onClose={() => setEditingPassport(null)} onSave={(d) => updatePassport.mutate({ id: editingPassport.id, data: d })} saving={updatePassport.isPending} />}
      {editingVoter && <VoterCardEditModal record={editingVoter} onClose={() => setEditingVoter(null)} onSave={(d) => updateVoter.mutate({ id: editingVoter.id, data: d })} saving={updateVoter.isPending} />}
      {editingGazette && <GazetteEditModal record={editingGazette} onClose={() => setEditingGazette(null)} onSave={(d) => updateGazette.mutate({ id: editingGazette.id, data: d })} saving={updateGazette.isPending} />}
      {editingWaterSupply && <WaterSupplyEditModal record={editingWaterSupply} onClose={() => setEditingWaterSupply(null)} onSave={(d) => updateWaterSupply.mutate({ id: editingWaterSupply.id, data: d })} saving={updateWaterSupply.isPending} />}
      {editingPropertyTax && <PropertyTaxEditModal record={editingPropertyTax} onClose={() => setEditingPropertyTax(null)} onSave={(d) => updatePropertyTax.mutate({ id: editingPropertyTax.id, data: d })} saving={updatePropertyTax.isPending} />}


      {/* Hidden print targets */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {printAff && <AffidavitReceipt ref={affReceiptRef} record={printAff} />}
        {printMar && <MarriageReceipt ref={marReceiptRef} record={printMar} />}
        {printBd && <BirthDeathReceipt ref={bdReceiptRef} record={printBd} />}
        {printPc && <PropertyCardReceipt ref={pcReceiptRef} record={printPc} />}
        {printSal && <ShopActLicenseReceipt ref={salReceiptRef} record={printSal} />}
        {printTl && <TradeLicenseReceipt ref={tlReceiptRef} record={printTl} />}
        {printPan && <PanCardReceipt ref={panReceiptRef} record={printPan} />}
        {printPassport && <PassportReceipt ref={passportReceiptRef} record={printPassport} />}
        {printVoter && <VoterCardReceipt ref={voterReceiptRef} record={printVoter} />}
        {printGazette && <GazetteReceipt ref={gazetteReceiptRef} record={printGazette} />}
        {printWaterSupply && <WaterSupplyReceipt ref={waterSupplyReceiptRef} record={printWaterSupply} />}
        {printPropertyTax && <PropertyTaxReceipt ref={propertyTaxReceiptRef} record={printPropertyTax} />}
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function ActionBtns({ onPrint, onEdit, onDelete }: { onPrint: () => void; onEdit: () => void; onDelete?: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button className="btn btn-sm" title="Print receipt" onClick={onPrint}>🖨</button>
      <button className="btn btn-sm" onClick={onEdit}>Edit</button>
      {onDelete && <button className="btn btn-sm btn-danger" onClick={onDelete}>Del</button>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card modal-card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem', paddingRight: '2.5rem' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// Generic field-based edit modal for simple modules
function SimpleEditModal({ title, fields, record, onClose, onSave, saving }: {
  title: string;
  fields: [string, string, string?][];
  record: Record<string, any>;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>({ ...record });
  return (
    <Modal title={title} onClose={onClose}>
      {fields.map(([key, label, type]) => (
        <div className="form-group" key={key}>
          <label>{label}</label>
          <input
            type={type || 'text'}
            value={form[key] ?? ''}
            onChange={(e) => setForm({ ...form, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value })}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// Property card edit needs the type dropdown
function PropertyCardEditModal({ record, onClose, onSave, saving }: {
  record: PropertyCard; onClose: () => void; onSave: (d: Partial<PropertyCard>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });
  return (
    <Modal title="Edit property card" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Record type</label>
        <NeoSelect
          value={form.recordType}
          onChange={(val) => setForm({ ...form, recordType: val as any })}
          options={[
            { value: 'Property Card', label: 'Property Card' },
            { value: '7/12 Card', label: '7/12 Card' },
            { value: '8A', label: '8A' }
          ]}
        />
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Property number</label><input value={form.propertyNumber} onChange={(e) => setForm({ ...form, propertyNumber: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amountCharged} onChange={(e) => setForm({ ...form, amountCharged: parseFloat(e.target.value) })} /></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PassportEditModal({ record, onClose, onSave, saving }: {
  record: PassportRecord; onClose: () => void; onSave: (d: Partial<PassportRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Passport Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-3">
        <div className="form-group"><label>File No.</label><input value={form.fileNo || ''} onChange={(e) => setForm({ ...form, fileNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Appointment date</label>
          <NeoDatePicker
            value={form.appointmentDate || ''}
            onChange={(val) => setForm({ ...form, appointmentDate: val })}
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PanCardEditModal({ record, onClose, onSave, saving }: {
  record: PanCardRecord; onClose: () => void; onSave: (d: Partial<PanCardRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit PAN Card Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Acknowledgement No.</label><input value={form.ackNo || ''} onChange={(e) => setForm({ ...form, ackNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function VoterCardEditModal({ record, onClose, onSave, saving }: {
  record: VoterCardRecord; onClose: () => void; onSave: (d: Partial<VoterCardRecord>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  const handleSave = () => {
    const payload = { ...form };
    if (payload.applicationType === 'New') {
      payload.epicNo = null as any;
    } else {
      payload.tokenNo = null as any;
    }
    onSave(payload);
  };

  return (
    <Modal title="Edit Voter Card Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Application Type</label>
        <NeoSelect
          value={form.applicationType}
          onChange={(val) => setForm({ ...form, applicationType: val as any })}
          options={[
            { value: 'New', label: 'New Voter Card' },
            { value: 'Correction', label: 'Voter Card Correction' },
            { value: 'Name Deletion', label: 'Name Deletion' },
            { value: 'Address Change', label: 'Address Change' }
          ]}
        />
      </div>
      <div className="grid-2">
        {form.applicationType === 'New' ? (
          <div className="form-group"><label>Token No. *</label><input value={form.tokenNo || ''} onChange={(e) => setForm({ ...form, tokenNo: e.target.value })} /></div>
        ) : (
          <div className="form-group"><label>EPIC No. *</label><input value={form.epicNo || ''} onChange={(e) => setForm({ ...form, epicNo: e.target.value })} /></div>
        )}
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function GazetteEditModal({ record, onClose, onSave, saving }: {
  record: Gazette; onClose: () => void; onSave: (d: Partial<Gazette>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Gazette Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Applicant name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Old name</label><input value={form.oldName} onChange={(e) => setForm({ ...form, oldName: e.target.value })} /></div>
        <div className="form-group"><label>New name</label><input value={form.newName} onChange={(e) => setForm({ ...form, newName: e.target.value })} /></div>
      </div>
      <div className="form-group">
        <label>Reason to Change Name</label>
        <textarea
          value={form.reasonToChangeName}
          onChange={(e) => setForm({ ...form, reasonToChangeName: e.target.value })}
          rows={2}
          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
        />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Token No.</label>
          <input
            value={form.tokenNo || ''}
            onChange={(e) => setForm({ ...form, tokenNo: e.target.value })}
            placeholder="e.g. TOK123456"
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function WaterSupplyEditModal({ record, onClose, onSave, saving }: {
  record: WaterSupply; onClose: () => void; onSave: (d: Partial<WaterSupply>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0)
    }));
  }, [form.officialFee, form.serviceFee]);

  return (
    <Modal title="Edit Water Supply Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Customer name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group"><label>Connection Address</label><input value={form.connectionAddress} onChange={(e) => setForm({ ...form, connectionAddress: e.target.value })} /></div>
        <div className="form-group"><label>Token Number</label><input value={form.applicationTokenNo} onChange={(e) => setForm({ ...form, applicationTokenNo: e.target.value })} /></div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Application Date</label>
          <NeoDatePicker
            value={form.applicationDate}
            onChange={(val) => setForm({ ...form, applicationDate: val })}
          />
        </div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>

      {form.serviceType === 'NewConnection' && (
        <>
          <div className="grid-2">
            <div className="form-group"><label>Plumber Name</label><input value={form.plumberName || ''} onChange={(e) => setForm({ ...form, plumberName: e.target.value })} /></div>
            <div className="form-group"><label>Plumber Phone</label><input value={form.plumberPhone || ''} onChange={(e) => setForm({ ...form, plumberPhone: e.target.value })} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>Contact Person Name</label><input value={form.contactPersonName || ''} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} /></div>
            <div className="form-group"><label>Contact Person Phone</label><input value={form.contactPersonPhone || ''} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} /></div>
          </div>
        </>
      )}

      {form.serviceType === 'ConnectionTransfer' && (
        <>
          <div className="grid-2">
            <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
            <div className="form-group"><label>Current Owner</label><input value={form.currentOwner || ''} onChange={(e) => setForm({ ...form, currentOwner: e.target.value })} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>New Owner Name</label><input value={form.newOwnerName || ''} onChange={(e) => setForm({ ...form, newOwnerName: e.target.value })} /></div>
            <div className="form-group"><label>New Owner Phone</label><input value={form.newOwnerPhone || ''} onChange={(e) => setForm({ ...form, newOwnerPhone: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label>Transfer Subtype</label>
            <NeoSelect
              value={form.transferSubtype || ''}
              onChange={(val) => setForm({ ...form, transferSubtype: val as any })}
              options={[
                { value: 'Purchase', label: 'Purchase' },
                { value: 'Inheritance', label: 'Inheritance' },
                { value: 'GiftDeed', label: 'Gift Deed' },
                { value: 'SubDivision', label: 'Property sub-division' }
              ]}
            />
          </div>
        </>
      )}

      {form.serviceType === 'ChangeOfUse' && (
        <>
          <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
          <div className="grid-2">
            <div className="form-group"><label>Current Usage</label><input value={form.currentUsage || ''} onChange={(e) => setForm({ ...form, currentUsage: e.target.value })} /></div>
            <div className="form-group"><label>New Usage</label><input value={form.newUsage || ''} onChange={(e) => setForm({ ...form, newUsage: e.target.value })} /></div>
          </div>
        </>
      )}

      {['WaterMeterDisconnection', 'WaterMeterReconnection', 'WaterMeterNoDuesCertificate', 'WaterMeterInspection'].includes(form.serviceType) && (
        <div className="form-group"><label>Connection Number</label><input value={form.connectionNo || ''} onChange={(e) => setForm({ ...form, connectionNo: e.target.value })} /></div>
      )}

      <div className="grid-2">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

function PropertyTaxEditModal({ record, onClose, onSave, saving }: {
  record: PropertyTax; onClose: () => void; onSave: (d: Partial<PropertyTax>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...record });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      amountCharged: Number(prev.officialFee || 0) + Number(prev.serviceFee || 0) + Number(prev.protocolFee || 0)
    }));
  }, [form.officialFee, form.serviceFee, form.protocolFee]);

  return (
    <Modal title="Edit Property Tax Record" onClose={onClose}>
      <div className="grid-2">
        <div className="form-group"><label>Applicant name</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="form-group"><label>Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div className="grid-2">
        <div className="form-group"><label>Property Tax No.</label><input value={form.propertyTaxNo} onChange={(e) => setForm({ ...form, propertyTaxNo: e.target.value })} /></div>
        <div className="form-group">
          <label>Date of service</label>
          <NeoDatePicker
            value={form.dateOfService}
            onChange={(val) => setForm({ ...form, dateOfService: val })}
          />
        </div>
      </div>

      <div className="grid-3">
        <div className="form-group"><label>Official Fee (₹)</label><input type="number" value={form.officialFee || 0} onChange={(e) => setForm({ ...form, officialFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Service Fee (₹)</label><input type="number" value={form.serviceFee || 0} onChange={(e) => setForm({ ...form, serviceFee: parseFloat(e.target.value) || 0 })} /></div>
        <div className="form-group"><label>Protocol Fee (₹)</label><input type="number" value={form.protocolFee || 0} onChange={(e) => setForm({ ...form, protocolFee: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <div className="form-group">
        <label>Total Amount Charged (₹)</label>
        <input
          type="number"
          readOnly
          value={form.amountCharged}
          style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
