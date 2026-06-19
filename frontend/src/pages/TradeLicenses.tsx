import { useState, useRef, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { tradeLicensesApi, customersApi, affidavitsApi, propertyCardsApi, shopActLicensesApi } from '@/api';
import {
  TradeTypeConfig, Business, TradeLicenseRecord, Affidavit, PropertyCard, ShopActLicense,
} from '@/types';
import { usePricing } from '@/hooks/usePricing';
import { TradeLicenseReceipt, SERVICE_TYPE_LABELS } from '@/components/ReceiptModal/Receipt';
import NeoDatePicker from '@/components/NeoDatePicker';
import NeoSelect from '@/components/NeoSelect';
import { useAuth } from '@/context/AuthContext';

interface PartnerField {
  name: string;
  phone: string;
  email?: string;
}

interface NewServiceFormValues {
  tokenNo: string;
  name: string; // Business Name
  partners: PartnerField[];
  phone: string; // Business phone
  email: string; // Business email
  tradeType: string;
  tradeSubtype: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  miscFee: number;
  linkAffidavit: boolean;
  linkPropertyCard: boolean;
  linkShopAct: boolean;
  linkedAffidavitId?: string;
  linkedPropertyCardId?: string;
  linkedShopActId?: string;
  amountCharged: number;
  dateOfService: string;
}

interface OtherServiceFormValues {
  businessId: string;
  tokenNo: string;
  dateOfService: string;
  officialFee: number;
  serviceFee: number;
  protocolFee: number;
  miscFee: number;
  linkedAffidavitId?: string;
  linkedPropertyCardId?: string;
  linkedShopActId?: string;
  amountCharged: number;
  // Service-specific details:
  transferToName?: string;
  transferToPhone?: string;
  relationship?: string; // for Transfer_Heir
  newBusinessName?: string; // for Name_Change
  newTradeType?: string; // for Trade_Change
  newTradeSubtype?: string; // for Trade_Change
  newPartners?: PartnerField[]; // for Partner_Change
}

export default function TradeLicensesPage() {
  const [activeTab, setActiveTab] = useState<'forms' | 'businesses' | 'renewal' | 'logs' | 'configs'>('forms');
  const [selectedServiceType, setSelectedServiceType] = useState<TradeLicenseRecord['serviceType']>('New');
  
  // Selection and details state
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);
  const [savedRecord, setSavedRecord] = useState<TradeLicenseRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [licenseNoToApprove, setLicenseNoToApprove] = useState<Record<string, string>>({});
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const { isAdmin } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Queries
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['trade-configs'],
    queryFn: () => tradeLicensesApi.getConfigs().then((r) => r.data),
  });

  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['trade-businesses', searchQuery],
    queryFn: () => tradeLicensesApi.getAllBusinesses({ search: searchQuery }).then((r) => r.data),
  });

  const { data: renewalQueue = [], isLoading: renewalLoading } = useQuery({
    queryKey: ['trade-renewal-queue'],
    queryFn: () => tradeLicensesApi.getRenewalQueue().then((r) => r.data),
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['trade-records', logsSearch],
    queryFn: () => tradeLicensesApi.getAll({ search: logsSearch }).then((r) => r.data),
  });

  const { data: viewingBusinessDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['trade-business-details', viewingBusinessId],
    queryFn: () => viewingBusinessId ? tradeLicensesApi.getBusinessDetails(viewingBusinessId).then((r) => r.data) : null,
    enabled: !!viewingBusinessId,
  });

  const { data: affidavits = [] } = useQuery({
    queryKey: ['trade-linking-affidavits'],
    queryFn: () => affidavitsApi.getAll().then((r) => r.data),
  });

  const { data: propertyCards = [] } = useQuery({
    queryKey: ['trade-linking-property-cards'],
    queryFn: () => propertyCardsApi.getAll().then((r) => r.data),
  });

  const { data: shopActLicenses = [] } = useQuery({
    queryKey: ['trade-linking-shop-acts'],
    queryFn: () => shopActLicensesApi.getAll().then((r) => r.data),
  });

  // Unique trade types for select dropdown
  const uniqueTradeTypes = Array.from(new Set(configs.map((c) => c.tradeType)));

  // Mutations
  const configMutation = useMutation({
    mutationFn: (data: { tradeType: string; tradeSubtype: string; officialFee: number }) =>
      tradeLicensesApi.createConfig(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => tradeLicensesApi.deleteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-configs'] });
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: (data: any) => tradeLicensesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['trade-businesses'] });
      qc.invalidateQueries({ queryKey: ['trade-renewal-queue'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSavedRecord(data);
      setShowSuccessModal(true);
      if (data.business?.id && viewingBusinessId === data.business.id) {
        qc.invalidateQueries({ queryKey: ['trade-business-details', viewingBusinessId] });
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, licenseNo }: { id: string; licenseNo: string }) =>
      tradeLicensesApi.approveApplication(id, licenseNo).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['trade-businesses'] });
      qc.invalidateQueries({ queryKey: ['trade-renewal-queue'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (viewingBusinessId) {
        qc.invalidateQueries({ queryKey: ['trade-business-details', viewingBusinessId] });
      }
    },
  });

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  // ── Form 1: New Trade License Form ─────────────────────────────────────────
  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    control: controlNew,
    watch: watchNew,
    setValue: setValueNew,
    reset: resetNew,
    formState: { errors: errorsNew },
  } = useForm<NewServiceFormValues>({
    defaultValues: {
      partners: [{ name: '', phone: '', email: '' }],
      dateOfService: today,
      officialFee: 0,
      serviceFee: pricing.trade_license_new_service_fee ?? 300,
      protocolFee: pricing.trade_license_protocol_fee ?? 100,
      miscFee: 0,
      linkAffidavit: false,
      linkPropertyCard: false,
      linkShopAct: false,
      amountCharged: 0,
    },
  });

  const { fields: partnerFields, append: appendPartner, remove: removePartner } = useFieldArray({
    control: controlNew,
    name: 'partners',
  });

  const newTradeTypeWatch = watchNew('tradeType');
  const newTradeSubtypeWatch = watchNew('tradeSubtype');
  const newOfficialFeeWatch = watchNew('officialFee');
  const newServiceFeeWatch = watchNew('serviceFee');
  const newProtocolFeeWatch = watchNew('protocolFee');
  const newMiscFeeWatch = watchNew('miscFee');
  const newLinkAffidavitWatch = watchNew('linkAffidavit');
  const newLinkPropertyCardWatch = watchNew('linkPropertyCard');
  const newLinkShopActWatch = watchNew('linkShopAct');
  const newPhoneWatch = watchNew('phone');

  // Filter subtypes based on selected tradeType
  const availableSubtypes = configs.filter((c) => c.tradeType === newTradeTypeWatch);

  // Set official fee automatically when tradeType/tradeSubtype changes
  useEffect(() => {
    if (newTradeTypeWatch && newTradeSubtypeWatch) {
      const match = configs.find(
        (c) => c.tradeType === newTradeTypeWatch && c.tradeSubtype === newTradeSubtypeWatch
      );
      if (match) {
        setValueNew('officialFee', match.officialFee);
      }
    }
  }, [newTradeTypeWatch, newTradeSubtypeWatch, configs, setValueNew]);

  // Recalculate total amount for New Trade License
  useEffect(() => {
    let linkingTotal = 0;
    if (newLinkAffidavitWatch) linkingTotal += pricing.trade_license_link_affidavit_fee ?? 100;
    if (newLinkPropertyCardWatch) linkingTotal += pricing.trade_license_link_property_card_fee ?? 100;
    if (newLinkShopActWatch) linkingTotal += pricing.trade_license_link_shop_act_fee ?? 100;

    const calculatedTotal =
      (Number(newOfficialFeeWatch) || 0) +
      (Number(newServiceFeeWatch) || 0) +
      (Number(newProtocolFeeWatch) || 0) +
      (Number(newMiscFeeWatch) || 0) +
      linkingTotal;

    setValueNew('amountCharged', calculatedTotal);
  }, [
    newOfficialFeeWatch,
    newServiceFeeWatch,
    newProtocolFeeWatch,
    newMiscFeeWatch,
    newLinkAffidavitWatch,
    newLinkPropertyCardWatch,
    newLinkShopActWatch,
    pricing,
    setValueNew,
  ]);

  // Perform lookup on business phone number
  useEffect(() => {
    if (newPhoneWatch && /^[6-9]\d{9}$/.test(newPhoneWatch)) {
      customersApi.lookup(newPhoneWatch)
        .then((res) => {
          if (res.data) {
            setValueNew('name', `${res.data.name}'s Enterprise`);
            if (res.data.email) setValueNew('email', res.data.email);
          }
        })
        .catch(() => {});
    }
  }, [newPhoneWatch, setValueNew]);

  const onNewFormSubmit = (data: NewServiceFormValues) => {
    const payload = {
      serviceType: 'New',
      dateOfService: data.dateOfService,
      officialFee: Number(data.officialFee) || 0,
      serviceFee: Number(data.serviceFee) || 0,
      protocolFee: Number(data.protocolFee) || 0,
      miscFee: Number(data.miscFee) || 0,
      amountCharged: Number(data.amountCharged) || 0,
      tokenNo: data.tokenNo || null,
      linkedAffidavitId: data.linkAffidavit ? data.linkedAffidavitId : undefined,
      linkedPropertyCardId: data.linkPropertyCard ? data.linkedPropertyCardId : undefined,
      linkedShopActId: data.linkShopAct ? data.linkedShopActId : undefined,
      newBusinessData: {
        name: data.name,
        tradeType: data.tradeType,
        tradeSubtype: data.tradeSubtype,
        phone: data.phone,
        email: data.email || null,
        partners: data.partners,
      },
      details: {
        addedServices: [
          ...(data.linkAffidavit ? ['Linking Affidavit'] : []),
          ...(data.linkPropertyCard ? ['Linking Property Card'] : []),
          ...(data.linkShopAct ? ['Linking Shop Act'] : []),
        ],
      },
    };
    createRecordMutation.mutate(payload, {
      onSuccess: () => {
        resetNew({
          tokenNo: '',
          name: '',
          phone: '',
          email: '',
          tradeType: '',
          tradeSubtype: '',
          partners: [{ name: '', phone: '', email: '' }],
          dateOfService: today,
          officialFee: 0,
          serviceFee: pricing.trade_license_new_service_fee ?? 300,
          protocolFee: pricing.trade_license_protocol_fee ?? 100,
          miscFee: 0,
          linkAffidavit: false,
          linkPropertyCard: false,
          linkShopAct: false,
          linkedAffidavitId: '',
          linkedPropertyCardId: '',
          linkedShopActId: '',
          amountCharged: 0,
        });
      },
    });
  };

  // ── Form 2: Other Services Form ────────────────────────────────────────────
  const {
    register: registerOther,
    handleSubmit: handleSubmitOther,
    control: controlOther,
    watch: watchOther,
    setValue: setValueOther,
    reset: resetOther,
    formState: { errors: errorsOther },
  } = useForm<OtherServiceFormValues>({
    defaultValues: {
      dateOfService: today,
      officialFee: 0,
      serviceFee: 0,
      protocolFee: 0,
      miscFee: 0,
      amountCharged: 0,
      newPartners: [{ name: '', phone: '' }],
    },
  });

  const { fields: newPartnerFields, append: appendNewPartner, remove: removeNewPartner } = useFieldArray({
    control: controlOther,
    name: 'newPartners',
  });

  const otherOfficialFeeWatch = watchOther('officialFee');
  const otherServiceFeeWatch = watchOther('serviceFee');
  const otherProtocolFeeWatch = watchOther('protocolFee');
  const otherMiscFeeWatch = watchOther('miscFee');
  const otherNewTradeTypeWatch = watchOther('newTradeType');
  const otherNewTradeSubtypeWatch = watchOther('newTradeSubtype');

  // Set default service fee when serviceType changes
  useEffect(() => {
    let fee = 0;
    switch (selectedServiceType) {
      case 'Renew':
        fee = pricing.trade_license_renew_service_fee ?? 200;
        break;
      case 'Transfer_Heir':
        fee = pricing.trade_license_transfer_heir_service_fee ?? 250;
        break;
      case 'Transfer_Third_Party':
        fee = pricing.trade_license_transfer_third_party_service_fee ?? 300;
        break;
      case 'Name_Change':
        fee = pricing.trade_license_name_change_service_fee ?? 150;
        break;
      case 'Trade_Change':
        fee = pricing.trade_license_trade_change_service_fee ?? 200;
        break;
      case 'Partner_Change':
        fee = pricing.trade_license_partner_change_service_fee ?? 150;
        break;
      case 'Cancel':
        fee = pricing.trade_license_cancel_service_fee ?? 100;
        break;
    }
    setValueOther('serviceFee', fee);
  }, [selectedServiceType, pricing, setValueOther]);

  // Auto-fetch official fee for Renew based on business trade config
  useEffect(() => {
    if (selectedServiceType === 'Renew' && selectedBusiness && configs.length > 0) {
      const match = configs.find(
        (c) => c.tradeType === selectedBusiness.tradeType && c.tradeSubtype === selectedBusiness.tradeSubtype
      );
      if (match) {
        setValueOther('officialFee', match.officialFee);
      } else {
        setValueOther('officialFee', 0);
      }
    } else if (selectedServiceType === 'Renew' && !selectedBusiness) {
      setValueOther('officialFee', 0);
    }
  }, [selectedServiceType, selectedBusiness, configs, setValueOther]);

  // Auto-fetch official fee for Trade_Change based on selected new type/subtype
  useEffect(() => {
    if (selectedServiceType === 'Trade_Change' && otherNewTradeTypeWatch && otherNewTradeSubtypeWatch && configs.length > 0) {
      const match = configs.find(
        (c) => c.tradeType === otherNewTradeTypeWatch && c.tradeSubtype === otherNewTradeSubtypeWatch
      );
      if (match) {
        setValueOther('officialFee', match.officialFee);
      } else {
        setValueOther('officialFee', 0);
      }
    } else if (selectedServiceType === 'Trade_Change' && (!otherNewTradeTypeWatch || !otherNewTradeSubtypeWatch)) {
      setValueOther('officialFee', 0);
    }
  }, [selectedServiceType, otherNewTradeTypeWatch, otherNewTradeSubtypeWatch, configs, setValueOther]);

  // Handle selectedBusiness state sync with form
  useEffect(() => {
    if (selectedBusiness) {
      setValueOther('businessId', selectedBusiness.id);
    } else {
      setValueOther('businessId', '');
    }
  }, [selectedBusiness, setValueOther]);

  // Recalculate other form total
  useEffect(() => {
    const calculatedTotal =
      (Number(otherOfficialFeeWatch) || 0) +
      (Number(otherServiceFeeWatch) || 0) +
      (Number(otherProtocolFeeWatch) || 0) +
      (Number(otherMiscFeeWatch) || 0);

    setValueOther('amountCharged', calculatedTotal);
  }, [otherOfficialFeeWatch, otherServiceFeeWatch, otherProtocolFeeWatch, otherMiscFeeWatch, setValueOther]);

  const onOtherFormSubmit = (data: OtherServiceFormValues) => {
    const details: any = {};
    if (selectedServiceType === 'Transfer_Heir') {
      details.transferToName = data.transferToName;
      details.transferToPhone = data.transferToPhone;
      details.relationship = data.relationship;
    } else if (selectedServiceType === 'Transfer_Third_Party') {
      details.transferToName = data.transferToName;
      details.transferToPhone = data.transferToPhone;
    } else if (selectedServiceType === 'Name_Change') {
      details.newBusinessName = data.newBusinessName;
    } else if (selectedServiceType === 'Trade_Change') {
      details.newTradeType = data.newTradeType;
      details.newTradeSubtype = data.newTradeSubtype;
    } else if (selectedServiceType === 'Partner_Change') {
      details.newPartners = data.newPartners;
    }

    const payload = {
      serviceType: selectedServiceType,
      businessId: data.businessId,
      dateOfService: data.dateOfService,
      officialFee: Number(data.officialFee) || 0,
      serviceFee: Number(data.serviceFee) || 0,
      protocolFee: Number(data.protocolFee) || 0,
      miscFee: Number(data.miscFee) || 0,
      amountCharged: Number(data.amountCharged) || 0,
      tokenNo: data.tokenNo || null,
      details,
    };

    createRecordMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedBusiness(null);
        resetOther({
          businessId: '',
          tokenNo: '',
          dateOfService: today,
          officialFee: 0,
          serviceFee: 0,
          protocolFee: 0,
          miscFee: 0,
          amountCharged: 0,
          transferToName: '',
          transferToPhone: '',
          relationship: '',
          newBusinessName: '',
          newTradeType: '',
          newTradeSubtype: '',
          newPartners: [{ name: '', phone: '' }],
        });
      },
    });
  };

  // ── Form 3: Config Addition Form ───────────────────────────────────────────
  const {
    register: registerConfig,
    handleSubmit: handleSubmitConfig,
    control: controlConfig,
    watch: watchConfig,
    reset: resetConfig,
    formState: { errors: errorsConfig },
  } = useForm<{ tradeTypeSelect: string; newTradeType?: string; tradeSubtype: string; officialFee: number }>({
    defaultValues: {
      tradeTypeSelect: '',
      newTradeType: '',
      tradeSubtype: '',
      officialFee: 0,
    },
  });

  const configTradeTypeSelectWatch = watchConfig('tradeTypeSelect');

  const onConfigSubmit = (data: { tradeTypeSelect: string; newTradeType?: string; tradeSubtype: string; officialFee: number }) => {
    const tradeType = (data.tradeTypeSelect === '__NEW__' || uniqueTradeTypes.length === 0)
      ? data.newTradeType?.trim()
      : data.tradeTypeSelect;

    if (!tradeType) {
      alert('Please specify a trade category');
      return;
    }

    configMutation.mutate(
      { tradeType, tradeSubtype: data.tradeSubtype, officialFee: Number(data.officialFee) },
      {
        onSuccess: () => {
          resetConfig({
            tradeTypeSelect: '',
            newTradeType: '',
            tradeSubtype: '',
            officialFee: 0,
          });
        },
      }
    );
  };

  // Helper: start service from business details
  const startServiceForBusiness = (biz: Business, service: TradeLicenseRecord['serviceType']) => {
    setSelectedBusiness(biz);
    setSelectedServiceType(service);
    setActiveTab('forms');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Trade License Module</div>
      </div>

      {/* Main Tab bar */}
      <div className="tab-bar" style={{ flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { key: 'forms', label: 'Service Forms' },
          { key: 'businesses', label: 'Businesses List' },
          { key: 'renewal', label: 'Renewal Queue' },
          { key: 'logs', label: 'Service Logs' },
          { key: 'configs', label: 'Trade Configs' },
        ].map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.key as any);
              setSavedRecord(null); // clear printed receipt indicator
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: SERVICE FORMS ── */}
      {activeTab === 'forms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Service Selector Card */}
          <div className="card">
            <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Choose Trade Service Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(SERVICE_TYPE_LABELS) as TradeLicenseRecord['serviceType'][]).map((type) => (
                <button
                  key={type}
                  className={`btn btn-sm ${selectedServiceType === type ? 'btn-primary' : ''}`}
                  onClick={() => {
                    setSelectedServiceType(type);
                    setSavedRecord(null);
                  }}
                >
                  {SERVICE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>


          {createRecordMutation.isError && (
            <div className="alert-error">Failed to save service record. Please try again.</div>
          )}

          {/* Service Forms Inner */}
          {selectedServiceType === 'New' ? (
            /* NEW TRADE LICENSE FORM */
            <div className="card" style={{ maxWidth: 700 }}>
              <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem' }}>New Trade License Application</div>
              <form onSubmit={handleSubmitNew(onNewFormSubmit)}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Token No.</label>
                    <input {...registerNew('tokenNo')} placeholder="e.g. TL-0284" />
                  </div>
                  <div className="form-group">
                    <label>Date of Service *</label>
                    <Controller
                      control={controlNew}
                      name="dateOfService"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoDatePicker value={value} onChange={onChange} max={today} />
                      )}
                    />
                  </div>
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Business Profile</div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Business Mobile Number *</label>
                    <input {...registerNew('phone', { required: true })} placeholder="10-digit primary contact" />
                    {errorsNew.phone && <span className="error-text">Required</span>}
                  </div>
                  <div className="form-group">
                    <label>Business Email-address</label>
                    <input type="email" {...registerNew('email')} placeholder="info@business.com (optional)" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Name *</label>
                  <input {...registerNew('name', { required: true })} placeholder="Exact trade/firm name" />
                  {errorsNew.name && <span className="error-text">Required</span>}
                </div>

                {/* Partners List (useFieldArray) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ margin: 0 }}>Business Partners / Owners *</label>
                    <button type="button" className="btn btn-sm" onClick={() => appendPartner({ name: '', phone: '', email: '' })}>
                      + Add Partner
                    </button>
                  </div>
                  
                  {partnerFields.map((field, index) => (
                    <div key={field.id} className="grid-3" style={{ border: '1px dashed var(--border)', padding: 12, borderRadius: 'var(--radius)', marginBottom: 8, position: 'relative' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Partner {index + 1} Name *</label>
                        <input
                          {...registerNew(`partners.${index}.name` as const, { required: true })}
                          placeholder="Partner full name"
                        />
                        {errorsNew.partners?.[index]?.name && <span className="error-text">Required</span>}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Mobile No. *</label>
                        <input
                          {...registerNew(`partners.${index}.phone` as const, { required: true })}
                          placeholder="10-digit mobile"
                        />
                        {errorsNew.partners?.[index]?.phone && <span className="error-text">Required</span>}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, paddingRight: index > 0 ? 30 : 0 }}>
                        <label>Email ID</label>
                        <input
                          type="email"
                          {...registerNew(`partners.${index}.email` as const)}
                          placeholder="partner@mail.com"
                        />
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removePartner(index)}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                          title="Remove Partner"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Trade Configuration</div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Trade Type *</label>
                    <Controller
                      control={controlNew}
                      name="tradeType"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoSelect
                          value={value}
                          onChange={(val) => {
                            onChange(val);
                            setValueNew('tradeSubtype', ''); // clear subtype
                            setValueNew('officialFee', 0);
                          }}
                          options={uniqueTradeTypes.map((t) => ({ value: t, label: t }))}
                          placeholder="Select Trade Category"
                        />
                      )}
                    />
                    {errorsNew.tradeType && <span className="error-text">Required</span>}
                  </div>
                  <div className="form-group">
                    <label>Trade Subtype *</label>
                    <Controller
                      control={controlNew}
                      name="tradeSubtype"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoSelect
                          value={value}
                          onChange={onChange}
                          options={availableSubtypes.map((s) => ({ value: s.tradeSubtype, label: s.tradeSubtype }))}
                          placeholder="Select Subtype"
                          disabled={!newTradeTypeWatch}
                        />
                      )}
                    />
                    {errorsNew.tradeSubtype && <span className="error-text">Required</span>}
                  </div>
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Linked Services (Add-ons)</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}>
                  {/* Affidavit Linker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" {...registerNew('linkAffidavit')} />
                      Linking Affidavit (+₹{pricing.trade_license_link_affidavit_fee ?? 100})
                    </label>
                    {newLinkAffidavitWatch && (
                      <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                        <label>Select Affidavit Record *</label>
                        <Controller
                          control={controlNew}
                          name="linkedAffidavitId"
                          rules={{ required: newLinkAffidavitWatch }}
                          render={({ field: { value, onChange } }) => (
                            <NeoSelect
                              value={value || ''}
                              onChange={onChange}
                              options={affidavits.map((a) => ({
                                value: a.id,
                                label: `${a.customerName} (${a.phone}) - ${a.purpose}`,
                              }))}
                              placeholder="Choose linkable Affidavit"
                            />
                          )}
                        />
                        {errorsNew.linkedAffidavitId && <span className="error-text">Required when linking affidavit</span>}
                      </div>
                    )}
                  </div>

                  {/* Property Card Linker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" {...registerNew('linkPropertyCard')} />
                      Linking Property Card (+₹{pricing.trade_license_link_property_card_fee ?? 100})
                    </label>
                    {newLinkPropertyCardWatch && (
                      <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                        <label>Select Property Card Record *</label>
                        <Controller
                          control={controlNew}
                          name="linkedPropertyCardId"
                          rules={{ required: newLinkPropertyCardWatch }}
                          render={({ field: { value, onChange } }) => (
                            <NeoSelect
                              value={value || ''}
                              onChange={onChange}
                              options={propertyCards.map((p) => ({
                                value: p.id,
                                label: `${p.customerName} (${p.phone}) - Prop No: ${p.propertyNumber} (${p.recordType})`,
                              }))}
                              placeholder="Choose linkable Property Card"
                            />
                          )}
                        />
                        {errorsNew.linkedPropertyCardId && <span className="error-text">Required when linking property card</span>}
                      </div>
                    )}
                  </div>

                  {/* Shop Act Linker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'normal', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" {...registerNew('linkShopAct')} />
                      Linking Shop Act (+₹{pricing.trade_license_link_shop_act_fee ?? 100})
                    </label>
                    {newLinkShopActWatch && (
                      <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                        <label>Select Shop Act Record *</label>
                        <Controller
                          control={controlNew}
                          name="linkedShopActId"
                          rules={{ required: newLinkShopActWatch }}
                          render={({ field: { value, onChange } }) => (
                            <NeoSelect
                              value={value || ''}
                              onChange={onChange}
                              options={shopActLicenses.map((s) => ({
                                value: s.id,
                                label: `${s.customerName} (${s.phone}) - Business: ${s.businessName}`,
                              }))}
                              placeholder="Choose linkable Shop Act"
                            />
                          )}
                        />
                        {errorsNew.linkedShopActId && <span className="error-text">Required when linking shop act license</span>}
                      </div>
                    )}
                  </div>
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Fee Breakdown & Calculation</div>

                <div className="grid-4">
                  <div className="form-group">
                    <label>Official Fee (₹) *</label>
                    <input
                      type="number"
                      {...registerNew('officialFee', { valueAsNumber: true, required: true })}
                      placeholder="Based on subtype"
                    />
                  </div>
                  <div className="form-group">
                    <label>Service Fee (₹) *</label>
                    <input
                      type="number"
                      {...registerNew('serviceFee', { valueAsNumber: true, required: true })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protocol Fee (₹) *</label>
                    <input
                      type="number"
                      {...registerNew('protocolFee', { valueAsNumber: true, required: true })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Misc. Fee (₹)</label>
                    <input
                      type="number"
                      {...registerNew('miscFee', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="price-box" style={{ marginBottom: '1.25rem' }}>
                  <div className="price-row">
                    <span>Total Calculated Amount</span>
                    <span style={{ fontWeight: 'bold', fontSize: 18 }}>₹{newOfficialFeeWatch + newServiceFeeWatch + newProtocolFeeWatch + newMiscFeeWatch + (newLinkAffidavitWatch ? (pricing.trade_license_link_affidavit_fee ?? 100) : 0) + (newLinkPropertyCardWatch ? (pricing.trade_license_link_property_card_fee ?? 100) : 0) + (newLinkShopActWatch ? (pricing.trade_license_link_shop_act_fee ?? 100) : 0)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Charged Amount (₹) *</label>
                  <input
                    type="number"
                    {...registerNew('amountCharged', { valueAsNumber: true, required: true })}
                    placeholder="Grand total"
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={createRecordMutation.isPending}>
                    {createRecordMutation.isPending ? 'Saving…' : 'Submit Application'}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      resetNew({
                        tokenNo: '',
                        name: '',
                        phone: '',
                        email: '',
                        tradeType: '',
                        tradeSubtype: '',
                        partners: [{ name: '', phone: '', email: '' }],
                        dateOfService: today,
                        officialFee: 0,
                        serviceFee: pricing.trade_license_new_service_fee ?? 300,
                        protocolFee: pricing.trade_license_protocol_fee ?? 100,
                        miscFee: 0,
                        linkAffidavit: false,
                        linkPropertyCard: false,
                        linkShopAct: false,
                        amountCharged: 0,
                      });
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* OTHER TRADE SERVICES FORMS */
            <div className="card" style={{ maxWidth: 650 }}>
              <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1rem' }}>
                Service: {SERVICE_TYPE_LABELS[selectedServiceType]}
              </div>
              <form onSubmit={handleSubmitOther(onOtherFormSubmit)}>
                {selectedBusiness ? (
                  <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', padding: 12, borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{selectedBusiness.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        License: {selectedBusiness.licenseNo || 'Pending Approval'} | Phone: {selectedBusiness.phone || '—'}
                      </div>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => setSelectedBusiness(null)}>
                      Change Business
                    </button>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Select Target Business *</label>
                    <Controller
                      control={controlOther}
                      name="businessId"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoSelect
                          value={value}
                          onChange={(val) => {
                            onChange(val);
                            const biz = businesses.find((b) => b.id === val);
                            if (biz) setSelectedBusiness(biz);
                          }}
                          options={businesses.map((b) => ({ value: b.id, label: `${b.name} (${b.licenseNo || 'No License'})` }))}
                          placeholder="Select active business record"
                        />
                      )}
                    />
                    {errorsOther.businessId && <span className="error-text">Required</span>}
                  </div>
                )}

                <div className="grid-2">
                  <div className="form-group">
                    <label>Token No.</label>
                    <input {...registerOther('tokenNo')} placeholder="e.g. TL-0985" />
                  </div>
                  <div className="form-group">
                    <label>Date of Service *</label>
                    <Controller
                      control={controlOther}
                      name="dateOfService"
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <NeoDatePicker value={value} onChange={onChange} max={today} />
                      )}
                    />
                  </div>
                </div>

                {/* Service Specific Fields */}
                {(selectedServiceType === 'Transfer_Heir' || selectedServiceType === 'Transfer_Third_Party') && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>Transfer Target Information</div>
                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Transfer To (Name) *</label>
                        <input {...registerOther('transferToName', { required: true })} placeholder="New Owner Full Name" />
                        {errorsOther.transferToName && <span className="error-text">Required</span>}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Transfer To (Phone) *</label>
                        <input {...registerOther('transferToPhone', { required: true })} placeholder="10-digit phone" />
                        {errorsOther.transferToPhone && <span className="error-text">Required</span>}
                      </div>
                    </div>
                    {selectedServiceType === 'Transfer_Heir' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Relationship with Original Owner *</label>
                        <input {...registerOther('relationship', { required: true })} placeholder="e.g. Son, Wife, Legal Heir" />
                        {errorsOther.relationship && <span className="error-text">Required</span>}
                      </div>
                    )}
                  </div>
                )}

                {selectedServiceType === 'Name_Change' && (
                  <div className="form-group">
                    <label>New Business Name *</label>
                    <input {...registerOther('newBusinessName', { required: true })} placeholder="New registered firm name" />
                    {errorsOther.newBusinessName && <span className="error-text">Required</span>}
                  </div>
                )}

                {selectedServiceType === 'Trade_Change' && (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>New Trade Type *</label>
                      <Controller
                        control={controlOther}
                        name="newTradeType"
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <NeoSelect
                            value={value || ''}
                            onChange={(val) => {
                              onChange(val);
                              setValueOther('newTradeSubtype', '');
                            }}
                            options={uniqueTradeTypes.map((t) => ({ value: t, label: t }))}
                            placeholder="Select Category"
                          />
                        )}
                      />
                      {errorsOther.newTradeType && <span className="error-text">Required</span>}
                    </div>
                    <div className="form-group">
                      <label>New Trade Subtype *</label>
                      <Controller
                        control={controlOther}
                        name="newTradeSubtype"
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <NeoSelect
                            value={value || ''}
                            onChange={onChange}
                            options={configs
                              .filter((c) => c.tradeType === watchOther('newTradeType'))
                              .map((s) => ({ value: s.tradeSubtype, label: s.tradeSubtype }))}
                            placeholder="Select Subtype"
                            disabled={!watchOther('newTradeType')}
                          />
                        )}
                      />
                      {errorsOther.newTradeSubtype && <span className="error-text">Required</span>}
                    </div>
                  </div>
                )}

                {selectedServiceType === 'Partner_Change' && (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ margin: 0 }}>New Business Partners *</label>
                      <button type="button" className="btn btn-sm" onClick={() => appendNewPartner({ name: '', phone: '' })}>
                        + Add Partner
                      </button>
                    </div>
                    {newPartnerFields.map((field, index) => (
                      <div key={field.id} className="grid-2" style={{ border: '1px dashed var(--border)', padding: 12, borderRadius: 'var(--radius)', marginBottom: 8, position: 'relative' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label>Partner {index + 1} Name *</label>
                          <input {...registerOther(`newPartners.${index}.name` as const, { required: true })} placeholder="Full name" />
                          {errorsOther.newPartners?.[index]?.name && <span className="error-text">Required</span>}
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, paddingRight: index > 0 ? 30 : 0 }}>
                          <label>Mobile No. *</label>
                          <input {...registerOther(`newPartners.${index}.phone` as const, { required: true })} placeholder="10-digit mobile" />
                          {errorsOther.newPartners?.[index]?.phone && <span className="error-text">Required</span>}
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeNewPartner(index)}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--danger)', fontSize: 16, cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing / Fees */}
                <div className="grid-4" style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label>Official Fee (₹)</label>
                    <input type="number" {...registerOther('officialFee', { valueAsNumber: true })} />
                  </div>
                  <div className="form-group">
                    <label>Service Fee (₹)</label>
                    <input type="number" {...registerOther('serviceFee', { valueAsNumber: true })} />
                  </div>
                  <div className="form-group">
                    <label>Protocol Fee (₹)</label>
                    <input type="number" {...registerOther('protocolFee', { valueAsNumber: true })} />
                  </div>
                  <div className="form-group">
                    <label>Misc. Fee (₹)</label>
                    <input type="number" {...registerOther('miscFee', { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="price-box" style={{ marginBottom: '1.25rem' }}>
                  <div className="price-row">
                    <span>Total Calculated Amount</span>
                    <span style={{ fontWeight: 'bold', fontSize: 18 }}>₹{otherOfficialFeeWatch + otherServiceFeeWatch + otherProtocolFeeWatch + otherMiscFeeWatch}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Charged Amount (₹) *</label>
                  <input type="number" {...registerOther('amountCharged', { valueAsNumber: true, required: true })} />
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={createRecordMutation.isPending}>
                    {createRecordMutation.isPending ? 'Saving…' : 'Submit Service Record'}
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setSelectedBusiness(null);
                      resetOther({
                        businessId: '',
                        tokenNo: '',
                        dateOfService: today,
                        officialFee: 0,
                        serviceFee: 0,
                        protocolFee: 0,
                        miscFee: 0,
                        amountCharged: 0,
                        transferToName: '',
                        transferToPhone: '',
                        relationship: '',
                        newBusinessName: '',
                        newTradeType: '',
                        newTradeSubtype: '',
                        newPartners: [{ name: '', phone: '' }],
                      });
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BUSINESSES LIST ── */}
      {activeTab === 'businesses' && (
        <div className="grid-2">
          {/* List panel */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <input
                className="search-input"
                style={{ width: '100%', margin: 0 }}
                placeholder="Search business name, phone, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {businessesLoading ? (
              <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>
            ) : businesses.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-muted)' }}>No businesses found.</div>
            ) : (
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Business Name</th>
                      <th>License Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr
                        key={b.id}
                        className={viewingBusinessId === b.id ? 'active-row' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setViewingBusinessId(b.id)}
                      >
                        <td style={{ fontWeight: 500 }}>{b.name}</td>
                        <td>
                          {b.licenseNo ? (
                            <span className="badge badge-green">{b.licenseNo}</span>
                          ) : (
                            <span className="badge badge-amber">Pending</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              b.status === 'Approved'
                                ? 'badge-green'
                                : b.status === 'Cancelled'
                                ? 'badge-danger'
                                : 'badge-amber'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details panel */}
          <div className="card">
            {detailsLoading ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading details...</div>
            ) : viewingBusinessDetails ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{viewingBusinessDetails.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Trade: {viewingBusinessDetails.tradeType} ({viewingBusinessDetails.tradeSubtype})
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      viewingBusinessDetails.status === 'Approved'
                        ? 'badge-green'
                        : viewingBusinessDetails.status === 'Cancelled'
                        ? 'badge-danger'
                        : 'badge-amber'
                    }`}
                    style={{ fontSize: 13, padding: '4px 10px' }}
                  >
                    {viewingBusinessDetails.status}
                  </span>
                </div>

                <div className="grid-2" style={{ marginBottom: 14, fontSize: 13 }}>
                  <div>
                    <strong>License Number:</strong>{' '}
                    {viewingBusinessDetails.licenseNo ? (
                      <span className="badge badge-green">{viewingBusinessDetails.licenseNo}</span>
                    ) : (
                      'Not Approved Yet'
                    )}
                  </div>
                  <div>
                    <strong>Last Renewal Year:</strong> {viewingBusinessDetails.lastRenewalYear || '—'}
                  </div>
                  <div>
                    <strong>Mobile Number:</strong> {viewingBusinessDetails.phone || '—'}
                  </div>
                  <div>
                    <strong>Email:</strong> {viewingBusinessDetails.email || '—'}
                  </div>
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Associated Partners</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
                  {viewingBusinessDetails.customers?.map((c: any) => (
                    <span key={c.id} className="badge badge-blue" style={{ padding: '6px 12px', fontSize: 12 }}>
                      👤 {c.name} ({c.phone})
                    </span>
                  ))}
                </div>

                <hr className="divider" style={{ margin: '1rem 0' }} />
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Availed Services History</div>
                {viewingBusinessDetails.records?.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No records logged.</div>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <table style={{ margin: 0, fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Service Type</th>
                          <th>Charged</th>
                          <th>By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingBusinessDetails.records?.map((rec: any) => (
                          <tr key={rec.id}>
                            <td>{rec.dateOfService}</td>
                            <td>
                              <span className="badge badge-blue">
                                {SERVICE_TYPE_LABELS[rec.serviceType] || rec.serviceType}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500 }}>₹{Number(rec.amountCharged).toLocaleString('en-IN')}</td>
                            <td>{rec.createdBy?.name || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Action Shortcuts */}
                {viewingBusinessDetails.status !== 'Cancelled' && (
                  <>
                    <hr className="divider" style={{ margin: '1rem 0' }} />
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>Quick Service Shortcuts</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Renew')}
                      >
                        Renew License
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Transfer_Heir')}
                      >
                        Transfer to Heir
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Transfer_Third_Party')}
                      >
                        Transfer to Third Party
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Name_Change')}
                      >
                        Change Business Name
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Trade_Change')}
                      >
                        Change Trade Category
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => startServiceForBusiness(viewingBusinessDetails, 'Partner_Change')}
                      >
                        Amend Partners
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (confirm('Cancel this business license?')) {
                            startServiceForBusiness(viewingBusinessDetails, 'Cancel');
                          }
                        }}
                      >
                        Cancel Trade License
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                Select a business from the list to view its full details and service history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: RENEWAL QUEUE ── */}
      {activeTab === 'renewal' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--text-muted)' }}>
            Businesses due for license renewal (Active only from March to April)
          </div>
          {renewalLoading ? (
            <div style={{ padding: 20 }}>Loading...</div>
          ) : renewalQueue.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)' }}>No businesses due for renewal at this time (the queue is active only during March and April).</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>License Number</th>
                  <th>Trade category</th>
                  <th>Last Renewed Year</th>
                  <th>Owners / Partners</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {renewalQueue.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                    <td>
                      <span className="badge badge-green">{b.licenseNo}</span>
                    </td>
                    <td>
                      {b.tradeType} ({b.tradeSubtype})
                    </td>
                    <td>{b.lastRenewalYear || 'Never'}</td>
                    <td>{b.customers?.map((c) => c.name).join(', ') || '—'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => startServiceForBusiness(b, 'Renew')}
                      >
                        Process Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 4: SERVICE LOGS ── */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <input
              className="search-input"
              style={{ width: '100%', margin: 0 }}
              placeholder="Search by business name, license, token, phone..."
              value={logsSearch}
              onChange={(e) => setLogsSearch(e.target.value)}
            />
          </div>
          
          {recordsLoading ? (
            <div style={{ padding: 20 }}>Loading...</div>
          ) : records.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)' }}>No transaction logs matching criteria.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service Type</th>
                  <th>Business Name</th>
                  <th>Token No</th>
                  <th>Amt Charged</th>
                  <th>By</th>
                  <th>Approval Action</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.dateOfService}</td>
                    <td>
                      <span className="badge badge-blue">
                        {SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.business?.name || '—'}</td>
                    <td>{r.tokenNo || '—'}</td>
                    <td style={{ fontWeight: 500 }}>₹{Number(r.amountCharged).toLocaleString('en-IN')}</td>
                    <td>{r.createdBy?.name || 'System'}</td>
                    <td>
                      {r.serviceType === 'New' && r.business?.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            style={{ margin: 0, padding: '4px 8px', fontSize: 12, height: 28 }}
                            placeholder="Assign License No"
                            value={licenseNoToApprove[r.id] ?? ''}
                            onChange={(e) =>
                              setLicenseNoToApprove({
                                ...licenseNoToApprove,
                                [r.id]: e.target.value,
                              })
                            }
                          />
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ height: 28, padding: '0 8px' }}
                            disabled={approveMutation.isPending || !licenseNoToApprove[r.id]}
                            onClick={() =>
                              approveMutation.mutate({
                                id: r.id,
                                licenseNo: licenseNoToApprove[r.id],
                              })
                            }
                          >
                            Approve
                          </button>
                        </div>
                      ) : r.serviceType === 'New' ? (
                        <span className="badge badge-green">License No: {r.business?.licenseNo}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          setSavedRecord(r);
                          setTimeout(handlePrint, 100);
                        }}
                      >
                        🖨
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 5: CONFIG MANAGEMENT ── */}
      {activeTab === 'configs' && (
        <div className="grid-2">
          {/* List panel */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
              Existing Trade Config Rates
            </div>
            {configsLoading ? (
              <div style={{ padding: 20 }}>Loading...</div>
            ) : configs.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-muted)' }}>No configurations set up. Please add one.</div>
            ) : (
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Trade Category</th>
                      <th>Subtype</th>
                      <th>Official Fee</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.tradeType}</td>
                        <td>{c.tradeSubtype}</td>
                        <td>₹{c.officialFee}</td>
                        <td>
                          {isAdmin && (
                            <button
                              className="btn btn-sm btn-danger"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                              disabled={deleteConfigMutation.isPending}
                              onClick={() => {
                                if (confirm(`Remove configuration for ${c.tradeType} - ${c.tradeSubtype}?`)) {
                                  deleteConfigMutation.mutate(c.id); // wait, let's fix this below
                                }
                              }}
                            >
                              Del
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add panel */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>Add Trade Type Fee Configuration</div>
            
            {configMutation.isSuccess && (
              <div className="alert-success" style={{ marginBottom: 12 }}>Config rate added successfully!</div>
            )}
            {configMutation.isError && (
              <div className="alert-error" style={{ marginBottom: 12 }}>Failed to add config. Already exists?</div>
            )}
            
            <form onSubmit={handleSubmitConfig(onConfigSubmit)}>
              {uniqueTradeTypes.length > 0 && (
                <div className="form-group">
                  <label>Trade Type Category *</label>
                  <Controller
                    control={controlConfig}
                    name="tradeTypeSelect"
                    rules={{ required: uniqueTradeTypes.length > 0 }}
                    render={({ field: { value, onChange } }) => (
                      <NeoSelect
                        value={value}
                        onChange={onChange}
                        options={[
                          { value: '', label: 'Select Existing Category' },
                          ...uniqueTradeTypes.map((t) => ({ value: t, label: t })),
                          { value: '__NEW__', label: '+ Create New Category...' },
                        ]}
                        placeholder="Choose Category or New"
                      />
                    )}
                  />
                  {errorsConfig.tradeTypeSelect && <span className="error-text">Required</span>}
                </div>
              )}

              {(uniqueTradeTypes.length === 0 || configTradeTypeSelectWatch === '__NEW__') && (
                <div className="form-group">
                  <label>{uniqueTradeTypes.length > 0 ? 'New Category Name *' : 'Trade Type Category *'}</label>
                  <input
                    {...registerConfig('newTradeType', { required: uniqueTradeTypes.length === 0 || configTradeTypeSelectWatch === '__NEW__' })}
                    placeholder="e.g. Food, Industry, Logistics"
                  />
                  {errorsConfig.newTradeType && <span className="error-text">Required</span>}
                </div>
              )}
              
              <div className="form-group">
                <label>Trade Subtype *</label>
                <input
                  {...registerConfig('tradeSubtype', { required: true })}
                  placeholder="e.g. Restaurant, Bakery, Warehouse"
                />
                {errorsConfig.tradeSubtype && <span className="error-text">Required</span>}
              </div>

              <div className="form-group">
                <label>Official License Fee (₹) *</label>
                <input
                  type="number"
                  {...registerConfig('officialFee', { required: true, valueAsNumber: true, min: 0 })}
                  placeholder="Official government fee"
                />
                {errorsConfig.officialFee && <span className="error-text">Required (Min 0)</span>}
              </div>

              <button className="btn btn-primary" type="submit" disabled={configMutation.isPending}>
                {configMutation.isPending ? 'Saving...' : 'Add Configuration Rate'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden print targets */}
      {savedRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <TradeLicenseReceipt ref={receiptRef} record={savedRecord} />
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessModal && savedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div className="card" style={{
            maxWidth: 400,
            width: '100%',
            backgroundColor: '#fff',
            position: 'relative',
            textAlign: 'center',
            padding: '28px 24px',
            boxShadow: '6px 6px 0px #000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setSavedRecord(null);
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            {/* Checkmark Icon */}
            <div style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              border: '3.5px solid #000',
              background: '#2ecc71',
              boxShadow: '3px 3px 0px #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 'bold',
              color: '#000',
              marginBottom: 16,
            }}>
              ✓
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 'bold' }}>Record Saved!</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted, #555)', fontSize: 14 }}>
              The trade license transaction has been successfully registered.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => {
                  handlePrint();
                }}
              >
                🖨 Print Receipt
              </button>
              <button
                className="btn"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowSuccessModal(false);
                  setSavedRecord(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
