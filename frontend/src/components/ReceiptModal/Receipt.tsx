import { forwardRef } from 'react';
import { Affidavit, Marriage, BirthDeathCertificate, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS } from '@/types';

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
          ['Spouse 1', record.spouse1Name],
          ['Spouse 2', record.spouse2Name],
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
