import { forwardRef } from 'react';
import { Affidavit, Marriage, BirthDeathCertificate, TradeLicenseRecord, PanCardRecord, PassportRecord, Gazette, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS } from '@/types';

interface AffidavitReceiptProps {
  record: Affidavit;
}

export const AffidavitReceipt = forwardRef<HTMLDivElement, AffidavitReceiptProps>(({ record }, ref) => (
  <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>AFFIDAVIT / NOTARY RECEIPT</div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {[
          ['Date of service', record.dateOfService],
          ['Customer name', record.customerName],
          ['Phone', record.phone],
          ['Purpose', record.purpose],
          ['Authorized by', AUTH_LABELS[record.authorizerType]],
        ].map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
    </div>
    <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
      Thank you for your visit • Gurav Online Services, Kolhapur
    </div>
  </div>
));

interface MarriageReceiptProps {
  record: Marriage;
}

export const MarriageReceipt = forwardRef<HTMLDivElement, MarriageReceiptProps>(({ record }, ref) => (
  <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>MARRIAGE REGISTRATION RECEIPT</div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {[
          ['Date of service', record.dateOfService],
          ['Contact name', record.contactName],
          ['Phone', record.phone],
          ['Husband', record.spouse1Name],
          ['Wife', record.spouse2Name],
          ['Marriage act', record.marriageAct],
          ['Date of marriage', record.marriageDate],
          ...(record.marriagePlace ? [['Place', record.marriagePlace]] : []),
          ['Linked affidavits', record.affidavits && record.affidavits.length > 0
            ? record.affidavits.map(a => `${a.customerName} (₹${Number(a.amountCharged)})`).join(', ')
            : 'None'
          ],
          ['Services', record.servicesProvided?.join(', ') || '—'],
        ].map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
    </div>
    <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
      Thank you for your visit • Gurav Online Services, Kolhapur
    </div>
  </div>
));

interface BirthDeathReceiptProps {
  record: BirthDeathCertificate;
}

export const BirthDeathReceipt = forwardRef<HTMLDivElement, BirthDeathReceiptProps>(({ record }, ref) => (
  <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
      {record.certificateType === 'Birth' ? 'BIRTH' : 'DEATH'} CERTIFICATE RECEIPT
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {[
          ['Date of service', record.dateOfService],
          ['Certificate type', CERT_TYPE_LABELS[record.certificateType]],
          ['Customer name', record.customerName],
          ['Phone', record.phone],
          [record.certificateType === 'Birth' ? 'Baby name' : 'Deceased name', record.personName],
          [record.certificateType === 'Birth' ? 'Date of birth' : 'Date of death', record.eventDate],
          ['Number of copies', String(record.numberOfCopies)],
        ].map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
    </div>
    <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
      Thank you for your visit • Gurav Online Services, Kolhapur
    </div>
  </div>
));

interface PropertyCardReceiptProps {
  record: import('@/types').PropertyCard;
}

export const PropertyCardReceipt = forwardRef<HTMLDivElement, PropertyCardReceiptProps>(({ record }, ref) => (
  <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
      {record.recordType.toUpperCase()} RECEIPT
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {[
          ['Date of service', record.dateOfService],
          ['Record type', record.recordType],
          ['Customer name', record.customerName],
          ['Mobile', record.phone],
          ['Property number', record.propertyNumber],
        ].map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
    </div>
    <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
      Thank you for your visit • Gurav Online Services, Kolhapur
    </div>
  </div>
));

interface ShopActLicenseReceiptProps {
  record: import('@/types').ShopActLicense;
}

export const ShopActLicenseReceipt = forwardRef<HTMLDivElement, ShopActLicenseReceiptProps>(({ record }, ref) => (
  <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
    <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
    </div>
    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
      SHOP ACT LICENSE RECEIPT
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <tbody>
        {[
          ['Date of service', record.dateOfService],
          ['Customer name', record.customerName],
          ['Mobile', record.phone],
          ['Business name', record.businessName],
          ...(record.email ? [['Email', record.email]] : []),
        ].map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
            <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
    </div>
    <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
      Thank you for your visit • Gurav Online Services, Kolhapur
    </div>
  </div>
));

interface TradeLicenseReceiptProps {
  record: TradeLicenseRecord;
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  New: 'New Trade License',
  Renew: 'Renew Trade License',
  Transfer_Heir: 'Transfer to Heir',
  Transfer_Third_Party: 'Transfer to Third Party',
  Name_Change: 'Business Name Change',
  Trade_Change: 'Trade Activity Change',
  Partner_Change: 'Partner Amendment',
  Cancel: 'Cancel Trade License',
};

export const TradeLicenseReceipt = forwardRef<HTMLDivElement, TradeLicenseReceiptProps>(({ record }, ref) => {
  const getServiceSpecificRows = () => {
    const details = record.details || {};
    switch (record.serviceType) {
      case 'New':
        const partners = details.partners || record.business?.customers || [];
        return [
          ['Trade Type', record.business?.tradeType || '—'],
          ['Trade Subtype', record.business?.tradeSubtype || '—'],
          ['Partners', partners.map((p: any) => `${p.name} (${p.phone})`).join(', ')],
          ['Status', details.status || record.business?.status || 'Pending'],
        ];
      case 'Renew':
        return [
          ['Renewed For Year', String(new Date().getFullYear())],
        ];
      case 'Transfer_Heir':
      case 'Transfer_Third_Party':
        return [
          ['Transfer To', `${details.transferToName || '—'} (${details.transferToPhone || '—'})`],
          ...(details.relationship ? [['Relationship', details.relationship]] : []),
        ];
      case 'Name_Change':
        return [
          ['New Business Name', details.newBusinessName || '—'],
        ];
      case 'Trade_Change':
        return [
          ['New Trade Type', details.newTradeType || '—'],
          ['New Trade Subtype', details.newTradeSubtype || '—'],
        ];
      case 'Partner_Change':
        const newPartners = details.newPartners || [];
        return [
          ['New Partners', newPartners.map((p: any) => `${p.name} (${p.phone})`).join(', ')],
        ];
      default:
        return [];
    }
  };

  const rows = [
    ['Date of service', record.dateOfService],
    ['Service type', SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
    ['Business name', record.business?.name || '—'],
    ...(record.business?.licenseNo ? [['License Number', record.business.licenseNo]] : []),
    ...(record.tokenNo ? [['Token Number', record.tokenNo]] : []),
    ...getServiceSpecificRows(),
    ...(record.linkedAffidavit ? [['Linked Affidavit', `${record.linkedAffidavit.customerName} (${record.linkedAffidavit.purpose})`]] : []),
    ...(record.linkedPropertyCard ? [['Linked Property Card', `Prop No: ${record.linkedPropertyCard.propertyNumber} (${record.linkedPropertyCard.recordType})`]] : []),
    ...(record.linkedShopAct ? [['Linked Shop Act', `${record.linkedShopAct.businessName} (Owner: ${record.linkedShopAct.customerName})`]] : []),
    ['Official Fee', `₹${Number(record.officialFee || 0).toLocaleString('en-IN')}`],
    ['Service Fee', `₹${Number(record.serviceFee || 0).toLocaleString('en-IN')}`],
    ...(record.protocolFee ? [['Protocol Fee', `₹${Number(record.protocolFee).toLocaleString('en-IN')}`]] : []),
    ...(record.miscFee ? [['Misc. Fee', `₹${Number(record.miscFee).toLocaleString('en-IN')}`]] : []),
  ];

  return (
    <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
        TRADE LICENSE RECEIPT
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
        Thank you for your visit • Gurav Online Services, Kolhapur
      </div>
    </div>
  );
});

interface PanCardReceiptProps {
  record: PanCardRecord;
}

export const PanCardReceipt = forwardRef<HTMLDivElement, PanCardReceiptProps>(({ record }, ref) => {
  const rows = [
    ['Date of Service', record.dateOfService],
    ['Service Name', 'PAN Card Registration'],
    ['Customer Name', record.customerName],
    ['Mobile Number', record.phone],
    ['Application Type', record.applicationType],
    ...(record.ackNo ? [['Acknowledgement No', record.ackNo]] : []),
    ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
    ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
  ];

  return (
    <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
        PAN CARD RECEIPT
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
        Thank you for your visit • Gurav Online Services, Kolhapur
      </div>
    </div>
  );
});

interface PassportReceiptProps {
  record: PassportRecord;
}

export const PassportReceipt = forwardRef<HTMLDivElement, PassportReceiptProps>(({ record }, ref) => {
  const rows = [
    ['Date of Service', record.dateOfService],
    ['Service Name', 'Passport Registration'],
    ['Customer Name', record.customerName],
    ['Mobile Number', record.phone],
    ['Application Type', record.applicationType],
    ...(record.fileNo ? [['File Number', record.fileNo]] : []),
    ...(record.appointmentDate ? [['Appointment Date', record.appointmentDate]] : []),
    ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
    ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
  ];

  return (
    <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
        PASSPORT RECEIPT
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
        Thank you for your visit • Gurav Online Services, Kolhapur
      </div>
    </div>
  );
});

interface GazetteReceiptProps {
  record: Gazette;
}

export const GazetteReceipt = forwardRef<HTMLDivElement, GazetteReceiptProps>(({ record }, ref) => {
  const rows = [
    ['Date of Service', record.dateOfService],
    ['Service Name', 'Gazette Name Change'],
    ['Applicant Name', record.customerName],
    ['Mobile Number', record.phone],
    ['Old Name', record.oldName],
    ['New Name', record.newName],
    ['Reason to Change', record.reasonToChangeName],
    ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
    ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
  ];

  return (
    <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
        GAZETTE NAME CHANGE RECEIPT
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
              <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
        <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
        Thank you for your visit • Gurav Online Services, Kolhapur
      </div>
    </div>
  );
});


