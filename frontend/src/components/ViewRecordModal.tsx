import { PaperType, AuthorizerType, SubTab } from '@/types';
import {
  WATER_SERVICE_TYPE_LABELS, PROPERTY_TAX_SERVICE_TYPE_LABELS,
  PAPER_LABELS, AUTH_LABELS,
} from '@/types';
import Modal from '@/components/Modal';


export default function ViewRecordModal({
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
      const uniqueServices = Array.from(new Set<string>(record.servicesProvided || []));
      uniqueServices.forEach((svc: string) => {
        let cost = 0;
        if (svc === 'Online form filling') cost = pricing.online_form ?? 300;
        else if (svc === 'Offline form filling') cost = pricing.offline_form ?? 300;
        else if (svc === 'Document true copy') cost = pricing.true_copy ?? 100;
        else if (svc === 'Misc (Form, Xerox Copies)') cost = record.miscFee !== undefined && record.miscFee !== null ? Number(record.miscFee) : (pricing.marriage_misc_fee ?? 0);
        else if (svc === 'Marriage Consultancy Fee') cost = pricing.marriage_consultancy_fee ?? 500;

        items.push({ label: svc, amount: cost });
      });

      if (Number(record.officialFee || 0) > 0) {
        items.push({ label: 'Official Registration Fee', amount: Number(record.officialFee) });
      }
      if (Number(record.courtFeeTickets || 0) > 0) {
        items.push({ label: 'Court Fee Tickets', amount: Number(record.courtFeeTickets) });
      }

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

    let customerName = record.customerName || record.contactName || record.applicantName;
    let phone = record.phone;
    let email = record.email || record.contactEmail;

    if (type === 'tradeLicenses' && record.business?.customers?.length > 0) {
      customerName = record.business.customers.map((c: any) => c.name).join(', ');
      phone = record.business.customers.map((c: any) => c.phone).join(', ');
      const emails = record.business.customers.map((c: any) => c.email).filter(Boolean);
      if (emails.length > 0) {
        email = emails.join(', ');
      }
    }

    details.push({ label: 'Customer Name', value: customerName || '—' });
    details.push({ label: 'Phone Number', value: phone || '—' });

    if (email) {
      details.push({ label: 'Email', value: email });
    }
    if (record.address) {
      details.push({ label: 'Address', value: record.address });
    }

    if (type === 'affidavits') {
      if (record.affididavitNo || record.affidavitNo) {
        details.push({ label: 'Affidavit No.', value: record.affidavitNo || record.affididavitNo });
      }
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
      if (record.serviceType === 'ConnectionTransfer') {
        const subtypeLabels: Record<string, string> = {
          Purchase: 'By Purchase',
          Inheritance: 'By Inheritance',
          GiftDeed: 'By Gift Deed',
          SubDivision: 'By Property sub-division',
          CourtOrder: 'By Court Order',
        };
        if (record.transferSubtype) {
          details.push({ label: 'Transfer Subtype', value: subtypeLabels[record.transferSubtype] || record.transferSubtype });
        }
        if (record.currentOwner) details.push({ label: 'Current Owner', value: record.currentOwner });
        if (record.newOwnerName) details.push({ label: 'New Owner Name', value: record.newOwnerName });
        if (record.newOwnerPhone) details.push({ label: 'New Owner Phone', value: record.newOwnerPhone });
      }
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
