import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeLicensesApi, affidavitsApi, propertyCardsApi, shopActLicensesApi } from '@/api';
import { Business, TradeLicenseRecord } from '@/types';
import { SERVICE_TYPE_LABELS } from '@/constants';
import { usePricing } from '@/hooks/usePricing';
import { useCustomerLookup } from '@/hooks/useCustomerLookup';
import NeoDatePicker from '@/components/NeoDatePicker';
import NeoSelect from '@/components/NeoSelect';

const devanagariToEnglishMap: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
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

interface TradeEntry {
  tradeType: string;
  tradeSubtype: string;
  licenseFee: number;
  fireFee: number;
}

interface NewServiceFormValues {
  tokenNo: string;
  name: string; // Business Name
  partners: PartnerField[];
  phone: string; // Business phone
  email: string; // Business email
  trades: TradeEntry[];
  completionCertificateAvailable: boolean;
  isTenant: boolean;
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
  removedTradeIds?: string[]; // for Trade_Change
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
    mutationFn: (data: unknown) => tradeLicensesApi.create(data).then((r) => r.data),
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
      trades: [{ tradeType: '', tradeSubtype: '', licenseFee: 0, fireFee: 0 }],
      completionCertificateAvailable: true,
      isTenant: true,
      dateOfService: today,
      serviceFee: pricing.trade_license_new_service_fee ?? 300,
      protocolFee: pricing.trade_license_protocol_fee ?? 100,
      miscFee: 0,
      linkAffidavit: false,
      linkPropertyCard: false,
      linkShopAct: false,
      amountCharged: 0,
    },
  });

  const {
    fields: partnerFields,
    append: appendPartner,
    remove: removePartner,
  } = useFieldArray({
    control: controlNew,
    name: 'partners',
  });

  const {
    fields: tradeFields,
    append: appendTrade,
    remove: removeTrade,
  } = useFieldArray({
    control: controlNew,
    name: 'trades',
  });

  const tradesWatch = watchNew('trades');
  const newServiceFeeWatch = watchNew('serviceFee');
  const ccAvailableWatch = watchNew('completionCertificateAvailable');
  const isTenantWatch = watchNew('isTenant');

  const newProtocolFeeWatch = watchNew('protocolFee');
  const newMiscFeeWatch = watchNew('miscFee');
  const newLinkAffidavitWatch = watchNew('linkAffidavit');
  const newLinkPropertyCardWatch = watchNew('linkPropertyCard');
  const newLinkShopActWatch = watchNew('linkShopAct');
  const newPhoneWatch = watchNew('phone');
  const newAmountChargedWatch = watchNew('amountCharged');
  const newLinkedAffidavitIdWatch = watchNew('linkedAffidavitId');
  const newLinkedPropertyCardIdWatch = watchNew('linkedPropertyCardId');
  const newLinkedShopActIdWatch = watchNew('linkedShopActId');

  const selectedAffidavit = affidavits.find((a) => a.id === newLinkedAffidavitIdWatch);
  const selectedPropertyCard = propertyCards.find((p) => p.id === newLinkedPropertyCardIdWatch);
  const selectedShopAct = shopActLicenses.find((s) => s.id === newLinkedShopActIdWatch);

  const affidavitPrice =
    Number(
      selectedAffidavit
        ? selectedAffidavit.amountCharged
        : (pricing.trade_license_link_affidavit_fee ?? 100),
    ) || 0;
  const propertyCardPrice =
    Number(
      selectedPropertyCard
        ? selectedPropertyCard.amountCharged
        : (pricing.trade_license_link_property_card_fee ?? 100),
    ) || 0;
  const shopActPrice =
    Number(
      selectedShopAct
        ? selectedShopAct.amountCharged
        : (pricing.trade_license_link_shop_act_fee ?? 100),
    ) || 0;

  // Compute total license+fire fees across all trade entries
  const totalTradeLicenseFee = (tradesWatch || []).reduce(
    (sum, t) => sum + (Number(t.licenseFee) || 0),
    0,
  );
  const totalTradeFireFee = (tradesWatch || []).reduce(
    (sum, t) => sum + (Number(t.fireFee) || 0),
    0,
  );

  // Recalculate total amount for New Trade License
  useEffect(() => {
    let linkingTotal = 0;
    if (newLinkAffidavitWatch) linkingTotal += affidavitPrice;
    if (newLinkPropertyCardWatch) linkingTotal += propertyCardPrice;
    if (newLinkShopActWatch) linkingTotal += shopActPrice;

    // Double the trade license fee portion if completion certificate is not available (No)
    const activeLicenseFee = ccAvailableWatch ? totalTradeLicenseFee : totalTradeLicenseFee * 2;

    // Security Deposit Fee equals 1 year normal license fee, doubled if CC is not available
    const activeDepositFee = isTenantWatch
      ? ccAvailableWatch
        ? totalTradeLicenseFee
        : totalTradeLicenseFee * 2
      : 0;

    const calculatedTotal =
      activeLicenseFee +
      totalTradeFireFee +
      activeDepositFee +
      (Number(newServiceFeeWatch) || 0) +
      (Number(newProtocolFeeWatch) || 0) +
      (Number(newMiscFeeWatch) || 0) +
      linkingTotal;

    if (Number(newAmountChargedWatch) !== calculatedTotal) {
      setValueNew('amountCharged', calculatedTotal);
    }
  }, [
    tradesWatch,
    totalTradeLicenseFee,
    totalTradeFireFee,
    ccAvailableWatch,
    isTenantWatch,
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
    newAmountChargedWatch,
  ]);

  // When amountCharged changes → adjust serviceFee
  useEffect(() => {
    if (newAmountChargedWatch === undefined) return;
    let linkingTotal = 0;
    if (newLinkAffidavitWatch) linkingTotal += affidavitPrice;
    if (newLinkPropertyCardWatch) linkingTotal += propertyCardPrice;
    if (newLinkShopActWatch) linkingTotal += shopActPrice;
    const activeLicenseFee = ccAvailableWatch ? totalTradeLicenseFee : totalTradeLicenseFee * 2;
    const activeDepositFee = isTenantWatch
      ? (ccAvailableWatch ? totalTradeLicenseFee : totalTradeLicenseFee * 2)
      : 0;
    const otherFees =
      activeLicenseFee +
      totalTradeFireFee +
      activeDepositFee +
      (Number(newProtocolFeeWatch) || 0) +
      (Number(newMiscFeeWatch) || 0) +
      linkingTotal;
    const calcTotal = otherFees + (Number(newServiceFeeWatch) || 0);
    if (Number(newAmountChargedWatch) !== calcTotal) {
      setValueNew('serviceFee', Math.max(0, Number(newAmountChargedWatch) - otherFees));
    }
  }, [newAmountChargedWatch, setValueNew]);

  const { showAutoFillIndicator: showNewPhoneIndicator, resetIndicator: resetNewPhoneIndicator } =
    useCustomerLookup(newPhoneWatch, (customer) => {
      setValueNew('name', `${customer.name}'s Enterprise`);
      if (customer.email) setValueNew('email', customer.email);
    });

  const onNewFormSubmit = (data: NewServiceFormValues) => {
    const baseLicenseFee = data.trades.reduce((sum, t) => sum + (Number(t.licenseFee) || 0), 0);
    const totalLicenseFee = data.completionCertificateAvailable
      ? baseLicenseFee
      : baseLicenseFee * 2;
    const totalFireFee = data.trades.reduce((sum, t) => sum + (Number(t.fireFee) || 0), 0);
    const calculatedDepositFee = data.isTenant
      ? data.completionCertificateAvailable
        ? baseLicenseFee
        : baseLicenseFee * 2
      : 0;
    const payload = {
      serviceType: 'New',
      dateOfService: data.dateOfService,
      licenseFee: totalLicenseFee,
      fireFee: totalFireFee,
      depositFee: calculatedDepositFee,
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
        completionCertificateAvailable: data.completionCertificateAvailable,
        isTenant: data.isTenant,
        trades: data.trades.map((t) => ({ tradeType: t.tradeType, tradeSubtype: t.tradeSubtype })),
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
        resetNewPhoneIndicator();
        resetNew({
          tokenNo: '',
          name: '',
          phone: '',
          email: '',
          trades: [{ tradeType: '', tradeSubtype: '', licenseFee: 0, fireFee: 0 }],
          partners: [{ name: '', phone: '', email: '' }],
          completionCertificateAvailable: true,
          isTenant: true,
          dateOfService: today,
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
    getValues: getValuesOther,
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
      removedTradeIds: [],
    },
  });

  const {
    fields: newPartnerFields,
    append: appendNewPartner,
    remove: removeNewPartner,
  } = useFieldArray({
    control: controlOther,
    name: 'newPartners',
  });

  const otherLicenseFeeWatch = watchOther('licenseFee');
  const otherFireFeeWatch = watchOther('fireFee');
  const otherServiceFeeWatch = watchOther('serviceFee');
  const otherProtocolFeeWatch = watchOther('protocolFee');

  const activeOtherConfigs =
    selectedBusiness?.trades
      ?.map((bt) =>
        configs.find((c) => c.tradeType === bt.tradeType && c.tradeSubtype === bt.tradeSubtype),
      )
      .filter(Boolean) || [];
  const showOtherFireFeeInput =
    selectedServiceType === 'Renew' &&
    activeOtherConfigs.some((c) => Number(c!.renewalFireFee || 0) > 0);
  const otherMiscFeeWatch = watchOther('miscFee');
  const otherAmountChargedWatch = watchOther('amountCharged');
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

  // Auto-fetch official fee for Renew based on ALL business trades
  useEffect(() => {
    if (selectedServiceType === 'Renew' && selectedBusiness && configs.length > 0) {
      const trades = selectedBusiness.trades || [];
      let totalLicenseFee = 0;
      let totalFireFee = 0;
      for (const bt of trades) {
        const match = configs.find(
          (c) => c.tradeType === bt.tradeType && c.tradeSubtype === bt.tradeSubtype,
        );
        if (match) {
          totalLicenseFee += Number(match.licenseFee) || 0;
          totalFireFee += Number(match.renewalFireFee || 0);
        }
      }
      // Fallback: if no trades array, try legacy fields
      if (trades.length === 0 && selectedBusiness.tradeType && selectedBusiness.tradeSubtype) {
        const match = configs.find(
          (c) =>
            c.tradeType === selectedBusiness.tradeType &&
            c.tradeSubtype === selectedBusiness.tradeSubtype,
        );
        if (match) {
          totalLicenseFee = Number(match.licenseFee) || 0;
          totalFireFee = Number(match.renewalFireFee || 0);
        }
      }

      // If building completion certificate is NOT verified, double the license fee
      if (selectedBusiness.completionCertificateVerificationStatus !== 'Verified') {
        totalLicenseFee = totalLicenseFee * 2;
      }

      setValueOther('licenseFee', totalLicenseFee);
      setValueOther('fireFee', totalFireFee);
    } else if (selectedServiceType === 'Renew' && !selectedBusiness) {
      setValueOther('licenseFee', 0);
      setValueOther('fireFee', 0);
    }
  }, [selectedServiceType, selectedBusiness, configs, setValueOther]);

  // Auto-fetch official fee for Trade_Change based on selected new type/subtype
  useEffect(() => {
    if (
      selectedServiceType === 'Trade_Change' &&
      otherNewTradeTypeWatch &&
      otherNewTradeSubtypeWatch &&
      configs.length > 0
    ) {
      const match = configs.find(
        (c) =>
          c.tradeType === otherNewTradeTypeWatch && c.tradeSubtype === otherNewTradeSubtypeWatch,
      );
      if (match) {
        setValueOther('licenseFee', match.licenseFee);
      } else {
        setValueOther('licenseFee', 0);
      }
    } else if (
      selectedServiceType === 'Trade_Change' &&
      (!otherNewTradeTypeWatch || !otherNewTradeSubtypeWatch)
    ) {
      setValueOther('licenseFee', 0);
    }
  }, [
    selectedServiceType,
    otherNewTradeTypeWatch,
    otherNewTradeSubtypeWatch,
    configs,
    setValueOther,
  ]);

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

    if (Number(otherAmountChargedWatch) !== calculatedTotal) {
      setValueOther('amountCharged', calculatedTotal);
    }
  }, [
    otherLicenseFeeWatch,
    otherFireFeeWatch,
    otherServiceFeeWatch,
    otherProtocolFeeWatch,
    otherMiscFeeWatch,
    setValueOther,
    otherAmountChargedWatch,
  ]);

  // When amountCharged changes → adjust serviceFee
  useEffect(() => {
    if (otherAmountChargedWatch === undefined) return;
    const otherFees =
      (Number(otherLicenseFeeWatch) || 0) +
      (Number(otherFireFeeWatch) || 0) +
      (Number(otherProtocolFeeWatch) || 0) +
      (Number(otherMiscFeeWatch) || 0);
    const calcTotal = otherFees + (Number(otherServiceFeeWatch) || 0);
    if (Number(otherAmountChargedWatch) !== calcTotal) {
      setValueOther('serviceFee', Math.max(0, Number(otherAmountChargedWatch) - otherFees));
    }
  }, [otherAmountChargedWatch, setValueOther]);

  const onOtherFormSubmit = (data: OtherServiceFormValues) => {
    const details: Record<string, unknown> = {};
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
      if (data.newTradeType && data.newTradeSubtype) {
        details.addedTrades = [
          { tradeType: data.newTradeType, tradeSubtype: data.newTradeSubtype },
        ];
      }
      details.removedTradeIds = data.removedTradeIds || [];
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
          removedTradeIds: [],
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
          <div style={{ fontWeight: 500, fontSize: 16, marginBottom: '1.25rem' }}>
            New Trade License Application
          </div>
          <form onSubmit={handleSubmitNew(onNewFormSubmit)}>
            <div className="grid-2">
              <div className="form-group">
                <label>Token No.</label>
                <input {...registerNew('tokenNo')} placeholder="e.g. TL-0284" />
              </div>
              <div className="form-group">
                <label>Date of Service <span className="required-star">*</span></label>
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
                {showNewPhoneIndicator && (
                  <span
                    style={{
                      color: 'var(--success)',
                      fontSize: 11,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    ✓ Auto-filled from customer profile
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Business Email-address</label>
                <input
                  type="email"
                  {...registerNew('email')}
                  placeholder="info@business.com (optional)"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Business Name <span className="required-star">*</span></label>
              <input
                {...registerNew('name', { required: true })}
                placeholder="Exact trade/firm name"
              />
              {errorsNew.name && <span className="error-text">Required</span>}
            </div>

            {/* Partners List (useFieldArray) */}
            <div className="form-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ margin: 0 }}>Business Partners / Owners <span className="required-star">*</span></label>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => appendPartner({ name: '', phone: '', email: '' })}
                >
                  + Add Partner
                </button>
              </div>

              {partnerFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid-3"
                  style={{
                    border: '1px dashed var(--border)',
                    padding: 12,
                    borderRadius: 'var(--radius)',
                    marginBottom: 8,
                    position: 'relative',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Partner {index + 1} Name <span className="required-star">*</span></label>
                    <input
                      {...registerNew(`partners.${index}.name` as const, { required: true })}
                      placeholder="Partner full name"
                    />
                    {errorsNew.partners?.[index]?.name && (
                      <span className="error-text">Required</span>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Mobile No.</label>
                    <input
                      {...registerNew(`partners.${index}.phone` as const, { required: false })}
                      placeholder="Mobile number"
                    />
                  </div>
                  <div
                    className="form-group"
                    style={{ marginBottom: 0, paddingRight: index > 0 ? 30 : 0 }}
                  >
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 500 }}>Trades & Sub-Trades</div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  appendTrade({ tradeType: '', tradeSubtype: '', licenseFee: 0, fireFee: 0 })
                }
              >
                + Add Trade
              </button>
            </div>

            {tradeFields.map((field, index) => {
              const tradeTypeVal = tradesWatch?.[index]?.tradeType || '';
              const availableSubs = configs
                .filter((c) => c.tradeType === tradeTypeVal)
                .sort((a, b) => {
                  const aNorm = normalizeDigitsForSorting(a.tradeSubtype);
                  const bNorm = normalizeDigitsForSorting(b.tradeSubtype);
                  return aNorm.localeCompare(bNorm, undefined, { numeric: true });
                });
              const currentTrade = tradesWatch?.[index];
              const matchedConfig =
                currentTrade?.tradeType && currentTrade?.tradeSubtype
                  ? configs.find(
                      (c) =>
                        c.tradeType === currentTrade.tradeType &&
                        c.tradeSubtype === currentTrade.tradeSubtype,
                    )
                  : null;

              return (
                <div
                  key={field.id}
                  style={{
                    border: '1px dashed var(--border)',
                    padding: 12,
                    borderRadius: 'var(--radius)',
                    marginBottom: 8,
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Trade {index + 1}
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Trade Type <span className="required-star">*</span></label>
                      <Controller
                        control={controlNew}
                        name={`trades.${index}.tradeType` as const}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <NeoSelect
                            value={value}
                            onChange={(val) => {
                              onChange(val);
                              setValueNew(`trades.${index}.tradeSubtype` as const, '');
                              setValueNew(`trades.${index}.licenseFee` as const, 0);
                              setValueNew(`trades.${index}.fireFee` as const, 0);
                            }}
                            options={uniqueTradeTypes.map((t) => ({ value: t, label: t }))}
                            placeholder="Select Trade Category"
                          />
                        )}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Sub-Trade <span className="required-star">*</span></label>
                      <Controller
                        control={controlNew}
                        name={`trades.${index}.tradeSubtype` as const}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <NeoSelect
                            value={value}
                            onChange={(val) => {
                              onChange(val);
                              // Auto-populate fee
                              const match = configs.find(
                                (c) => c.tradeType === tradeTypeVal && c.tradeSubtype === val,
                              );
                              if (match) {
                                setValueNew(`trades.${index}.licenseFee` as const, match.licenseFee);
                                setValueNew(
                                  `trades.${index}.fireFee` as const,
                                  Number(match.fireFee || 0),
                                );
                              }
                            }}
                            options={availableSubs.map((s) => ({
                              value: s.tradeSubtype,
                              label: s.tradeSubtype,
                            }))}
                            placeholder="Select Subtype"
                            disabled={!tradeTypeVal}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {matchedConfig && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 6,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        License Fee: ₹{Number(matchedConfig.licenseFee).toLocaleString('en-IN')}
                      </span>
                      {Number(matchedConfig.fireFee || 0) > 0 && (
                        <span>
                          Fire Fee: ₹{Number(matchedConfig.fireFee).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeTrade(index)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: 16,
                        cursor: 'pointer',
                      }}
                      title="Remove Trade"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {totalTradeLicenseFee > 0 && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                Total License Fee: ₹{totalTradeLicenseFee.toLocaleString('en-IN')}
                {totalTradeFireFee > 0 && (
                  <> | Total Fire Fee: ₹{totalTradeFireFee.toLocaleString('en-IN')}</>
                )}
              </div>
            )}

            {/* Building Completion Certificate */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                Building Completion Certificate Available? *
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    value="true"
                    checked={ccAvailableWatch === true}
                    onChange={() => setValueNew('completionCertificateAvailable', true)}
                  />
                  <span>Yes (Standard License Fee)</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    value="false"
                    checked={ccAvailableWatch === false}
                    onChange={() => setValueNew('completionCertificateAvailable', false)}
                  />
                  <span
                    style={{ color: ccAvailableWatch === false ? 'var(--warning)' : 'inherit' }}
                  >
                    No (Double License Fee Surcharge)
                  </span>
                </label>
              </div>
              {!ccAvailableWatch && totalTradeLicenseFee > 0 && (
                <div
                  style={{ fontSize: 12, color: 'var(--warning)', marginTop: 6, fontWeight: 500 }}
                >
                  ⚠️ Surcharge active: License fee increased from ₹
                  {totalTradeLicenseFee.toLocaleString('en-IN')} to ₹
                  {(totalTradeLicenseFee * 2).toLocaleString('en-IN')}.
                </div>
              )}
            </div>

            {/* Tenant Status */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                Tenant? *
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    value="true"
                    checked={isTenantWatch === true}
                    onChange={() => setValueNew('isTenant', true)}
                  />
                  <span>Yes (One-Time Security Deposit Fee applies)</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    value="false"
                    checked={isTenantWatch === false}
                    onChange={() => setValueNew('isTenant', false)}
                  />
                  <span>No</span>
                </label>
              </div>
              {isTenantWatch && totalTradeLicenseFee > 0 && (
                <div
                  style={{ fontSize: 12, color: 'var(--success)', marginTop: 6, fontWeight: 500 }}
                >
                  💡 Tenant security deposit fee: ₹
                  {(ccAvailableWatch
                    ? totalTradeLicenseFee
                    : totalTradeLicenseFee * 2
                  ).toLocaleString('en-IN')}{' '}
                  (equal to 1 year's {ccAvailableWatch ? 'normal' : 'doubled'} trade license fee).
                </div>
              )}
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>
              Linked Services (Add-ons)
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}
            >
              {/* Affidavit Linker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input type="checkbox" {...registerNew('linkAffidavit')} />
                  Link Affidavit
                </label>
                {newLinkAffidavitWatch && (
                  <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                    <label>Select Affidavit Record <span className="required-star">*</span></label>
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
                    {errorsNew.linkedAffidavitId && (
                      <span className="error-text">Required when linking affidavit</span>
                    )}
                  </div>
                )}
              </div>

              {/* Property Card Linker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input type="checkbox" {...registerNew('linkPropertyCard')} />
                  Link Property Card
                </label>
                {newLinkPropertyCardWatch && (
                  <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                    <label>Select Property Card Record <span className="required-star">*</span></label>
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
                    {errorsNew.linkedPropertyCardId && (
                      <span className="error-text">Required when linking property card</span>
                    )}
                  </div>
                )}
              </div>

              {/* Shop Act Linker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'normal',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input type="checkbox" {...registerNew('linkShopAct')} />
                  Link Shop Act
                </label>
                {newLinkShopActWatch && (
                  <div className="form-group" style={{ marginLeft: 20, marginBottom: 0 }}>
                    <label>Select Shop Act Record <span className="required-star">*</span></label>
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
                    {errorsNew.linkedShopActId && (
                      <span className="error-text">Required when linking shop act license</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <hr className="divider" style={{ margin: '1rem 0' }} />
            <div style={{ fontWeight: 500, marginBottom: '0.75rem' }}>
              Fee Breakdown & Calculation
            </div>

            <div className="grid-4">
              <div className="form-group">
                <label>Service Fee (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  {...registerNew('serviceFee', { valueAsNumber: true, required: true })}
                />
              </div>
              <div className="form-group">
                <label>Protocol Fee (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  {...registerNew('protocolFee', { valueAsNumber: true, required: true })}
                />
              </div>
              <div className="form-group">
                <label>Misc. Fee (₹)</label>
                <input type="number" {...registerNew('miscFee', { valueAsNumber: true })} />
              </div>
            </div>

            {/* Detailed Fees Breakdown */}
            <div
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: '1rem',
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 6,
                  marginBottom: 4,
                }}
              >
                Fees Breakdown
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base License Fee:</span>
                <span>₹{totalTradeLicenseFee.toLocaleString('en-IN')}</span>
              </div>
              {!ccAvailableWatch && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--warning)',
                    fontWeight: 500,
                  }}
                >
                  <span>Completion Certificate Surcharge (2x):</span>
                  <span>+ ₹{totalTradeLicenseFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              {isTenantWatch && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--success)',
                    fontWeight: 500,
                  }}
                >
                  <span>Security Deposit Fee {!ccAvailableWatch && '(2x Surcharge)'}:</span>
                  <span>
                    ₹
                    {(ccAvailableWatch
                      ? totalTradeLicenseFee
                      : totalTradeLicenseFee * 2
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {totalTradeFireFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fire Fee:</span>
                  <span>₹{totalTradeFireFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Service Fee:</span>
                <span>₹{(Number(newServiceFeeWatch) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Protocol Fee:</span>
                <span>₹{(Number(newProtocolFeeWatch) || 0).toLocaleString('en-IN')}</span>
              </div>
              {Number(newMiscFeeWatch) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Misc. Fee:</span>
                  <span>₹{(Number(newMiscFeeWatch) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {newLinkAffidavitWatch && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Affidavit Linking Fee:</span>
                  <span>₹{affidavitPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              {newLinkPropertyCardWatch && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Property Card Linking Fee:</span>
                  <span>₹{propertyCardPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
              {newLinkShopActWatch && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shop Act Linking Fee:</span>
                  <span>₹{shopActPrice.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="price-box" style={{ marginBottom: '1.25rem' }}>
              <div className="price-row">
                <span>Total Calculated Amount</span>
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                  ₹
                  {(
                    (ccAvailableWatch ? totalTradeLicenseFee : totalTradeLicenseFee * 2) +
                    (isTenantWatch
                      ? ccAvailableWatch
                        ? totalTradeLicenseFee
                        : totalTradeLicenseFee * 2
                      : 0) +
                    totalTradeFireFee +
                    (Number(newServiceFeeWatch) || 0) +
                    (Number(newProtocolFeeWatch) || 0) +
                    (Number(newMiscFeeWatch) || 0) +
                    (newLinkAffidavitWatch ? affidavitPrice : 0) +
                    (newLinkPropertyCardWatch ? propertyCardPrice : 0) +
                    (newLinkShopActWatch ? shopActPrice : 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Total Charged Amount (₹) <span className="required-star">*</span></label>
              <input
                type="number"
                {...registerNew('amountCharged', { valueAsNumber: true, required: true })}
                placeholder="Grand total"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={createRecordMutation.isPending}
              >
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
                    trades: [{ tradeType: '', tradeSubtype: '', licenseFee: 0, fireFee: 0 }],
                    partners: [{ name: '', phone: '', email: '' }],
                    completionCertificateAvailable: true,
                    isTenant: true,
                    dateOfService: today,
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
              <div
                style={{
                  background: 'var(--accent-light)',
                  border: '1px solid var(--accent)',
                  padding: 12,
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{selectedBusiness.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    License: {selectedBusiness.licenseNo || 'Pending Approval'} | Phone:{' '}
                    {selectedBusiness.phone || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setSelectedBusiness(null)}
                >
                  Change Business
                </button>
              </div>
            ) : (
              <div className="form-group">
                <label>Select Target Business <span className="required-star">*</span></label>
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
                      options={businesses.map((b) => ({
                        value: b.id,
                        label: `${b.name} (${b.licenseNo || 'No License'})`,
                      }))}
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
                <label>Date of Service <span className="required-star">*</span></label>
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
            {(selectedServiceType === 'Transfer_Heir' ||
              selectedServiceType === 'Transfer_Third_Party') && (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 12,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14 }}>Transfer Target Information</div>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Transfer To (Name) <span className="required-star">*</span></label>
                    <input
                      {...registerOther('transferToName', { required: true })}
                      placeholder="New Owner Full Name"
                    />
                    {errorsOther.transferToName && <span className="error-text">Required</span>}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Transfer To (Phone)</label>
                    <input
                      {...registerOther('transferToPhone', { required: false })}
                      placeholder="Mobile number"
                    />
                  </div>
                </div>
                {selectedServiceType === 'Transfer_Heir' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Relationship with Original Owner <span className="required-star">*</span></label>
                    <input
                      {...registerOther('relationship', { required: true })}
                      placeholder="e.g. Son, Wife, Legal Heir"
                    />
                    {errorsOther.relationship && <span className="error-text">Required</span>}
                  </div>
                )}
              </div>
            )}

            {selectedServiceType === 'Name_Change' && (
              <div className="form-group">
                <label>New Business Name <span className="required-star">*</span></label>
                <input
                  {...registerOther('newBusinessName', { required: true })}
                  placeholder="New registered firm name"
                />
                {errorsOther.newBusinessName && <span className="error-text">Required</span>}
              </div>
            )}

            {selectedServiceType === 'Trade_Change' && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1rem' }}
              >
                {selectedBusiness?.trades && selectedBusiness.trades.length > 0 && (
                  <div className="form-group">
                    <label>Current Active Trades (Uncheck to Remove)</label>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: 'var(--bg-card-hover)',
                      }}
                    >
                      {selectedBusiness.trades.map((t) => {
                        const isRemoved = (watchOther('removedTradeIds') || []).includes(
                          String(t.id),
                        );
                        return (
                          <label
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: 'normal',
                              cursor: 'pointer',
                              margin: 0,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!isRemoved}
                              value={t.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                const checked = e.target.checked;
                                const currentRemoved = (getValuesOther('removedTradeIds') ||
                                  []) as string[];
                                if (!checked) {
                                  setValueOther('removedTradeIds', [...currentRemoved, val]);
                                } else {
                                  setValueOther(
                                    'removedTradeIds',
                                    currentRemoved.filter((id) => id !== val),
                                  );
                                }
                              }}
                            />
                            <span style={{ fontSize: 13 }}>
                              {t.tradeType} / {t.tradeSubtype}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ fontWeight: 500, fontSize: 13, marginTop: 4 }}>
                  Add New Trade Activity
                </div>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>New Trade Type <span className="required-star">*</span></label>
                    <Controller
                      control={controlOther}
                      name="newTradeType"
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
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>New Trade Subtype <span className="required-star">*</span></label>
                    <Controller
                      control={controlOther}
                      name="newTradeSubtype"
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
                  </div>
                </div>
              </div>
            )}

            {selectedServiceType === 'Partner_Change' && (
              <div className="form-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <label style={{ margin: 0 }}>New Business Partners <span className="required-star">*</span></label>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => appendNewPartner({ name: '', phone: '' })}
                  >
                    + Add Partner
                  </button>
                </div>
                {newPartnerFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid-2"
                    style={{
                      border: '1px dashed var(--border)',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      marginBottom: 8,
                      position: 'relative',
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Partner {index + 1} Name <span className="required-star">*</span></label>
                      <input
                        {...registerOther(`newPartners.${index}.name` as const, { required: true })}
                        placeholder="Full name"
                      />
                      {errorsOther.newPartners?.[index]?.name && (
                        <span className="error-text">Required</span>
                      )}
                    </div>
                    <div
                      className="form-group"
                      style={{ marginBottom: 0, paddingRight: index > 0 ? 30 : 0 }}
                    >
                      <label>Mobile No.</label>
                      <input
                        {...registerOther(`newPartners.${index}.phone` as const, {
                          required: false,
                        })}
                        placeholder="Mobile number"
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeNewPartner(index)}
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
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedServiceType === 'Renew' && selectedBusiness && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background:
                    selectedBusiness.completionCertificateVerificationStatus === 'Verified'
                      ? 'rgba(46, 204, 113, 0.1)'
                      : 'rgba(230, 126, 34, 0.1)',
                  color:
                    selectedBusiness.completionCertificateVerificationStatus === 'Verified'
                      ? 'var(--success)'
                      : 'var(--warning)',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selectedBusiness.completionCertificateVerificationStatus === 'Verified' ? (
                    <>✅ Building Completion Certificate: Verified</>
                  ) : (
                    <>⚠️ Building Completion Certificate: Not Verified</>
                  )}
                </div>
                <div style={{ opacity: 0.9 }}>
                  {selectedBusiness.completionCertificateVerificationStatus === 'Verified'
                    ? 'Normal applicable license fee applies.'
                    : 'Double license fee surcharge applies because the Building Completion Certificate is not submitted or not verified.'}
                </div>
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

            {/* Detailed Fees Breakdown */}
            <div
              style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: '1rem',
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 6,
                  marginBottom: 4,
                }}
              >
                Fees Breakdown ({selectedServiceType})
              </div>
              {selectedServiceType === 'Renew' && selectedBusiness ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Base License Fee:</span>
                    <span>
                      ₹
                      {(() => {
                        const trades = selectedBusiness.trades || [];
                        let base = 0;
                        for (const bt of trades) {
                          const match = configs.find(
                            (c) =>
                              c.tradeType === bt.tradeType && c.tradeSubtype === bt.tradeSubtype,
                          );
                          if (match) base += Number(match.licenseFee) || 0;
                        }
                        if (
                          trades.length === 0 &&
                          selectedBusiness.tradeType &&
                          selectedBusiness.tradeSubtype
                        ) {
                          const match = configs.find(
                            (c) =>
                              c.tradeType === selectedBusiness.tradeType &&
                              c.tradeSubtype === selectedBusiness.tradeSubtype,
                          );
                          if (match) base = Number(match.licenseFee) || 0;
                        }
                        return base;
                      })().toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedBusiness.completionCertificateVerificationStatus !== 'Verified' && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'var(--warning)',
                        fontWeight: 500,
                      }}
                    >
                      <span>Completion Certificate Surcharge (2x):</span>
                      <span>
                        + ₹
                        {(() => {
                          const trades = selectedBusiness.trades || [];
                          let base = 0;
                          for (const bt of trades) {
                            const match = configs.find(
                              (c) =>
                                c.tradeType === bt.tradeType && c.tradeSubtype === bt.tradeSubtype,
                            );
                            if (match) base += Number(match.licenseFee) || 0;
                          }
                          if (
                            trades.length === 0 &&
                            selectedBusiness.tradeType &&
                            selectedBusiness.tradeSubtype
                          ) {
                            const match = configs.find(
                              (c) =>
                                c.tradeType === selectedBusiness.tradeType &&
                                c.tradeSubtype === selectedBusiness.tradeSubtype,
                            );
                            if (match) base = Number(match.licenseFee) || 0;
                          }
                          return base;
                        })().toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                Number(otherLicenseFeeWatch) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>License Fee:</span>
                    <span>₹{(Number(otherLicenseFeeWatch) || 0).toLocaleString('en-IN')}</span>
                  </div>
                )
              )}
              {showOtherFireFeeInput && Number(otherFireFeeWatch) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fire Fee:</span>
                  <span>₹{(Number(otherFireFeeWatch) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Service Fee:</span>
                <span>₹{(Number(otherServiceFeeWatch) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Protocol Fee:</span>
                <span>₹{(Number(otherProtocolFeeWatch) || 0).toLocaleString('en-IN')}</span>
              </div>
              {Number(otherMiscFeeWatch) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Misc. Fee:</span>
                  <span>₹{(Number(otherMiscFeeWatch) || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="price-box" style={{ marginBottom: '1.25rem' }}>
              <div className="price-row">
                <span>Total Calculated Amount</span>
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                  ₹
                  {(
                    (Number(otherLicenseFeeWatch) || 0) +
                    (Number(otherFireFeeWatch) || 0) +
                    (Number(otherServiceFeeWatch) || 0) +
                    (Number(otherProtocolFeeWatch) || 0) +
                    (Number(otherMiscFeeWatch) || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Total Charged Amount (₹) <span className="required-star">*</span></label>
              <input
                type="number"
                {...registerOther('amountCharged', { valueAsNumber: true, required: true })}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={createRecordMutation.isPending}
              >
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
