// import { forwardRef } from 'react';
// import { Affidavit, Marriage, BirthDeathCertificate, TradeLicenseRecord, PanCardRecord, PassportRecord, VoterCardRecord, Gazette, WATER_SERVICE_TYPE_LABELS, WaterSupply, PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS, SERVICE_TYPE_LABELS, PropertyTax, PROPERTY_TAX_SERVICE_TYPE_LABELS } from '@/types';

// interface AffidavitReceiptProps {
//   record: Affidavit;
// }

// export const AffidavitReceipt = forwardRef<HTMLDivElement, AffidavitReceiptProps>(({ record }, ref) => (
//   <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//     <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//       <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//     </div>
//     <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>AFFIDAVIT / NOTARY RECEIPT</div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//       <tbody>
//         {[
//           ['Date of service', record.dateOfService],
//           ['Customer name', record.customerName],
//           ['Phone', record.phone],
//           ['Purpose', record.purpose],
//           ['Authorized by', AUTH_LABELS[record.authorizerType]],
//         ].map(([k, v]) => (
//           <tr key={k}>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//     <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//       <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//     </div>
//     <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//       Thank you for your visit • Gurav Online Services, Kolhapur
//     </div>
//   </div>
// ));

// interface MarriageReceiptProps {
//   record: Marriage;
// }

// export const MarriageReceipt = forwardRef<HTMLDivElement, MarriageReceiptProps>(({ record }, ref) => (
//   <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//     <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//       <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//     </div>
//     <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>MARRIAGE REGISTRATION RECEIPT</div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//       <tbody>
//         {[
//           ['Date of service', record.dateOfService],
//           ['Contact name', record.contactName],
//           ['Phone', record.phone],
//           ['Husband', record.spouse1Name],
//           ['Wife', record.spouse2Name],
//           ['Marriage act', record.marriageAct],
//           ['Date of marriage', record.marriageDate],
//           ...(record.marriagePlace ? [['Place', record.marriagePlace]] : []),
//           ['Linked affidavits', record.affidavits && record.affidavits.length > 0
//             ? record.affidavits.map(a => `${a.customerName} (₹${Number(a.amountCharged)})`).join(', ')
//             : 'None'
//           ],
//           ['Services', record.servicesProvided?.join(', ') || '—'],
//         ].map(([k, v]) => (
//           <tr key={k}>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//     <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//       <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//     </div>
//     <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//       Thank you for your visit • Gurav Online Services, Kolhapur
//     </div>
//   </div>
// ));

// interface BirthDeathReceiptProps {
//   record: BirthDeathCertificate;
// }

// export const BirthDeathReceipt = forwardRef<HTMLDivElement, BirthDeathReceiptProps>(({ record }, ref) => (
//   <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//     <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//       <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//     </div>
//     <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//       {record.certificateType === 'Birth' ? 'BIRTH' : 'DEATH'} CERTIFICATE RECEIPT
//     </div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//       <tbody>
//         {[
//           ['Date of service', record.dateOfService],
//           ['Certificate type', CERT_TYPE_LABELS[record.certificateType]],
//           ['Customer name', record.customerName],
//           ['Phone', record.phone],
//           [record.certificateType === 'Birth' ? 'Baby name' : 'Deceased name', record.personName],
//           [record.certificateType === 'Birth' ? 'Date of birth' : 'Date of death', record.eventDate],
//           ['Number of copies', String(record.numberOfCopies)],
//         ].map(([k, v]) => (
//           <tr key={k}>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//     <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//       <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//     </div>
//     <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//       Thank you for your visit • Gurav Online Services, Kolhapur
//     </div>
//   </div>
// ));

// interface PropertyCardReceiptProps {
//   record: import('@/types').PropertyCard;
// }

// export const PropertyCardReceipt = forwardRef<HTMLDivElement, PropertyCardReceiptProps>(({ record }, ref) => (
//   <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//     <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//       <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//     </div>
//     <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//       {record.recordType.toUpperCase()} RECEIPT
//     </div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//       <tbody>
//         {[
//           ['Date of service', record.dateOfService],
//           ['Record type', record.recordType],
//           ['Customer name', record.customerName],
//           ['Mobile', record.phone],
//           ['Property number', record.propertyNumber],
//         ].map(([k, v]) => (
//           <tr key={k}>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//     <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//       <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//     </div>
//     <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//       Thank you for your visit • Gurav Online Services, Kolhapur
//     </div>
//   </div>
// ));

// interface ShopActLicenseReceiptProps {
//   record: import('@/types').ShopActLicense;
// }

