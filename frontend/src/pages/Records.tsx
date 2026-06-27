import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import {
  affidavitsApi, marriagesApi, birthDeathApi, propertyCardsApi,
  shopActLicensesApi, tradeLicensesApi, panCardsApi, passportsApi, voterCardsApi, gazettesApi, waterSuppliesApi, propertyTaxesApi
} from '@/api';
import {
  WATER_SERVICE_TYPE_LABELS, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS, SERVICE_TYPE_LABELS,
  PROPERTY_TAX_SERVICE_TYPE_LABELS,
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

  // Unified State
  const [editingRecord, setEditingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [viewingRecord, setViewingRecord] = useState<{ type: SubTab; data: any } | null>(null);
  const [printRecord, setPrintRecord] = useState<{ type: SubTab; data: any } | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ content: () => receiptRef.current });
  const qc = useQueryClient();

  const params = {
    ...(search ? { search } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  // Queries
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

  // Delete Mutations
  const deleteMutations: Record<SubTab, any> = {
    affidavits: useMutation({ mutationFn: (id: string) => affidavitsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['affidavits'] }) }),
    marriages: useMutation({ mutationFn: (id: string) => marriagesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['marriages'] }) }),
    birthDeath: useMutation({ mutationFn: (id: string) => birthDeathApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['birth-death'] }) }),
    propertyCards: useMutation({ mutationFn: (id: string) => propertyCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['property-cards'] }) }),
    shopAct: useMutation({ mutationFn: (id: string) => shopActLicensesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-act-licenses'] }) }),
    tradeLicenses: useMutation({ mutationFn: (id: string) => tradeLicensesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['trade-licenses'] }) }),
    panCards: useMutation({ mutationFn: (id: string) => panCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['pan-cards'] }) }),
    passports: useMutation({ mutationFn: (id: string) => passportsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['passports'] }) }),
    voterCards: useMutation({ mutationFn: (id: string) => voterCardsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['voter-cards'] }) }),
    gazettes: useMutation({ mutationFn: (id: string) => gazettesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['gazettes'] }) }),
    waterSupplies: useMutation({ mutationFn: (id: string) => waterSuppliesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['waterSupplies'] }) }),
    propertyTaxes: useMutation({ mutationFn: (id: string) => propertyTaxesApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['propertyTaxes'] }) }),
  };

  // Update Mutations
  const updateMutations: Record<SubTab, any> = {
    affidavits: useMutation({ mutationFn: ({ id, data }: any) => affidavitsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['affidavits'] }); setEditingRecord(null); } }),
    marriages: useMutation({ mutationFn: ({ id, data }: any) => marriagesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['marriages'] }); setEditingRecord(null); } }),
    birthDeath: useMutation({ mutationFn: ({ id, data }: any) => birthDeathApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['birth-death'] }); setEditingRecord(null); } }),
    propertyCards: useMutation({ mutationFn: ({ id, data }: any) => propertyCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['property-cards'] }); setEditingRecord(null); } }),
    shopAct: useMutation({ mutationFn: ({ id, data }: any) => shopActLicensesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['shop-act-licenses'] }); setEditingRecord(null); } }),
    tradeLicenses: useMutation({ mutationFn: ({ id, data }: any) => tradeLicensesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['trade-licenses'] }); setEditingRecord(null); } }),
    panCards: useMutation({ mutationFn: ({ id, data }: any) => panCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['pan-cards'] }); setEditingRecord(null); } }),
    passports: useMutation({ mutationFn: ({ id, data }: any) => passportsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['passports'] }); setEditingRecord(null); } }),
    voterCards: useMutation({ mutationFn: ({ id, data }: any) => voterCardsApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['voter-cards'] }); setEditingRecord(null); } }),
    gazettes: useMutation({ mutationFn: ({ id, data }: any) => gazettesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gazettes'] }); setEditingRecord(null); } }),
    waterSupplies: useMutation({ mutationFn: ({ id, data }: any) => waterSuppliesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['waterSupplies'] }); setEditingRecord(null); } }),
    propertyTaxes: useMutation({ mutationFn: ({ id, data }: any) => propertyTaxesApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['propertyTaxes'] }); setEditingRecord(null); } }),
  };

  const triggerPrint = (tab: SubTab, row: any) => {
    setPrintRecord({ type: tab, data: row });
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const CONFIGS: Record<SubTab, {
    data: any[];
    isLoading: boolean;
    onPrint: (row: any) => void;
    onEdit: (row: any) => void;
    onDelete: (id: string) => void;
    columns: { header: string; className?: string; style?: React.CSSProperties; render: (row: any, index: number) => React.ReactNode }[];
  }> = {
    affidavits: {
      data: affidavits,
      isLoading: affLoading,
      onPrint: (r) => triggerPrint('affidavits', r),
      onEdit: (r) => setEditingRecord({ type: 'affidavits', data: r }),
      onDelete: (id) => deleteMutations.affidavits.mutate(id),
      columns: [
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Purpose', render: (r) => (
          <div style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div>{r.purpose}</div>
            {r.remark && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }} title={r.remark}>Remark: {r.remark}</div>}
          </div>
        ) },
        { header: 'Paper', render: (r) => <span className="badge badge-blue">{r.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}</span> },
        { header: 'Auth', render: (r) => <span className={`badge ${r.authorizerType === 'magistrate' ? 'badge-green' : 'badge-amber'}`}>{r.authorizerType === 'magistrate' ? 'Magistrate' : 'Notary'}</span> },
      ],
    },
    marriages: {
      data: marriages,
      isLoading: marLoading,
      onPrint: (r) => triggerPrint('marriages', r),
      onEdit: (r) => setEditingRecord({ type: 'marriages', data: r }),
      onDelete: (id) => deleteMutations.marriages.mutate(id),
      columns: [
        { header: 'Contact', render: (r) => r.contactName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Spouses', render: (r) => <span style={{ fontSize: 12 }}>{r.spouse1Name} &amp; {r.spouse2Name}</span> },
        { header: 'Act', render: (r) => <span className="badge badge-blue" style={{ fontSize: 11 }}>{r.marriageAct === 'Hindu Marriage Act' ? 'Hindu' : r.marriageAct === 'Muslim Personal Law (Shariat)' ? 'Muslim' : 'Christian'}</span> },
      ],
    },
    birthDeath: {
      data: birthDeathCerts,
      isLoading: bdLoading,
      onPrint: (r) => triggerPrint('birthDeath', r),
      onEdit: (r) => setEditingRecord({ type: 'birthDeath', data: r }),
      onDelete: (id) => deleteMutations.birthDeath.mutate(id),
      columns: [
        { header: 'Type', render: (r) => <span className={`badge ${r.certificateType === 'Birth' ? 'badge-green' : 'badge-amber'}`}>{r.certificateType}</span> },
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Person', render: (r) => r.personName },
        { header: 'Event Date', render: (r) => r.eventDate },
        { header: 'Copies', render: (r) => r.numberOfCopies, style: { textAlign: 'center' } },
      ],
    },
    propertyCards: {
      data: propertyCards,
      isLoading: pcLoading,
      onPrint: (r) => triggerPrint('propertyCards', r),
      onEdit: (r) => setEditingRecord({ type: 'propertyCards', data: r }),
      onDelete: (id) => deleteMutations.propertyCards.mutate(id),
      columns: [
        { header: 'Type', render: (r) => <span className="badge badge-blue">{r.recordType}</span> },
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Property No.', render: (r) => r.propertyNumber },
      ],
    },
    shopAct: {
      data: shopActLicenses,
      isLoading: salLoading,
      onPrint: (r) => triggerPrint('shopAct', r),
      onEdit: (r) => setEditingRecord({ type: 'shopAct', data: r }),
      onDelete: (id) => deleteMutations.shopAct.mutate(id),
      columns: [
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Business', render: (r) => r.businessName },
        { header: 'Email', render: (r) => r.email || '—', style: { color: 'var(--text-muted)', fontSize: 12 } },
      ],
    },
    tradeLicenses: {
      data: tradeLicenses,
      isLoading: tlLoading,
      onPrint: (r) => triggerPrint('tradeLicenses', r),
      onEdit: (r) => setEditingRecord({ type: 'tradeLicenses', data: r }),
      onDelete: (id) => deleteMutations.tradeLicenses.mutate(id),
      columns: [
        { header: 'Service', render: (r) => <span className="badge badge-blue">{SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
        { header: 'Business Name', render: (r) => r.business?.name || '—', style: { fontWeight: 500 } },
        { header: 'License No', render: (r) => r.business?.licenseNo ? <span className="badge badge-green" style={{ fontSize: 11 }}>{r.business.licenseNo}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
        { header: 'Phone', render: (r) => r.business?.phone || '—' },
        { header: 'Token', render: (r) => r.tokenNo || '—' },
      ],
    },
    waterSupplies: {
      data: waterSupplies,
      isLoading: wsLoading,
      onPrint: (r) => triggerPrint('waterSupplies', r),
      onEdit: (r) => setEditingRecord({ type: 'waterSupplies', data: r }),
      onDelete: (id) => deleteMutations.waterSupplies.mutate(id),
      columns: [
        { header: 'Service Type', render: (r) => <span className="badge badge-green">{WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
        { header: 'Customer Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Connection Address', render: (r) => r.connectionAddress, style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
        { header: 'Token', render: (r) => r.applicationTokenNo },
      ],
    },
    propertyTaxes: {
      data: propertyTaxes,
      isLoading: ptLoading,
      onPrint: (r) => triggerPrint('propertyTaxes', r),
      onEdit: (r) => setEditingRecord({ type: 'propertyTaxes', data: r }),
      onDelete: (id) => deleteMutations.propertyTaxes.mutate(id),
      columns: [
        { header: 'Service Type', render: (r) => <span className="badge badge-green">{PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}</span> },
        { header: 'Customer Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Address', render: (r) => r.address, style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
        { header: 'Property Tax No.', render: (r) => r.propertyTaxNo },
      ],
    },
    panCards: {
      data: panCards,
      isLoading: panLoading,
      onPrint: (r) => triggerPrint('panCards', r),
      onEdit: (r) => setEditingRecord({ type: 'panCards', data: r }),
      onDelete: (id) => deleteMutations.panCards.mutate(id),
      columns: [
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
        { header: 'Ack No.', render: (r) => r.ackNo || '—' },
        { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
        { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
      ],
    },
    passports: {
      data: passports,
      isLoading: passportLoading,
      onPrint: (r) => triggerPrint('passports', r),
      onEdit: (r) => setEditingRecord({ type: 'passports', data: r }),
      onDelete: (id) => deleteMutations.passports.mutate(id),
      columns: [
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
        { header: 'File No.', render: (r) => r.fileNo || '—' },
        { header: 'Appointment Date', render: (r) => r.appointmentDate || '—' },
        { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
        { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
      ],
    },
    voterCards: {
      data: voterCards,
      isLoading: voterLoading,
      onPrint: (r) => triggerPrint('voterCards', r),
      onEdit: (r) => setEditingRecord({ type: 'voterCards', data: r }),
      onDelete: (id) => deleteMutations.voterCards.mutate(id),
      columns: [
        { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Type', render: (r) => <span className="badge badge-blue">{r.applicationType}</span> },
        { header: 'Token / EPIC No.', render: (r) => r.applicationType === 'New' ? `Token: ${r.tokenNo || '—'}` : `EPIC: ${r.epicNo || '—'}` },
        { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
        { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
      ],
    },
    gazettes: {
      data: gazettes,
      isLoading: gazetteLoading,
      onPrint: (r) => triggerPrint('gazettes', r),
      onEdit: (r) => setEditingRecord({ type: 'gazettes', data: r }),
      onDelete: (id) => deleteMutations.gazettes.mutate(id),
      columns: [
        { header: 'Token No', render: (r) => r.tokenNo || '—', style: { fontWeight: 600 } },
        { header: 'Applicant Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
        { header: 'Phone', render: (r) => r.phone },
        { header: 'Old Name', render: (r) => r.oldName },
        { header: 'New Name', render: (r) => r.newName },
        { header: 'Reason to Change', render: (r) => <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reasonToChangeName}>{r.reasonToChangeName}</div> },
        { header: 'Official Fee', render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}` },
        { header: 'Service Fee', render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}` },
      ],
    },
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
        const currentConfig = CONFIGS[subTab];
        if (!currentConfig) return null;

        return (
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
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
                  currentConfig.data.map((r, i) => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td>{r.dateOfService}</td>
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
        );
      })()}

      {/* Dynamic Edit Modal */}
      {editingRecord && (
        <RecordEditModal
          type={editingRecord.type}
          record={editingRecord.data}
          onClose={() => setEditingRecord(null)}
          onSave={(data) => updateMutations[editingRecord.type].mutate({ id: editingRecord.data.id, data })}
          saving={updateMutations[editingRecord.type].isPending}
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
        {printRecord && (
          <div ref={receiptRef}>
            {printRecord.type === 'affidavits' && <AffidavitReceipt record={printRecord.data} />}
            {printRecord.type === 'marriages' && <MarriageReceipt record={printRecord.data} />}
            {printRecord.type === 'birthDeath' && <BirthDeathReceipt record={printRecord.data} />}
            {printRecord.type === 'propertyCards' && <PropertyCardReceipt record={printRecord.data} />}
            {printRecord.type === 'shopAct' && <ShopActLicenseReceipt record={printRecord.data} />}
            {printRecord.type === 'tradeLicenses' && <TradeLicenseReceipt record={printRecord.data} />}
            {printRecord.type === 'panCards' && <PanCardReceipt record={printRecord.data} />}
            {printRecord.type === 'passports' && <PassportReceipt record={printRecord.data} />}
            {printRecord.type === 'voterCards' && <VoterCardReceipt record={printRecord.data} />}
            {printRecord.type === 'gazettes' && <GazetteReceipt record={printRecord.data} />}
            {printRecord.type === 'waterSupplies' && <WaterSupplyReceipt record={printRecord.data} />}
            {printRecord.type === 'propertyTaxes' && <PropertyTaxReceipt record={printRecord.data} />}
          </div>
        )}
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
