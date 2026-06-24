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

  // viewing state
  const [viewingRecord, setViewingRecord] = useState<{ type: SubTab; data: any } | null>(null);

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
      onPrint: (r) => { setPrintAff(r); setTimeout(handlePrintAff, 100); },
      onEdit: setEditingAff,
      onDelete: (id) => deleteAff.mutate(id),
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
      onPrint: (r) => { setPrintMar(r); setTimeout(handlePrintMar, 100); },
      onEdit: setEditingMar,
      onDelete: (id) => deleteMar.mutate(id),
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
      onPrint: (r) => { setPrintBd(r); setTimeout(handlePrintBd, 100); },
      onEdit: setEditingBd,
      onDelete: (id) => deleteBd.mutate(id),
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
      onPrint: (r) => { setPrintPc(r); setTimeout(handlePrintPc, 100); },
      onEdit: setEditingPc,
      onDelete: (id) => deletePc.mutate(id),
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
      onPrint: (r) => { setPrintSal(r); setTimeout(handlePrintSal, 100); },
      onEdit: setEditingSal,
      onDelete: (id) => deleteSal.mutate(id),
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
      onPrint: (r) => { setPrintTl(r); setTimeout(handlePrintTl, 100); },
      onEdit: setEditingTl,
      onDelete: (id) => deleteTl.mutate(id),
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
      onPrint: (r) => { setPrintWaterSupply(r); setTimeout(handlePrintWaterSupply, 100); },
      onEdit: setEditingWaterSupply,
      onDelete: (id) => deleteWaterSupply.mutate(id),
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
      onPrint: (r) => { setPrintPropertyTax(r); setTimeout(handlePrintPropertyTax, 100); },
      onEdit: setEditingPropertyTax,
      onDelete: (id) => deletePropertyTax.mutate(id),
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
      onPrint: (r) => { setPrintPan(r); setTimeout(handlePrintPan, 100); },
      onEdit: setEditingPan,
      onDelete: (id) => deletePan.mutate(id),
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
      onPrint: (r) => { setPrintPassport(r); setTimeout(handlePrintPassport, 100); },
      onEdit: setEditingPassport,
      onDelete: (id) => deletePassport.mutate(id),
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
      onPrint: (r) => { setPrintVoter(r); setTimeout(handlePrintVoter, 100); },
      onEdit: setEditingVoter,
      onDelete: (id) => deleteVoter.mutate(id),
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
      onPrint: (r) => { setPrintGazette(r); setTimeout(handlePrintGazette, 100); },
      onEdit: setEditingGazette,
      onDelete: (id) => deleteGazette.mutate(id),
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
function ActionBtns({ onPrint, onEdit, onDelete, onView }: { onPrint: () => void; onEdit: () => void; onDelete?: () => void; onView?: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {onView && <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title="View breakdown/details" onClick={onView}>👁 View</button>}
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

function ViewRecordModal({
  type,
  record,
  pricing,
  onClose,
}: {
  type: SubTab;
  record: any;
  pricing: Record<string, number>;
  onClose: () => void;
}) {
  const getBreakdown = () => {
    const items: { label: string; amount: number; remark?: string }[] = [];

    if (type === 'affidavits') {
      const stampCost = pricing['stamp500_cost'] ?? 500;
      const plainCost = pricing['plain_cost'] ?? 0;
      const paperCost = record.customerBroughtStamp ? 0 : (record.paperType === 'stamp500' ? stampCost : plainCost);
      const authCost = record.authorizerType === 'magistrate' ? 30 : Number(record.notaryPublicFee ?? 0);

      if (!record.customerBroughtStamp) {
        items.push({ label: `${record.paperType === 'stamp500' ? '₹500 Stamp Paper' : 'Plain Paper'}`, amount: paperCost });
      } else {
        items.push({ label: 'Stamp Paper (Customer Brought)', amount: 0 });
      }
      items.push({ label: `${record.authorizerType === 'magistrate' ? 'Executive Magistrate Fee' : 'Notary Public Fee'}`, amount: authCost });

      const subtotal = paperCost + authCost;
      const serviceCharge = Number(record.amountCharged) - subtotal;
      if (serviceCharge > 0) {
        items.push({ label: 'Service / Consultancy Fee', amount: serviceCharge });
      }
    } else if (type === 'marriages') {
      // Services provided cost
      (record.servicesProvided || []).forEach((svc: string) => {
        let cost = 0;
        if (svc === 'Online form filling') cost = pricing.online_form ?? 300;
        else if (svc === 'Offline form filling') cost = pricing.offline_form ?? 300;
        else if (svc === 'Document true copy') cost = pricing.true_copy ?? 100;
        else if (svc === 'Misc (Form, Xerox Copies)') cost = pricing.marriage_misc_fee ?? 0;
        else if (svc === 'Marriage Consultancy Fee') cost = pricing.marriage_consultancy_fee ?? 500;

        items.push({ label: svc, amount: cost });
      });

      if (Number(record.officialFee || 0) > 0) {
        items.push({ label: 'Official Registration Fee', amount: Number(record.officialFee) });
      }
      if (Number(record.courtFeeTickets || 0) > 0) {
        items.push({ label: 'Court Fee Tickets', amount: Number(record.courtFeeTickets) });
      }

      // Linked affidavits
      (record.affidavits || []).forEach((aff: any) => {
        items.push({ label: `Linked Affidavit: ${aff.purpose}`, amount: Number(aff.amountCharged) });
      });
    } else if (type === 'birthDeath') {
      const firstCopyCost = pricing.birth_death_first_copy ?? 300;
      const extraCopiesCost = pricing.birth_death_extra_copy ?? 50;
      const copies = Number(record.numberOfCopies || 1);

      items.push({ label: `First Certificate Copy`, amount: firstCopyCost });
      if (copies > 1) {
        items.push({ label: `Extra Copies (${copies - 1} × ₹${extraCopiesCost})`, amount: (copies - 1) * extraCopiesCost });
      }

      const calculatedTotal = firstCopyCost + (copies > 1 ? (copies - 1) * extraCopiesCost : 0);
      const diff = Number(record.amountCharged) - calculatedTotal;
      if (diff > 0) {
        items.push({ label: 'Additional Charges / Service Fee', amount: diff });
      }
    } else if (type === 'propertyCards') {
      items.push({ label: `Property Card Service Fee (${record.recordType})`, amount: Number(record.amountCharged) });
    } else if (type === 'shopAct') {
      items.push({ label: 'Shop Act License Service Fee', amount: Number(record.amountCharged) });
    } else if (type === 'tradeLicenses') {
      let svcLabel = record.serviceType;
      if (svcLabel === 'New') svcLabel = 'New Trade License';
      else if (svcLabel === 'Renew') svcLabel = 'Renew Trade License';
      else if (svcLabel === 'Transfer_Heir') svcLabel = 'Transfer to Heir';
      else if (svcLabel === 'Transfer_Third_Party') svcLabel = 'Transfer to Third Party';
      else if (svcLabel === 'Name_Change') svcLabel = 'Business Name Change';
      else if (svcLabel === 'Trade_Change') svcLabel = 'Trade Activity Change';
      else if (svcLabel === 'Partner_Change') svcLabel = 'Partner Amendment';
      else if (svcLabel === 'Cancel') svcLabel = 'Cancel Trade License';

      items.push({ label: `${svcLabel} Service Fee`, amount: Number(record.serviceFee || 0) });

      if (Number(record.officialFee || 0) > 0) {
        items.push({ label: 'Official Government Fee', amount: Number(record.officialFee) });
      }
      if (Number(record.protocolFee || 0) > 0) {
        items.push({ label: 'Protocol Fee', amount: Number(record.protocolFee) });
      }
      if (Number(record.miscFee || 0) > 0) {
        items.push({ label: 'Miscellaneous Fee', amount: Number(record.miscFee) });
      }

      if (record.linkedAffidavit) {
        items.push({ label: `Linked Affidavit: ${record.linkedAffidavit.purpose}`, amount: Number(record.linkedAffidavit.amountCharged) });
      }
      if (record.linkedPropertyCard) {
        items.push({ label: `Linked Property Card: ${record.linkedPropertyCard.recordType}`, amount: Number(record.linkedPropertyCard.amountCharged) });
      }
      if (record.linkedShopAct) {
        items.push({ label: `Linked Shop Act: ${record.linkedShopAct.businessName}`, amount: Number(record.linkedShopAct.amountCharged) });
      }
    } else {
      // CSC & Aaple Sarkar remaining simple services (PAN, Passport, Voter, Gazette, Water Supply, Property Tax)
      if (Number(record.officialFee || 0) > 0) {
        items.push({ label: 'Official Fee', amount: Number(record.officialFee) });
      }
      if (Number(record.serviceFee || 0) > 0) {
        items.push({ label: 'Service Fee', amount: Number(record.serviceFee) });
      }
      if (Number(record.protocolFee || 0) > 0) {
        items.push({ label: 'Protocol Fee', amount: Number(record.protocolFee) });
      }
      if (Number(record.miscFee || 0) > 0) {
        items.push({ label: 'Miscellaneous Fee', amount: Number(record.miscFee) });
      }

      // If the sum doesn't match total, show the difference as base service fee
      const subtotal = Number(record.officialFee || 0) + Number(record.serviceFee || 0) + Number(record.protocolFee || 0) + Number(record.miscFee || 0);
      const diff = Number(record.amountCharged) - subtotal;
      if (diff > 0 && items.length === 0) {
        items.push({ label: 'Service Fee', amount: Number(record.amountCharged) });
      } else if (diff > 0) {
        items.push({ label: 'Additional Charges', amount: diff });
      }
    }

    return items;
  };

  const getDetails = () => {
    const details: { label: string; value: string | React.ReactNode }[] = [];

    // Common customer details
    const customerName = record.customerName || record.contactName || record.applicantName || '—';
    details.push({ label: 'Customer Name', value: customerName });
    details.push({ label: 'Phone Number', value: record.phone || '—' });

    if (record.email || record.contactEmail) {
      details.push({ label: 'Email', value: record.email || record.contactEmail });
    }
    if (record.address) {
      details.push({ label: 'Address', value: record.address });
    }

    // Module specific fields
    if (type === 'affidavits') {
      details.push({ label: 'Purpose', value: record.purpose });
      details.push({ label: 'Paper Type', value: PAPER_LABELS[record.paperType as PaperType] || record.paperType });
      details.push({ label: 'Authorizer', value: AUTH_LABELS[record.authorizerType as AuthorizerType] || record.authorizerType });
      if (record.authorizerName) details.push({ label: 'Authorizer Name', value: record.authorizerName });
      if (record.remark) details.push({ label: 'Remark', value: record.remark });
    } else if (type === 'marriages') {
      details.push({ label: 'Husband Name', value: record.spouse1Name });
      details.push({ label: 'Wife Name', value: record.spouse2Name });
      details.push({ label: 'Marriage Act', value: record.marriageAct });
      details.push({ label: 'Marriage Date', value: record.marriageDate });
      if (record.appointmentDate) details.push({ label: 'Appointment Date', value: record.appointmentDate });
      if (record.marriagePlace) details.push({ label: 'Place of Marriage', value: record.marriagePlace });
    } else if (type === 'birthDeath') {
      details.push({ label: 'Certificate Type', value: record.certificateType });
      details.push({ label: 'Person Name', value: record.personName });
      details.push({ label: 'Event Date', value: record.eventDate });
      details.push({ label: 'Number of Copies', value: String(record.numberOfCopies) });
    } else if (type === 'propertyCards') {
      details.push({ label: 'Record Type', value: record.recordType });
      details.push({ label: 'Property Number', value: record.propertyNumber });
    } else if (type === 'shopAct') {
      details.push({ label: 'Business Name', value: record.businessName });
    } else if (type === 'tradeLicenses') {
      details.push({ label: 'Business Name', value: record.business?.name || '—' });
      details.push({ label: 'License Number', value: record.business?.licenseNo || '—' });
      details.push({ label: 'Trade Activity', value: `${record.business?.tradeType || '—'} / ${record.business?.tradeSubtype || '—'}` });
      details.push({ label: 'Token Number', value: record.tokenNo || '—' });
    } else if (type === 'panCards') {
      details.push({ label: 'Application Type', value: record.applicationType });
      details.push({ label: 'Acknowledgement No.', value: record.ackNo || '—' });
    } else if (type === 'passports') {
      details.push({ label: 'Application Type', value: record.applicationType });
      details.push({ label: 'File Number', value: record.fileNo || '—' });
      if (record.appointmentDate) details.push({ label: 'Appointment Date', value: record.appointmentDate });
    } else if (type === 'voterCards') {
      details.push({ label: 'Application Type', value: record.applicationType });
      details.push({ label: 'EPIC / Token No.', value: record.epicNo || record.tokenNo || '—' });
    } else if (type === 'gazettes') {
      details.push({ label: 'Old Name', value: record.oldName });
      details.push({ label: 'New Name', value: record.newName });
      details.push({ label: 'Reason for Name Change', value: record.reasonToChangeName });
      if (record.tokenNo) details.push({ label: 'Token Number', value: record.tokenNo });
    } else if (type === 'waterSupplies') {
      details.push({ label: 'Service Type', value: WATER_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType });
      details.push({ label: 'Application Token No.', value: record.applicationTokenNo });
      details.push({ label: 'Application Date', value: record.applicationDate });
      if (record.connectionNo) details.push({ label: 'Connection Number', value: record.connectionNo });
    } else if (type === 'propertyTaxes') {
      details.push({ label: 'Service Type', value: PROPERTY_TAX_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType });
      details.push({ label: 'Property Tax Number', value: record.propertyTaxNo });
    }

    details.push({ label: 'Date of Service', value: record.dateOfService });
    details.push({ label: 'Created By', value: record.createdBy?.name || '—' });

    return details;
  };

  const getTitle = () => {
    const tabLabels: Record<string, string> = {
      affidavits: 'Affidavit',
      marriages: 'Marriage Registration',
      birthDeath: 'Birth/Death Certificate',
      tradeLicenses: 'Trade License',
      propertyCards: 'Property Card',
      shopAct: 'Shop Act License',
      panCards: 'PAN Card',
      passports: 'Passport',
      voterCards: 'Voter Card',
      gazettes: 'Gazette',
      waterSupplies: 'Water Connection',
      propertyTaxes: 'Property Tax',
    };
    return `${tabLabels[type] || 'Record'} Details`;
  };

  const breakdown = getBreakdown();

  return (
    <Modal title={getTitle()} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: '1.5rem', fontSize: '13px' }}>
        {getDetails().map((d, index) => (
          <div key={index} style={{ gridColumn: d.label === 'Reason for Name Change' || d.label === 'Address' ? 'span 2' : 'auto' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{d.label}</span>
            <span style={{ fontWeight: 500, color: 'var(--text)', wordBreak: 'break-word' }}>{d.value}</span>
          </div>
        ))}
      </div>

      <div className="price-box" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Bill Breakdown</div>
        {breakdown.length === 0 ? (
          <div className="price-row" style={{ marginBottom: 0 }}>
            <span>Standard Service Fee</span>
            <span>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
          </div>
        ) : (
          breakdown.map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div className="price-row" style={{ marginBottom: 0 }}>
                <span>{item.label}</span>
                <span>₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
              {item.remark && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, paddingLeft: 8, fontWeight: 500 }}>
                  ↳ Remark: {item.remark}
                </div>
              )}
            </div>
          ))
        )}
        <div className="price-total">
          <span className="price-total-label">Total Amount Charged</span>
          <span className="price-total-value">₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