// export const ShopActLicenseReceipt = forwardRef<HTMLDivElement, ShopActLicenseReceiptProps>(({ record }, ref) => (
//   <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//     <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//       <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//     </div>
//     <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//       SHOP ACT LICENSE RECEIPT
//     </div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//       <tbody>
//         {[
//           ['Date of service', record.dateOfService],
//           ['Customer name', record.customerName],
//           ['Mobile', record.phone],
//           ['Business name', record.businessName],
//           ...(record.email ? [['Email', record.email]] : []),
//         ].map(([k, v]) => (
//           <tr key={k}>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//             <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//     <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//       <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//       <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//     </div>
//     <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//       Thank you for your visit • Gurav Online Services, Kolhapur
//     </div>
//   </div>
// ));

// interface TradeLicenseReceiptProps {
//   record: TradeLicenseRecord;
// }


// export const TradeLicenseReceipt = forwardRef<HTMLDivElement, TradeLicenseReceiptProps>(({ record }, ref) => {
//   const getServiceSpecificRows = () => {
//     const details = record.details || {};
//     switch (record.serviceType) {
//       case 'New':
//         const partners = details.partners || record.business?.customers || [];
//         return [
//           ['Trade Type', record.business?.tradeType || '—'],
//           ['Trade Subtype', record.business?.tradeSubtype || '—'],
//           ['Partners', partners.map((p: any) => `${p.name} (${p.phone})`).join(', ')],
//           ['Status', details.status || record.business?.status || 'Pending'],
//         ];
//       case 'Renew':
//         return [
//           ['Renewed For Year', String(new Date().getFullYear())],
//         ];
//       case 'Transfer_Heir':
//       case 'Transfer_Third_Party':
//         return [
//           ['Transfer To', `${details.transferToName || '—'} (${details.transferToPhone || '—'})`],
//           ...(details.relationship ? [['Relationship', details.relationship]] : []),
//         ];
//       case 'Name_Change':
//         return [
//           ['New Business Name', details.newBusinessName || '—'],
//         ];
//       case 'Trade_Change':
//         return [
//           ['New Trade Type', details.newTradeType || '—'],
//           ['New Trade Subtype', details.newTradeSubtype || '—'],
//         ];
//       case 'Partner_Change':
//         const newPartners = details.newPartners || [];
//         return [
//           ['New Partners', newPartners.map((p: any) => `${p.name} (${p.phone})`).join(', ')],
//         ];
//       default:
//         return [];
//     }
//   };

//   const rows = [
//     ['Date of service', record.dateOfService],
//     ['Service type', SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
//     ['Business name', record.business?.name || '—'],
//     ...(record.business?.licenseNo ? [['License Number', record.business.licenseNo]] : []),
//     ...(record.tokenNo ? [['Token Number', record.tokenNo]] : []),
//     ...getServiceSpecificRows(),
//     ...(record.linkedAffidavit ? [['Linked Affidavit', `${record.linkedAffidavit.customerName} (${record.linkedAffidavit.purpose})`]] : []),
//     ...(record.linkedPropertyCard ? [['Linked Property Card', `Prop No: ${record.linkedPropertyCard.propertyNumber} (${record.linkedPropertyCard.recordType})`]] : []),
//     ...(record.linkedShopAct ? [['Linked Shop Act', `${record.linkedShopAct.businessName} (Owner: ${record.linkedShopAct.customerName})`]] : []),
//     ['Official Fee', `₹${Number(record.officialFee || 0).toLocaleString('en-IN')}`],
//     ['Service Fee', `₹${Number(record.serviceFee || 0).toLocaleString('en-IN')}`],
//     ...(record.protocolFee ? [['Protocol Fee', `₹${Number(record.protocolFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.miscFee ? [['Misc. Fee', `₹${Number(record.miscFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         TRADE LICENSE RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface PanCardReceiptProps {
//   record: PanCardRecord;
// }

// export const PanCardReceipt = forwardRef<HTMLDivElement, PanCardReceiptProps>(({ record }, ref) => {
//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Name', 'PAN Card Registration'],
//     ['Customer Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Application Type', record.applicationType],
//     ...(record.ackNo ? [['Acknowledgement No', record.ackNo]] : []),
//     ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         PAN CARD RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface PassportReceiptProps {
//   record: PassportRecord;
// }

// export const PassportReceipt = forwardRef<HTMLDivElement, PassportReceiptProps>(({ record }, ref) => {
//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Name', 'Passport Registration'],
//     ['Customer Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Application Type', record.applicationType],
//     ...(record.fileNo ? [['File Number', record.fileNo]] : []),
//     ...(record.appointmentDate ? [['Appointment Date', record.appointmentDate]] : []),
//     ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         PASSPORT RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface VoterCardReceiptProps {
//   record: VoterCardRecord;
// }

