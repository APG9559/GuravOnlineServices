import { PaperType, AuthorizerType, SubTab, RecordTypeBySubTab } from '@/types';
import type {
  Affidavit,
  Marriage,
  BirthDeathCertificate,
  PropertyCard,
  ShopActLicense,
  TradeLicenseRecord,
  PanCardRecord,
  PassportRecord,
  VoterCardRecord,
  Gazette,
  WaterServiceRecord,
  PropertyTaxRecord,
} from '@/types';
import {
  WATER_SERVICE_TYPE_LABELS,
  PROPERTY_TAX_SERVICE_TYPE_LABELS,
  PAPER_LABELS,
  AUTH_LABELS,
} from '@/constants';
import Modal from '@/components/Modal';
import styles from './ViewRecordModal.module.css';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const matches = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (matches) {
    const [, year, month, day] = matches;
    return `${day}-${month}-${year}`;
  }
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    const dateMatches = datePart.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (dateMatches) {
      const [, year, month, day] = dateMatches;
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
}

export default function ViewRecordModal<T extends SubTab>({
  type,
  record,
  pricing,
  onClose,
}: {
  type: T;
  record: RecordTypeBySubTab<T>;
  pricing: Record<string, number>;
  onClose: () => void;
}) {
  const getBreakdown = () => {
    const items: { label: string; amount: number; remark?: string }[] = [];

    if (type === 'affidavits') {
      const r = record as unknown as Affidavit;
      const stampCost = pricing['stamp500_cost'] ?? 500;
      const plainCost = pricing['plain_cost'] ?? 0;
      const paperCost = r.customerBroughtStamp
        ? 0
        : r.paperType === 'stamp500'
          ? stampCost
          : plainCost;
      const authCost =
        r.authorizerType === 'magistrate' ? 30 : Number(r.notaryPublicFee ?? 0);

      if (!r.customerBroughtStamp) {
        items.push({
          label: `${r.paperType === 'stamp500' ? '₹500 Stamp Paper' : 'Plain Paper'}`,
          amount: paperCost,
        });
      } else {
        items.push({ label: 'Stamp Paper (Customer Brought)', amount: 0 });
      }
      items.push({
        label: `${r.authorizerType === 'magistrate' ? 'Executive Magistrate Fee' : 'Notary Public Fee'}`,
        amount: authCost,
      });

      const subtotal = paperCost + authCost;
      const serviceCharge = Number(r.amountCharged) - subtotal;
      if (serviceCharge > 0) {
        items.push({ label: 'Service / Consultancy Fee', amount: serviceCharge });
      }
    } else if (type === 'marriages') {
      const r = record as unknown as Marriage;
      const uniqueServices = Array.from(new Set<string>(r.servicesProvided || []));
      uniqueServices.forEach((svc: string) => {
        let cost = 0;
        if (svc === 'Online form filling') cost = pricing.online_form ?? 300;
        else if (svc === 'Offline form filling') cost = pricing.offline_form ?? 300;
        else if (svc === 'Document true copy') cost = pricing.true_copy ?? 100;
        else if (svc === 'Misc (Form - Xerox Copies)')
          cost =
            r.miscFee !== undefined && r.miscFee !== null
              ? Number(r.miscFee)
              : (pricing.marriage_misc_fee ?? 0);
        else if (
          svc === 'Marriage Consultancy Fee' ||
          svc === 'Marriage Registration Consultancy Fee'
        )
          cost =
            r.consultancyFee !== undefined && r.consultancyFee !== null
              ? Number(r.consultancyFee)
              : (pricing.marriage_consultancy_fee ?? 500);

        items.push({ label: svc, amount: cost });
      });

      if (Number(r.officialFee || 0) > 0) {
        items.push({ label: 'Official Registration Fee', amount: Number(r.officialFee) });
      }
      if (Number(r.courtFeeTickets || 0) > 0) {
        items.push({ label: 'Court Fee Tickets', amount: Number(r.courtFeeTickets) });
      }

      (r.affidavits || []).forEach((aff) => {
        items.push({
          label: `Linked Affidavit: ${aff.purpose}`,
          amount: Number(aff.amountCharged),
        });
      });
    } else if (type === 'birthDeath') {
      const r = record as unknown as BirthDeathCertificate;
      const firstCopyCost = pricing.birth_death_first_copy ?? 300;
      const extraCopiesCost = pricing.birth_death_extra_copy ?? 50;
      const copies = Number(r.numberOfCopies || 1);

      items.push({ label: `First Certificate Copy`, amount: firstCopyCost });
      if (copies > 1) {
        items.push({
          label: `Extra Copies (${copies - 1} × ₹${extraCopiesCost})`,
          amount: (copies - 1) * extraCopiesCost,
        });
      }

      const calculatedTotal = firstCopyCost + (copies > 1 ? (copies - 1) * extraCopiesCost : 0);
      const diff = Number(r.amountCharged) - calculatedTotal;
      if (diff > 0) {
        items.push({ label: 'Additional Charges / Service Fee', amount: diff });
      }
    } else if (type === 'propertyCards') {
      const r = record as unknown as PropertyCard;
      items.push({
        label: `Property Card Service Fee (${r.recordType})`,
        amount: Number(r.amountCharged),
      });
    } else if (type === 'shopAct') {
      const r = record as unknown as ShopActLicense;
      items.push({ label: 'Shop Act License Service Fee', amount: Number(r.amountCharged) });
    } else if (type === 'tradeLicenses') {
      const r = record as unknown as TradeLicenseRecord;
      let svcLabel: string = r.serviceType;
      if (svcLabel === 'New') svcLabel = 'New Trade License';
      else if (svcLabel === 'Renew') svcLabel = 'Renew Trade License';
      else if (svcLabel === 'Transfer_Heir') svcLabel = 'Transfer to Heir';
      else if (svcLabel === 'Transfer_Third_Party') svcLabel = 'Transfer to Third Party';
      else if (svcLabel === 'Name_Change') svcLabel = 'Business Name Change';
      else if (svcLabel === 'Trade_Change') svcLabel = 'Trade Activity Change';
      else if (svcLabel === 'Partner_Change') svcLabel = 'Partner Amendment';
      else if (svcLabel === 'Cancel') svcLabel = 'Cancel Trade License';

      items.push({ label: `${svcLabel} Service Fee`, amount: Number(r.serviceFee || 0) });

      if (Number(r.licenseFee || 0) > 0) {
        items.push({ label: 'License Fee', amount: Number(r.licenseFee) });
      }
      if (Number(r.fireFee || 0) > 0) {
        items.push({ label: 'Fire Fee', amount: Number(r.fireFee) });
      }
      if (Number(r.protocolFee || 0) > 0) {
        items.push({ label: 'Protocol Fee', amount: Number(r.protocolFee) });
      }
      if (Number(r.miscFee || 0) > 0) {
        items.push({ label: 'Miscellaneous Fee', amount: Number(r.miscFee) });
      }

      if (r.linkedAffidavit) {
        items.push({
          label: `Linked Affidavit: ${r.linkedAffidavit.purpose}`,
          amount: Number(r.linkedAffidavit.amountCharged),
        });
      }
      if (r.linkedPropertyCard) {
        items.push({
          label: `Linked Property Card: ${r.linkedPropertyCard.recordType}`,
          amount: Number(r.linkedPropertyCard.amountCharged),
        });
      }
      if (r.linkedShopAct) {
        items.push({
          label: `Linked Shop Act: ${r.linkedShopAct.businessName}`,
          amount: Number(r.linkedShopAct.amountCharged),
        });
      }
    } else {
      const r = record as unknown as {
        officialFee?: number;
        serviceFee?: number;
        protocolFee?: number;
        miscFee?: number;
        amountCharged?: number;
      };
      if (Number(r.officialFee || 0) > 0) {
        items.push({ label: 'Official Fee', amount: Number(r.officialFee) });
      }
      if (Number(r.serviceFee || 0) > 0) {
        items.push({ label: 'Service Fee', amount: Number(r.serviceFee) });
      }
      if (Number((r as PropertyTaxRecord).protocolFee || 0) > 0) {
        items.push({ label: 'Protocol Fee', amount: Number((r as PropertyTaxRecord).protocolFee) });
      }
      if (Number(r.miscFee || 0) > 0) {
        items.push({ label: 'Miscellaneous Fee', amount: Number(r.miscFee) });
      }

      const subtotal =
        Number(r.officialFee || 0) +
        Number(r.serviceFee || 0) +
        Number((r as PropertyTaxRecord).protocolFee || 0) +
        Number(r.miscFee || 0);
      const diff = Number(r.amountCharged) - subtotal;
      if (diff > 0 && items.length === 0) {
        items.push({ label: 'Service Fee', amount: Number(r.amountCharged) });
      } else if (diff > 0) {
        items.push({ label: 'Additional Charges', amount: diff });
      }
    }

    return items;
  };

  const getDetails = () => {
    const details: { label: string; value: string | React.ReactNode }[] = [];

    const common = record as unknown as {
      customerName?: string;
      contactName?: string;
      applicantName?: string;
      phone?: string;
      email?: string;
      contactEmail?: string;
      address?: string;
      dateOfService?: string;
      createdBy?: { name?: string };
      tokenNo?: string;
      business?: {
        name?: string;
        licenseNo?: string;
        tradeType?: string;
        tradeSubtype?: string;
        trades?: { tradeType: string; tradeSubtype: string }[];
        customers?: { name: string; phone: string; email?: string }[];
      };
    };

    let customerName = common.customerName || common.contactName || common.applicantName || '';
    let phone = common.phone || '';
    let email = common.email || common.contactEmail || '';

    if (type === 'tradeLicenses' && common.business) {
      const biz = common.business;
      customerName = (biz.customers || []).map((c) => c.name).join(', ') || customerName;
      phone = (biz.customers || []).map((c) => c.phone).join(', ') || phone;
      const emails = (biz.customers || []).map((c) => c.email).filter(Boolean);
      if (emails.length > 0) {
        email = emails.join(', ');
      }
    }

    details.push({ label: 'Customer Name', value: customerName || '—' });
    details.push({ label: 'Phone Number', value: phone || '—' });

    if (email) {
      details.push({ label: 'Email', value: email });
    }
    if (common.address) {
      details.push({ label: 'Address', value: common.address });
    }

    if (type === 'affidavits') {
      const r = record as unknown as Affidavit;
      if (r.affidavitNo) {
        details.push({ label: 'Affidavit No.', value: r.affidavitNo });
      }
      details.push({ label: 'Purpose', value: r.purpose });
      details.push({
        label: 'Paper Type',
        value: PAPER_LABELS[r.paperType as PaperType] || r.paperType,
      });
      details.push({
        label: 'Authorizer',
        value: AUTH_LABELS[r.authorizerType as AuthorizerType] || r.authorizerType,
      });
      if (r.authorizerName)
        details.push({ label: 'Authorizer Name', value: r.authorizerName });
      if (r.remark) details.push({ label: 'Remark', value: r.remark });
    } else if (type === 'marriages') {
      const r = record as unknown as Marriage;
      details.push({ label: 'Husband Name', value: r.spouse1Name });
      details.push({ label: 'Wife Name', value: r.spouse2Name });
      details.push({ label: 'Marriage Act', value: r.marriageAct });
      details.push({ label: 'Marriage Date', value: formatDate(r.marriageDate) });
      if (r.appointmentDate)
        details.push({ label: 'Appointment Date', value: formatDate(r.appointmentDate) });
      if (r.marriagePlace)
        details.push({ label: 'Place of Marriage', value: r.marriagePlace });
      if (r.applicationNo)
        details.push({ label: 'Application No.', value: r.applicationNo });
    } else if (type === 'birthDeath') {
      const r = record as unknown as BirthDeathCertificate;
      details.push({ label: 'Certificate Type', value: r.certificateType });
      details.push({ label: 'Person Name', value: r.personName });
      details.push({ label: 'Event Date', value: formatDate(r.eventDate) });
      details.push({ label: 'Number of Copies', value: String(r.numberOfCopies) });
    } else if (type === 'propertyCards') {
      const r = record as unknown as PropertyCard;
      details.push({ label: 'Record Type', value: r.recordType });
      details.push({ label: 'Property Number', value: r.propertyNumber });
    } else if (type === 'shopAct') {
      const r = record as unknown as ShopActLicense;
      details.push({ label: 'Business Name', value: r.businessName });
    } else if (type === 'tradeLicenses') {
      const r = record as unknown as TradeLicenseRecord;
      details.push({ label: 'Business Name', value: r.business?.name || '—' });
      details.push({ label: 'License Number', value: r.business?.licenseNo || '—' });
      details.push({
        label: 'Trade Activity',
        value:
          r.business?.trades && r.business.trades.length > 0
            ? r.business.trades
                .map((t) => `${t.tradeType} / ${t.tradeSubtype}`)
                .join(', ')
            : `${r.business?.tradeType || '—'} / ${r.business?.tradeSubtype || '—'}`,
      });
      details.push({ label: 'Token Number', value: r.tokenNo || '—' });
    } else if (type === 'panCards') {
      const r = record as unknown as PanCardRecord;
      details.push({ label: 'Application Type', value: r.applicationType });
      details.push({ label: 'Acknowledgement No.', value: r.ackNo || '—' });
    } else if (type === 'passports') {
      const r = record as unknown as PassportRecord;
      details.push({ label: 'Application Type', value: r.applicationType });
      details.push({ label: 'File Number', value: r.fileNo || '—' });
      if (r.appointmentDate)
        details.push({ label: 'Appointment Date', value: formatDate(r.appointmentDate) });
    } else if (type === 'voterCards') {
      const r = record as unknown as VoterCardRecord;
      details.push({ label: 'Application Type', value: r.applicationType });
      details.push({ label: 'EPIC / Token No.', value: r.epicNo || r.tokenNo || '—' });
    } else if (type === 'gazettes') {
      const r = record as unknown as Gazette;
      details.push({ label: 'Old Name', value: r.oldName });
      details.push({ label: 'New Name', value: r.newName });
      details.push({ label: 'Reason for Name Change', value: r.reasonToChangeName });
      if (r.tokenNo) details.push({ label: 'Token Number', value: r.tokenNo });
    } else if (type === 'waterSupplies') {
      const r = record as unknown as WaterServiceRecord;
      const detailsObj = (r.details || {}) as Record<string, unknown>;
      details.push({
        label: 'Service Type',
        value: WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
      });
      details.push({ label: 'Application Token No.', value: r.applicationTokenNo });
      details.push({ label: 'Application Date', value: formatDate(r.applicationDate) });
      if (r.connection?.connectionNo)
        details.push({ label: 'Connection Number', value: r.connection.connectionNo });
      if (r.serviceType === 'ConnectionTransfer') {
        const subtypeLabels: Record<string, string> = {
          Purchase: 'By Purchase',
          Inheritance: 'By Inheritance',
          GiftDeed: 'By Gift Deed',
          SubDivision: 'By Property sub-division',
          CourtOrder: 'By Court Order',
        };
        const transferSubtype = detailsObj.transferSubtype as string | undefined;
        if (transferSubtype) {
          details.push({
            label: 'Transfer Subtype',
            value: subtypeLabels[transferSubtype] || transferSubtype,
          });
        }
        const currentOwner = (r.connection?.currentOwner || detailsObj.currentOwner) as string | undefined;
        if (currentOwner)
          details.push({ label: 'Current Owner', value: currentOwner });
        const newOwnerName = detailsObj.newOwnerName as string | undefined;
        if (newOwnerName)
          details.push({ label: 'New Owner Name', value: newOwnerName });
        const newOwnerPhone = detailsObj.newOwnerPhone as string | undefined;
        if (newOwnerPhone)
          details.push({ label: 'New Owner Phone', value: newOwnerPhone });
      }
    } else if (type === 'propertyTaxes') {
      const r = record as unknown as PropertyTaxRecord;
      details.push({
        label: 'Service Type',
        value: PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
      });
      details.push({ label: 'Property Tax Number', value: r.propertyTaxNo });
    }

    details.push({ label: 'Date of Service', value: formatDate(common.dateOfService) });
    details.push({ label: 'Created By', value: common.createdBy?.name || '—' });

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

  const displayedRecord = record as unknown as { amountCharged?: number };

  return (
    <Modal title={getTitle()} onClose={onClose}>
      <div className={styles.detailsGrid}>
        {getDetails().map((d, index) => (
          <div
            key={index}
            style={{
              gridColumn:
                d.label === 'Reason for Name Change' || d.label === 'Address' ? 'span 2' : 'auto',
            }}
          >
            <span className={styles.detailLabel}>{d.label}</span>
            <span className={styles.detailValue}>{d.value}</span>
          </div>
        ))}
      </div>

      <div className={`price-box ${styles.breakdownBox}`}>
        <div className={styles.breakdownTitle}>Bill Breakdown</div>
        {breakdown.length === 0 ? (
          <div className={`price-row ${styles.breakdownPriceRow}`}>
            <span>Standard Service Fee</span>
            <span>₹{Number(displayedRecord.amountCharged).toLocaleString('en-IN')}</span>
          </div>
        ) : (
          breakdown.map((item, i) => (
            <div key={i} className={styles.breakdownItem}>
              <div className={`price-row ${styles.breakdownPriceRow}`}>
                <span>{item.label}</span>
                <span>₹{item.amount.toLocaleString('en-IN')}</span>
              </div>
              {item.remark && <div className={styles.remarkLine}>↳ Remark: {item.remark}</div>}
            </div>
          ))
        )}
        <div className="price-total">
          <span className="price-total-label">Total Amount Charged</span>
          <span className="price-total-value">
            ₹{Number(displayedRecord.amountCharged).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
