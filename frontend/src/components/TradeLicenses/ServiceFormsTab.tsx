import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi, customersApi, affidavitsApi, propertyCardsApi, shopActLicensesApi } from '@/api';
import {
  Business, TradeLicenseRecord, SERVICE_TYPE_LABELS,
} from '@/types';
import { usePricing } from '@/hooks/usePricing';
import NeoDatePicker from '@/components/NeoDatePicker';
import NeoSelect from '@/components/NeoSelect';

const devanagariToEnglishMap: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

function normalizeDigitsForSorting(str: string): string {
  if (!str) return '';
  return str.replace(/[०-९]/g, (char) => devanagariToEnglishMap[char] || char);
}

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
  licenseFee: number;
  fireFee: number;
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
  licenseFee: number;
  fireFee: number;
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

interface ServiceFormsTabProps {
  selectedServiceType: TradeLicenseRecord['serviceType'];
  setSelectedServiceType: (type: TradeLicenseRecord['serviceType']) => void;
  selectedBusiness: Business | null;
  setSelectedBusiness: (biz: Business | null) => void;
  onRecordSaved: (record: TradeLicenseRecord) => void;
}

export default function ServiceFormsTab({
  selectedServiceType,
  setSelectedServiceType,
  selectedBusiness,
  setSelectedBusiness,
  onRecordSaved,
}: ServiceFormsTabProps) {
  const qc = useQueryClient();
  const { pricing } = usePricing();
  const today = new Date().toISOString().split('T')[0];

  // Queries
  const { data: configs = [] } = useQuery({
    queryKey: ['trade-configs'],
    queryFn: () => tradeLicensesApi.getConfigs().then((r) => r.data),
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['trade-businesses-all'],
    queryFn: () => tradeLicensesApi.getAllBusinesses().then((r) => r.data),
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
  const uniqueTradeTypes = Array.from(new Set(configs.map((c) => c.tradeType))).sort((a, b) => {
    const aNorm = normalizeDigitsForSorting(a);
    const bNorm = normalizeDigitsForSorting(b);
    return aNorm.localeCompare(bNorm, undefined, { numeric: true });
  });

  // Mutations
  const createRecordMutation = useMutation({
    mutationFn: (data: any) => tradeLicensesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['trade-records'] });
      qc.invalidateQueries({ queryKey: ['trade-businesses'] });
      qc.invalidateQueries({ queryKey: ['trade-renewal-queue'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onRecordSaved(data);
    },
  });

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
      licenseFee: 0,
      fireFee: 0,
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

  const newTradeTypeWatch = watchNew('tradeType') as string;
  const newTradeSubtypeWatch = watchNew('tradeSubtype') as string;
  const newLicenseFeeWatch = watchNew('licenseFee');
  const newFireFeeWatch = watchNew('fireFee');
  const newServiceFeeWatch = watchNew('serviceFee');

  const activeNewConfig = configs.find(
    (c) => c.tradeType === newTradeTypeWatch && c.tradeSubtype === newTradeSubtypeWatch
  );
  const showNewFireFeeInput = !!(activeNewConfig && Number(activeNewConfig.fireFee || 0) > 0);
  const newProtocolFeeWatch = watchNew('protocolFee');
  const newMiscFeeWatch = watchNew('miscFee');
  const newLinkAffidavitWatch = watchNew('linkAffidavit');
  const newLinkPropertyCardWatch = watchNew('linkPropertyCard');
  const newLinkShopActWatch = watchNew('linkShopAct');
  const newPhoneWatch = watchNew('phone');
  const newLinkedAffidavitIdWatch = watchNew('linkedAffidavitId');
  const newLinkedPropertyCardIdWatch = watchNew('linkedPropertyCardId');
  const newLinkedShopActIdWatch = watchNew('linkedShopActId');

  const selectedAffidavit = affidavits.find((a) => a.id === newLinkedAffidavitIdWatch);
  const selectedPropertyCard = propertyCards.find((p) => p.id === newLinkedPropertyCardIdWatch);
  const selectedShopAct = shopActLicenses.find((s) => s.id === newLinkedShopActIdWatch);

  const affidavitPrice = Number(selectedAffidavit ? selectedAffidavit.amountCharged : (pricing.trade_license_link_affidavit_fee ?? 100)) || 0;
  const propertyCardPrice = Number(selectedPropertyCard ? selectedPropertyCard.amountCharged : (pricing.trade_license_link_property_card_fee ?? 100)) || 0;
  const shopActPrice = Number(selectedShopAct ? selectedShopAct.amountCharged : (pricing.trade_license_link_shop_act_fee ?? 100)) || 0;

  // Filter subtypes based on selected tradeType
  const availableSubtypes = configs
    .filter((c) => c.tradeType === newTradeTypeWatch)
    .sort((a, b) => {
      const aNorm = normalizeDigitsForSorting(a.tradeSubtype);
      const bNorm = normalizeDigitsForSorting(b.tradeSubtype);
      return aNorm.localeCompare(bNorm, undefined, { numeric: true });
    });

  // Set official fee automatically when tradeType/tradeSubtype changes
  useEffect(() => {
    if (newTradeTypeWatch && newTradeSubtypeWatch) {
      const match = configs.find(
        (c) => c.tradeType === newTradeTypeWatch && c.tradeSubtype === newTradeSubtypeWatch
      );
      if (match) {
        setValueNew('licenseFee', match.licenseFee);
        setValueNew('fireFee', Number(match.fireFee || 0));
      } else {
        setValueNew('fireFee', 0);
      }
    } else {
      setValueNew('fireFee', 0);
    }
  }, [newTradeTypeWatch, newTradeSubtypeWatch, configs, setValueNew]);

  // Recalculate total amount for New Trade License
  useEffect(() => {
    let linkingTotal = 0;
    if (newLinkAffidavitWatch) linkingTotal += affidavitPrice;
    if (newLinkPropertyCardWatch) linkingTotal += propertyCardPrice;
    if (newLinkShopActWatch) linkingTotal += shopActPrice;

    const calculatedTotal =
      (Number(newLicenseFeeWatch) || 0) +
      (Number(newFireFeeWatch) || 0) +
      (Number(newServiceFeeWatch) || 0) +
      (Number(newProtocolFeeWatch) || 0) +
      (Number(newMiscFeeWatch) || 0) +
      linkingTotal;

    setValueNew('amountCharged', calculatedTotal);
  }, [
    newLicenseFeeWatch,
    newFireFeeWatch,
    newServiceFeeWatch,
    newProtocolFeeWatch,
    newMiscFeeWatch,
    newLinkAffidavitWatch,
    newLinkPropertyCardWatch,
    newLinkShopActWatch,
    newLinkedAffidavitIdWatch,
    newLinkedPropertyCardIdWatch,
    newLinkedShopActIdWatch,
    affidavits,
    propertyCards,
    shopActLicenses,
    pricing,
    setValueNew,
    affidavitPrice,
    propertyCardPrice,
    shopActPrice,
  ]);

  // Perform lookup on business phone number
  useEffect(() => {
    if (newPhoneWatch && /^\+?[0-9]{7,15}$/.test(newPhoneWatch)) {
      customersApi.lookup(newPhoneWatch)
        .then((res) => {
          if (res.data) {
            setValueNew('name', `${res.data.name}'s Enterprise`);
            if (res.data.email) setValueNew('email', res.data.email);
          }
        })
        .catch(() => { });
    }
  }, [newPhoneWatch, setValueNew]);

  const onNewFormSubmit = (data: NewServiceFormValues) => {
    const payload = {
      serviceType: 'New',
      dateOfService: data.dateOfService,
      licenseFee: Number(data.licenseFee) || 0,
      fireFee: Number(data.fireFee) || 0,
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
          ...(data.linkAffidavit ? ['Link Affidavit'] : []),
          ...(data.linkPropertyCard ? ['Link Property Card'] : []),
          ...(data.linkShopAct ? ['Link Shop Act'] : []),
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
          licenseFee: 0,
          fireFee: 0,
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
      licenseFee: 0,
      fireFee: 0,
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

  const otherLicenseFeeWatch = watchOther('licenseFee');
  const otherFireFeeWatch = watchOther('fireFee');
  const otherServiceFeeWatch = watchOther('serviceFee');
  const otherProtocolFeeWatch = watchOther('protocolFee');

  const activeOtherConfig = selectedBusiness && configs.find(
    (c) => c.tradeType === selectedBusiness.tradeType && c.tradeSubtype === selectedBusiness.tradeSubtype
  );
  const showOtherFireFeeInput = selectedServiceType === 'Renew' && !!(activeOtherConfig && Number(activeOtherConfig.renewalFireFee || 0) > 0);
  const otherMiscFeeWatch = watchOther('miscFee');
  const otherNewTradeTypeWatch = watchOther('newTradeType') as string;
  const otherNewTradeSubtypeWatch = watchOther('newTradeSubtype') as string;

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
        setValueOther('licenseFee', match.licenseFee);
        setValueOther('fireFee', Number(match.renewalFireFee || 0));
      } else {
        setValueOther('licenseFee', 0);
        setValueOther('fireFee', 0);
      }
    } else if (selectedServiceType === 'Renew' && !selectedBusiness) {
      setValueOther('licenseFee', 0);
      setValueOther('fireFee', 0);
    }
  }, [selectedServiceType, selectedBusiness, configs, setValueOther]);

  // Auto-fetch official fee for Trade_Change based on selected new type/subtype
  useEffect(() => {
    if (selectedServiceType === 'Trade_Change' && otherNewTradeTypeWatch && otherNewTradeSubtypeWatch && configs.length > 0) {
      const match = configs.find(
        (c) => c.tradeType === otherNewTradeTypeWatch && c.tradeSubtype === otherNewTradeSubtypeWatch
      );
      if (match) {
        setValueOther('licenseFee', match.licenseFee);
      } else {
        setValueOther('licenseFee', 0);
      }
    } else if (selectedServiceType === 'Trade_Change' && (!otherNewTradeTypeWatch || !otherNewTradeSubtypeWatch)) {
      setValueOther('licenseFee', 0);
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
      (Number(otherLicenseFeeWatch) || 0) +
      (Number(otherFireFeeWatch) || 0) +
      (Number(otherServiceFeeWatch) || 0) +
      (Number(otherProtocolFeeWatch) || 0) +
      (Number(otherMiscFeeWatch) || 0);

    setValueOther('amountCharged', calculatedTotal);
  }, [otherLicenseFeeWatch, otherFireFeeWatch, otherServiceFeeWatch, otherProtocolFeeWatch, otherMiscFeeWatch, setValueOther]);

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
      licenseFee: Number(data.licenseFee) || 0,
      fireFee: Number(data.fireFee) || 0,
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
          licenseFee: 0,
          fireFee: 0,
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

  return (
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
                <label>Business Mobile Number</label>
                <input {...registerNew('phone', { required: false })} placeholder="Mobile number" />
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
                    <label>Mobile No.</label>
                    <input
                      {...registerNew(`partners.${index}.phone` as const, { required: false })}
                      placeholder="Mobile number"
                    />
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
                        setValueNew('licenseFee', 0);
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
                  Linking Affidavit
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
                          searchable={true}
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
                  Linking Property Card
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
                          searchable={true}
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
                  Linking Shop Act
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
                          searchable={true}
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
                <label>License Fee (₹) *</label>
                <input
                  type="number"
                  {...registerNew('licenseFee', { valueAsNumber: true, required: true })}
                  placeholder="Based on subtype"
                />
              </div>
              {showNewFireFeeInput && (
                <div className="form-group">
                  <label>Fire Fee (₹) *</label>
                  <input
                    type="number"
                    {...registerNew('fireFee', { valueAsNumber: true, required: true })}
                  />
                </div>
              )}
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
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>₹{(Number(newLicenseFeeWatch) || 0) + (Number(newFireFeeWatch) || 0) + (Number(newServiceFeeWatch) || 0) + (Number(newProtocolFeeWatch) || 0) + (Number(newMiscFeeWatch) || 0) + (newLinkAffidavitWatch ? affidavitPrice : 0) + (newLinkPropertyCardWatch ? propertyCardPrice : 0) + (newLinkShopActWatch ? shopActPrice : 0)}</span>
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
                    licenseFee: 0,
                    fireFee: 0,
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
                    <label>Transfer To (Phone)</label>
                    <input {...registerOther('transferToPhone', { required: false })} placeholder="Mobile number" />
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
                          .sort((a, b) => {
                            const aNorm = normalizeDigitsForSorting(a.tradeSubtype);
                            const bNorm = normalizeDigitsForSorting(b.tradeSubtype);
                            return aNorm.localeCompare(bNorm, undefined, { numeric: true });
                          })
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
                      <label>Mobile No.</label>
                      <input {...registerOther(`newPartners.${index}.phone` as const, { required: false })} placeholder="Mobile number" />
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
                <label>License Fee (₹)</label>
                <input type="number" {...registerOther('licenseFee', { valueAsNumber: true })} />
              </div>
              {showOtherFireFeeInput && (
                <div className="form-group">
                  <label>Fire Fee (₹)</label>
                  <input type="number" {...registerOther('fireFee', { valueAsNumber: true })} />
                </div>
              )}
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
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>₹{(Number(otherLicenseFeeWatch) || 0) + (Number(otherFireFeeWatch) || 0) + (Number(otherServiceFeeWatch) || 0) + (Number(otherProtocolFeeWatch) || 0) + (Number(otherMiscFeeWatch) || 0)}</span>
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
                    licenseFee: 0,
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
  );
}