// export const VoterCardReceipt = forwardRef<HTMLDivElement, VoterCardReceiptProps>(({ record }, ref) => {
//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Name', 'Voter Card Registration'],
//     ['Customer Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Application Type', record.applicationType],
//     ...(record.applicationType === 'New' && record.tokenNo ? [['Token Number', record.tokenNo]] : []),
//     ...(record.applicationType !== 'New' && record.epicNo ? [['EPIC Number', record.epicNo]] : []),
//     ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         VOTER CARD RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface GazetteReceiptProps {
//   record: Gazette;
// }

// export const GazetteReceipt = forwardRef<HTMLDivElement, GazetteReceiptProps>(({ record }, ref) => {
//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Name', 'Gazette Name Change'],
//     ...(record.tokenNo ? [['Token Number', record.tokenNo]] : []),
//     ['Applicant Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Old Name', record.oldName],
//     ['New Name', record.newName],
//     ['Reason to Change', record.reasonToChangeName],
//     ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         GAZETTE NAME CHANGE RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface WaterSupplyReceiptProps {
//   record: WaterSupply;
// }

// export const WaterSupplyReceipt = forwardRef<HTMLDivElement, WaterSupplyReceiptProps>(({ record }, ref) => {
//   const getSpecificRows = () => {
//     switch (record.serviceType) {
//       case 'NewConnection':
//         return [
//           ...(record.plumberName ? [['Plumber Name', record.plumberName]] : []),
//           ...(record.plumberPhone ? [['Plumber Phone', record.plumberPhone]] : []),
//           ...(record.contactPersonName ? [['Contact Person', record.contactPersonName]] : []),
//           ...(record.contactPersonPhone ? [['Contact Phone', record.contactPersonPhone]] : []),
//         ];
//       case 'ConnectionTransfer':
//         return [
//           ['Connection Number', record.connectionNo || '—'],
//           ['Transfer Subtype', record.transferSubtype || '—'],
//           ...(record.currentOwner ? [['Current Owner', record.currentOwner]] : []),
//           ...(record.newOwnerName ? [['New Owner Name', record.newOwnerName]] : []),
//           ...(record.newOwnerPhone ? [['New Owner Phone', record.newOwnerPhone]] : []),
//         ];
//       case 'ChangeOfUse':
//         return [
//           ['Connection Number', record.connectionNo || '—'],
//           ...(record.currentUsage ? [['Current Usage', record.currentUsage]] : []),
//           ...(record.newUsage ? [['New Usage', record.newUsage]] : []),
//         ];
//       default:
//         return [
//           ...(record.connectionNo ? [['Connection Number', record.connectionNo]] : []),
//         ];
//     }
//   };

//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Group', 'KMC Services'],
//     ['Service Name', WATER_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
//     ['Applicant Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Connection Address', record.connectionAddress],
//     ['Token Number', record.applicationTokenNo],
//     ['Application Date', record.applicationDate],
//     ...getSpecificRows(),
//     ...(record.officialFee !== undefined ? [['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`]] : []),
//     ...(record.serviceFee !== undefined ? [['Service Fee', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`]] : []),
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         WATER SUPPLY SERVICE RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

// interface PropertyTaxReceiptProps {
//   record: PropertyTax;
// }

// export const PropertyTaxReceipt = forwardRef<HTMLDivElement, PropertyTaxReceiptProps>(({ record }, ref) => {
//   const rows = [
//     ['Date of Service', record.dateOfService],
//     ['Service Group', 'KMC Services'],
//     ['Service Name', PROPERTY_TAX_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
//     ['Applicant Name', record.customerName],
//     ['Mobile Number', record.phone],
//     ['Address', record.address],
//     ['Property Tax No.', record.propertyTaxNo],
//     ['Official Fee', `₹${Number(record.officialFee).toLocaleString('en-IN')}`],
//     ['Service Fee Charges', `₹${Number(record.serviceFee).toLocaleString('en-IN')}`],
//     ['Protocol Fee', `₹${Number(record.protocolFee).toLocaleString('en-IN')}`],
//   ];

//   return (
//     <div ref={ref} style={{ padding: '8mm', fontFamily: 'serif', fontSize: 13, maxWidth: '130mm', margin: '0 auto', boxSizing: 'border-box' }}>
//       <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
//         <div style={{ fontSize: 18, fontWeight: 'bold' }}>Gurav Online Services</div>
//       </div>
//       <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>
//         PROPERTY TAX RECEIPT
//       </div>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
//         <tbody>
//           {rows.map(([k, v]) => (
//             <tr key={k}>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', color: '#666', width: '40%' }}>{k}</td>
//               <td style={{ padding: '5px 6px', borderBottom: '0.5px solid #ccc', fontWeight: 500 }}>{v}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div style={{ marginTop: 15, padding: 10, border: '1.5px solid #000', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <span style={{ fontSize: 14, fontWeight: 'bold' }}>Amount Charged</span>
//         <span style={{ fontSize: 18, fontWeight: 'bold' }}>₹{Number(record.amountCharged).toLocaleString('en-IN')}</span>
//       </div>
//       <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
//         Thank you for your visit • Gurav Online Services, Kolhapur
//       </div>
//     </div>
//   );
// });

import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_SIGNATURE } from './default_signature';
import {
  Affidavit, Marriage, BirthDeathCertificate,
  PropertyCard, ShopActLicense,
  TradeLicenseRecord, PanCardRecord, PassportRecord,
  VoterCardRecord, Gazette, WaterSupply, PropertyTax,
  PAPER_LABELS, AUTH_LABELS, CERT_TYPE_LABELS,
  SERVICE_TYPE_LABELS, WATER_SERVICE_TYPE_LABELS,
  PROPERTY_TAX_SERVICE_TYPE_LABELS,
} from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
//  SHOP INFO — update these to match your actual details
// ─────────────────────────────────────────────────────────────────────────────
const SHOP = {
  name: 'Gurav Online Services',
  tagline: 'Government Document Services',
  address: 'Shop No. 8, Chhatrapati Shivaji Market, Chhatrapati Shivaji Chowk, Kolhapur – 416 002',
  phone: '+91 911 201 9559, +91 8830 55 6049',
  timings: 'Mon – Fri: 9:30 AM – 7:00 PM',
};

// ─────────────────────────────────────────────────────────────────────────────
//  Group colours
// ─────────────────────────────────────────────────────────────────────────────
const GROUPS = {
  kmc: { label: 'KMC Services', color: '#dbeafe' },
  csc: { label: 'CSC Services', color: '#dcfce7' },
  aapleSarkar: { label: 'Aaple Sarkar Services', color: '#fef9c3' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function rNo(id: string = '', prefix: string) {
  return `${prefix}-${id.slice(-6).toUpperCase() || 'XXXXXX'}`;
}

function nowStr() {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

type Row = [string, string | number | null | undefined];

function fmtAmt(v: number | string) {
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Print CSS — injected inside each receipt so it works with react-to-print
// ─────────────────────────────────────────────────────────────────────────────
const PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');

@media print {
  @page { size: A4 portrait; margin: 6mm; }
  body > * { visibility: hidden !important; }
  .rpr, .rpr * { visibility: visible !important; }
  .rpr {
    position: fixed !important;
    inset: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-shadow: none !important;
    border: 3px solid #1a1a18 !important;
  }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function RHeader({
  title, group, receiptNum,
}: { title: string; group: typeof GROUPS[keyof typeof GROUPS]; receiptNum: string }) {
  return (
    <>
      {/* Light shop header */}
      <div style={{ background: '#ffffff', color: '#1a1a18', padding: '16px 20px', borderBottom: '3px solid #1a1a18' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            background: '#ffffff',
            border: '2px solid #1a1a18',
            borderRadius: 4,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src="/G.png" style={{ width: '85%', height: '85%', objectFit: 'contain' }} alt="Logo" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1a1a18' }}>
            {SHOP.name}
          </div>
        </div>
        {/* <div style={{ fontSize: 12, fontWeight: 800, fontFamily: '"Space Grotesk", sans-serif', color: '#4b5563', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {SHOP.tagline}
        </div> */}
        <div style={{ fontSize: 11, fontFamily: '"Space Grotesk", sans-serif', color: '#4b5563', marginTop: 10, lineHeight: 1.6, fontWeight: 600 }}>
          📍 {SHOP.address}<br />
          📞 {SHOP.phone}&nbsp;&nbsp;|&nbsp;&nbsp;🕐 {SHOP.timings}
        </div>
      </div>

      {/* Coloured service-group band */}
      <div style={{
        background: group.color,
        padding: '6px 20px',
        fontSize: 11,
        fontWeight: 800,
        fontFamily: '"Outfit", sans-serif',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#1a1a18',
        borderBottom: '3px solid #1a1a18',
      }}>
        {group.label}
      </div>

      {/* Receipt title + meta row */}
      <div style={{ padding: '12px 20px', borderBottom: '3px solid #1a1a18', background: '#faf9f6' }}>
        <div style={{ fontSize: 16, fontWeight: 900, fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a18' }}>
          {title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8, fontFamily: '"Space Grotesk", sans-serif' }}>
          <span style={{ fontSize: 11, color: '#1a1a18', fontWeight: 600 }}>
            Receipt No: <span style={{ display: 'inline-block', background: '#fff', border: '2px solid #1a1a18', borderRadius: 4, padding: '2px 8px', fontWeight: 800, fontSize: 10.5, boxShadow: '1.5px 1.5px 0 #1a1a18' }}>{receiptNum}</span>
          </span>
          <span style={{ fontSize: 11, color: '#374151', textAlign: 'right', fontWeight: 600 }}>
            Issued: {nowStr()}
          </span>
        </div>
      </div>
    </>
  );
}

function RTable({ rows }: { rows: Row[] }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', boxShadow: 'none', borderRadius: 0, overflow: 'visible' }}>
      <tbody>
        {visible.map(([k, v], i) => (
          <tr key={`${k}-${i}`} style={{ borderBottom: '2.5px solid #1a1a18' }}>
            <td style={{
              padding: '10px 20px',
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 11.5,
              fontWeight: 800,
              color: '#374151',
              width: '42%',
              background: '#fcfbf9',
              borderRight: '2.5px solid #1a1a18',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {k}
            </td>
            <td style={{
              padding: '10px 20px',
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 12.5,
              fontWeight: 800,
              color: '#1a1a18',
              wordBreak: 'break-word',
              background: '#ffffff',
            }}>
              {String(v ?? '')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RAmount({ amount, label = 'Amount Charged' }: { amount: number; label?: string }) {
  return (
    <div style={{ margin: '18px 20px', border: '3px solid #1a1a18', borderRadius: 8, overflow: 'hidden', boxShadow: '4px 4px 0 #1a1a18' }}>
      <div style={{
        background: '#ffdc58',
        padding: '6px 16px',
        fontSize: 10,
        fontWeight: 800,
        fontFamily: '"Outfit", sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#1a1a18',
        borderBottom: '3px solid #1a1a18',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#ffffff',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', color: '#1a1a18' }}>Total paid:</span>
        <span style={{ fontSize: 28, fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: '#1a1a18', letterSpacing: '-0.5px' }}>
          {fmtAmt(amount)}
        </span>
      </div>
    </div>
  );
}

function RFooter({ operator, signature }: { operator?: string; signature?: string }) {
  return (
    <div style={{ borderTop: '3px dashed #1a1a18', margin: '14px 20px 0', paddingTop: 14, paddingBottom: 18 }}>
      {operator && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          marginBottom: 16,
          padding: '0 8px',
          fontFamily: '"Space Grotesk", sans-serif'
        }}>
          {/* Signature block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* The real signature image */}
            <div style={{ height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: -4 }}>
              {signature ? (
                <img
                  src={signature}
                  style={{ height: '100%', objectFit: 'contain', transform: 'rotate(-2deg)' }}
                  alt="Signature"
                />
              ) : (
                <img
                  src={DEFAULT_SIGNATURE}
                  style={{ height: '100%', objectFit: 'contain', transform: 'rotate(-2deg)' }}
                  alt="Signature"
                />
              )}
            </div>
            <div style={{ width: 120, borderTop: '2px solid #1a1a18', marginTop: 2 }}></div>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
              Authorized Signatory
            </span>
          </div>
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 900, fontFamily: '"Outfit", sans-serif', color: '#1a1a18', textAlign: 'center', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Thank you for choosing {SHOP.name}!
      </div>
      <div style={{ fontSize: 10.5, fontFamily: '"Space Grotesk", sans-serif', color: '#4b5563', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>
        For queries: {SHOP.phone}
      </div>
      <div style={{ fontSize: 9, fontFamily: '"Space Grotesk", sans-serif', color: '#9ca3af', textAlign: 'center', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
        This is a system-generated receipt.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Receipt shell — wraps everything; all individual receipts use this
// ─────────────────────────────────────────────────────────────────────────────
interface ShellProps {
  title: string;
  group: typeof GROUPS[keyof typeof GROUPS];
  receiptNum: string;
  rows: Row[];
  amount: number;
  amtLabel?: string;
  operator?: string;
  signature?: string;
  extra?: ReactNode;   // for multi-section receipts (e.g. TradeLicense fee breakdown)
}

const Shell = forwardRef<HTMLDivElement, ShellProps>(({
  title, group, receiptNum, rows, amount, amtLabel, operator, signature, extra,
}, ref) => (
  <div
    ref={ref}
    className="rpr"
    style={{
      width: '100%',
      maxWidth: '148mm',
      background: '#ffffff',
      boxSizing: 'border-box',
      border: '3px solid #1a1a18',
      boxShadow: '5px 5px 0 #1a1a18',
      overflow: 'hidden',
      margin: '0 auto',
      fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}
  >
    <style>{PRINT_CSS}</style>
    <RHeader title={title} group={group} receiptNum={receiptNum} />
    <RTable rows={rows} />
    {extra}
    <RAmount amount={amount} label={amtLabel} />
    <RFooter operator={operator} signature={signature} />
  </div>
));

// ─────────────────────────────────────────────────────────────────────────────
//  1. Affidavit / Notary
// ─────────────────────────────────────────────────────────────────────────────
export const AffidavitReceipt = forwardRef<HTMLDivElement, { record: Affidavit }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Affidavit / Notary Receipt"
    group={GROUPS.aapleSarkar}
    receiptNum={rNo(record.id, 'AFF')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Purpose', record.purpose],
      ['Paper Type', PAPER_LABELS[record.paperType]],
      ['Authorized By', AUTH_LABELS[record.authorizerType]],
      ['Authorizer Name', record.authorizerName ?? null],
      ['Remark', record.remark ?? null],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  2. Marriage Registration
// ─────────────────────────────────────────────────────────────────────────────
export const MarriageReceipt = forwardRef<HTMLDivElement, { record: Marriage }>(({ record }, ref) => {
  const payments = record.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const amountCharged = Number(record.amountCharged);
  const balance = amountCharged - totalPaid;
  const hasPayments = payments.length > 0;

  return (
    <Shell
      ref={ref}
      title="Marriage Registration Receipt"
      group={GROUPS.kmc}
      receiptNum={rNo(record.id, 'MAR')}
      rows={[
        ['Date of Service', record.dateOfService],
        ['Contact Name', record.contactName],
        ['Primary Contact', record.isPrimaryContactSpouse ?? true
          ? `One of the Spouses (${record.primaryContactSpouseType === 'wife' ? 'Wife' : 'Husband'})`
          : 'Someone who came to enquire for Spouses'
        ],
        ['Mobile Number', record.phone],
        ['Husband', record.spouse1Name],
        ['Wife', record.spouse2Name],
        ['Marriage Act', record.marriageAct],
        ['Date of Marriage', record.marriageDate],
        ['Place', record.marriagePlace ?? null],
        ['Services Provided', record.servicesProvided?.join(', ') || null],
        ['Linked Affidavits', record.affidavits && record.affidavits.length > 0
          ? record.affidavits.map(a => `${a.customerName} (₹${Number(a.amountCharged)})`).join(', ')
          : null,
        ],
      ]}
      amount={hasPayments ? totalPaid : amountCharged}
      amtLabel={hasPayments ? 'Total Paid So Far' : 'Amount Charged'}
      extra={hasPayments ? (
        <div style={{ margin: '14px 20px 0', border: '3.5px solid #1a1a18', borderRadius: 8, overflow: 'hidden', boxShadow: '4px 4px 0 #1a1a18', fontFamily: '"Space Grotesk", sans-serif' }}>
          <div style={{ background: '#ffdc58', padding: '6px 16px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1a1a18', borderBottom: '3.5px solid #1a1a18' }}>
            Payment Summary
          </div>
          <div style={{ background: '#ffffff', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#374151' }}>Total Amount Charged:</span>
              <span>₹{amountCharged.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a18', paddingTop: '6px' }}>
              <span style={{ color: '#374151' }}>Total Amount Paid:</span>
              <span style={{ color: '#15803d' }}>₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a18', paddingTop: '6px' }}>
              <span style={{ color: '#374151' }}>Balance Remaining:</span>
              <span style={{ color: balance <= 0 ? '#15803d' : '#b91c1c' }}>₹{balance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      ) : undefined}
      operator={record.createdBy?.name}
      signature={record.createdBy?.signature}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. Birth / Death Certificate
// ─────────────────────────────────────────────────────────────────────────────
export const BirthDeathReceipt = forwardRef<HTMLDivElement, { record: BirthDeathCertificate }>(({ record }, ref) => {
  const isBirth = record.certificateType === 'Birth';
  return (
    <Shell
      ref={ref}
      title={`${isBirth ? 'Birth' : 'Death'} Certificate Receipt`}
      group={GROUPS.kmc}
      receiptNum={rNo(record.id, isBirth ? 'BIR' : 'DTH')}
      rows={[
        ['Date of Service', record.dateOfService],
        ['Certificate Type', CERT_TYPE_LABELS[record.certificateType]],
        ['Applicant Name', record.customerName],
        ['Mobile Number', record.phone],
        [isBirth ? 'Baby / Child Name' : 'Deceased Name', record.personName],
        [isBirth ? 'Date of Birth' : 'Date of Death', record.eventDate],
        ['Number of Copies', String(record.numberOfCopies)],
      ]}
      amount={Number(record.amountCharged)}
      operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. Property Card
// ─────────────────────────────────────────────────────────────────────────────
export const PropertyCardReceipt = forwardRef<HTMLDivElement, { record: PropertyCard }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title={`${record.recordType} Receipt`}
    group={GROUPS.aapleSarkar}
    receiptNum={rNo(record.id, 'PRP')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Record Type', record.recordType],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Property No.', record.propertyNumber],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  5. Shop Act License
// ─────────────────────────────────────────────────────────────────────────────
export const ShopActLicenseReceipt = forwardRef<HTMLDivElement, { record: ShopActLicense }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Shop Act License Receipt"
    group={GROUPS.aapleSarkar}
    receiptNum={rNo(record.id, 'SAL')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Business Name', record.businessName],
      ['Email', record.email ?? null],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  6. Trade License
// ─────────────────────────────────────────────────────────────────────────────
export const TradeLicenseReceipt = forwardRef<HTMLDivElement, { record: TradeLicenseRecord }>(({ record }, ref) => {
  const d = record.details || {};

  const serviceRows = (): Row[] => {
    switch (record.serviceType) {
      case 'New': {
        const partners = d.partners || record.business?.customers || [];
        return [
          ['Trade Type', record.business?.tradeType ?? null],
          ['Trade Subtype', record.business?.tradeSubtype ?? null],
          ['Partners', partners.length > 0
            ? partners.map((p: any) => `${p.name} (${p.phone})`).join(', ')
            : null],
          ['Status', d.status || record.business?.status || 'Pending'],
        ];
      }
      case 'Renew':
        return [['Renewed for Year', String(new Date().getFullYear())]];
      case 'Transfer_Heir':
      case 'Transfer_Third_Party':
        return [
          ['Transfer To', `${d.transferToName || '—'} (${d.transferToPhone || '—'})`],
          ['Relationship', d.relationship ?? null],
        ];
      case 'Name_Change':
        return [['New Business Name', d.newBusinessName ?? null]];
      case 'Trade_Change':
        return [
          ['New Trade Type', d.newTradeType ?? null],
          ['New Trade Subtype', d.newTradeSubtype ?? null],
        ];
      case 'Partner_Change': {
        const np = d.newPartners || [];
        return [['New Partners', np.length > 0
          ? np.map((p: any) => `${p.name} (${p.phone})`).join(', ')
          : null]];
      }
      default:
        return [];
    }
  };

  const feeRows: Row[] = [
    ['Official Fee', fmtAmt(record.officialFee || 0)],
    ['Service Fee', fmtAmt(record.serviceFee || 0)],
    ...(record.protocolFee ? [['Protocol Fee', fmtAmt(record.protocolFee)] as Row] : []),
    ...(record.miscFee ? [['Misc. Fee', fmtAmt(record.miscFee)] as Row] : []),
  ];

  return (
    <Shell
      ref={ref}
      title="Trade License Receipt"
      group={GROUPS.kmc}
      receiptNum={rNo(record.id, 'TRL')}
      rows={[
        ['Date of Service', record.dateOfService],
        ['Service Type', SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
        ['Business Name', record.business?.name ?? null],
        ['License Number', record.business?.licenseNo ?? null],
        ['Token Number', record.tokenNo ?? null],
        ...serviceRows(),
        ...(record.linkedAffidavit
          ? [['Linked Affidavit', `${record.linkedAffidavit.customerName} (${record.linkedAffidavit.purpose})`] as Row]
          : []),
        ...(record.linkedPropertyCard
          ? [['Linked Property Card', `Prop No: ${record.linkedPropertyCard.propertyNumber} (${record.linkedPropertyCard.recordType})`] as Row]
          : []),
        ...(record.linkedShopAct
          ? [['Linked Shop Act', `${record.linkedShopAct.businessName} (Owner: ${record.linkedShopAct.customerName})`] as Row]
          : []),
      ]}
      amount={Number(record.amountCharged)}
      extra={
        <div style={{ borderTop: '3px solid #1a1a18' }}>
          <div style={{
            background: '#e0f2fe',
            padding: '6px 20px',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: '"Outfit", sans-serif',
            color: '#1a1a18',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '2.5px solid #1a1a18'
          }}>
            Fee Breakdown
          </div>
          <RTable rows={feeRows} />
        </div>
      }
      operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. PAN Card
// ─────────────────────────────────────────────────────────────────────────────
export const PanCardReceipt = forwardRef<HTMLDivElement, { record: PanCardRecord }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="PAN Card Receipt"
    group={GROUPS.csc}
    receiptNum={rNo(record.id, 'PAN')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Application Type', record.applicationType],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Acknowledgement No.', record.ackNo ?? null],
      ['Official Fee', fmtAmt(record.officialFee || 0)],
      ['Service Fee', fmtAmt(record.serviceFee || 0)],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  8. Passport
// ─────────────────────────────────────────────────────────────────────────────
export const PassportReceipt = forwardRef<HTMLDivElement, { record: PassportRecord }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Passport Receipt"
    group={GROUPS.csc}
    receiptNum={rNo(record.id, 'PSP')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Application Type', record.applicationType],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['File Number', record.fileNo ?? null],
      ['Appointment Date', record.appointmentDate ?? null],
      ['Official Fee', fmtAmt(record.officialFee || 0)],
      ['Service Fee', fmtAmt(record.serviceFee || 0)],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  9. Voter Card
// ─────────────────────────────────────────────────────────────────────────────
export const VoterCardReceipt = forwardRef<HTMLDivElement, { record: VoterCardRecord }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Voter Card Receipt"
    group={GROUPS.aapleSarkar}
    receiptNum={rNo(record.id, 'VTR')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Application Type', record.applicationType],
      ['Customer Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Token Number', record.applicationType === 'New' ? (record.tokenNo ?? null) : null],
      ['EPIC Number', record.applicationType !== 'New' ? (record.epicNo ?? null) : null],
      ['Official Fee', fmtAmt(record.officialFee || 0)],
      ['Service Fee', fmtAmt(record.serviceFee || 0)],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  10. Gazette Name Change
// ─────────────────────────────────────────────────────────────────────────────
export const GazetteReceipt = forwardRef<HTMLDivElement, { record: Gazette }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Gazette Name Change Receipt"
    group={GROUPS.aapleSarkar}
    receiptNum={rNo(record.id, 'GAZ')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Token Number', (record as any).tokenNo ?? null],
      ['Applicant Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Old Name', record.oldName],
      ['New Name', record.newName],
      ['Reason to Change', record.reasonToChangeName],
      ['Official Fee', fmtAmt(record.officialFee || 0)],
      ['Service Fee', fmtAmt(record.serviceFee || 0)],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));

// ─────────────────────────────────────────────────────────────────────────────
//  11. Water Supply
// ─────────────────────────────────────────────────────────────────────────────
export const WaterSupplyReceipt = forwardRef<HTMLDivElement, { record: WaterSupply }>(({ record }, ref) => {
  const specificRows = (): Row[] => {
    switch (record.serviceType) {
      case 'NewConnection':
        return [
          ['Plumber Name', record.plumberName ?? null],
          ['Plumber Phone', record.plumberPhone ?? null],
          ['Contact Person', record.contactPersonName ?? null],
          ['Contact Phone', record.contactPersonPhone ?? null],
        ];
      case 'ConnectionTransfer':
        return [
          ['Connection No.', record.connectionNo ?? null],
          ['Transfer Type', record.transferSubtype ?? null],
          ['Current Owner', record.currentOwner ?? null],
          ['New Owner Name', record.newOwnerName ?? null],
          ['New Owner Phone', record.newOwnerPhone ?? null],
        ];
      case 'ChangeOfUse':
        return [
          ['Connection No.', record.connectionNo ?? null],
          ['Current Usage', record.currentUsage ?? null],
          ['New Usage', record.newUsage ?? null],
        ];
      default:
        return [['Connection No.', record.connectionNo ?? null]];
    }
  };

  return (
    <Shell
      ref={ref}
      title="Water Supply Service Receipt"
      group={GROUPS.kmc}
      receiptNum={rNo(record.id, 'WTR')}
      rows={[
        ['Date of Service', record.dateOfService],
        ['Service Name', WATER_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
        ['Applicant Name', record.customerName],
        ['Mobile Number', record.phone],
        ['Connection Address', record.connectionAddress],
        ['Token Number', record.applicationTokenNo],
        ['Application Date', record.applicationDate],
        ...specificRows(),
        ['Official Fee', fmtAmt(record.officialFee || 0)],
        ['Service Fee', fmtAmt(record.serviceFee || 0)],
      ]}
      amount={Number(record.amountCharged)}
      operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
//  12. Property Tax
// ─────────────────────────────────────────────────────────────────────────────
export const PropertyTaxReceipt = forwardRef<HTMLDivElement, { record: PropertyTax }>(({ record }, ref) => (
  <Shell
    ref={ref}
    title="Property Tax Receipt"
    group={GROUPS.kmc}
    receiptNum={rNo(record.id, 'PTX')}
    rows={[
      ['Date of Service', record.dateOfService],
      ['Service Name', PROPERTY_TAX_SERVICE_TYPE_LABELS[record.serviceType] || record.serviceType],
      ['Applicant Name', record.customerName],
      ['Mobile Number', record.phone],
      ['Address', record.address],
      ['Property Tax No.', record.propertyTaxNo],
      ['Official Fee', fmtAmt(record.officialFee || 0)],
      ['Service Fee', fmtAmt(record.serviceFee || 0)],
      ['Protocol Fee', fmtAmt(record.protocolFee || 0)],
    ]}
    amount={Number(record.amountCharged)}
    operator={record.createdBy?.name}
    signature={record.createdBy?.signature}
  />
));
