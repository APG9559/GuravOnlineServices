import React from 'react';
import { SubTab, PaperType, AuthorizerType, CertificateType, RecordTypeBySubTab } from '@/types';
import {
  WATER_SERVICE_TYPE_LABELS,
  PAPER_LABELS,
  AUTH_LABELS,
  CERT_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  PROPERTY_TAX_SERVICE_TYPE_LABELS,
  WATER_TRANSFER_SUBTYPE_LABELS,
} from '@/constants';
import { formatDate } from '@/utils/format';

export interface ColumnConfig<T> {
  header: string;
  className?: string;
  style?: React.CSSProperties;
  render: (row: T, index: number) => React.ReactNode;
}

export type ColumnsMap = {
  [K in SubTab]: ColumnConfig<RecordTypeBySubTab<K>>[];
};

export const COLUMNS_MAP: ColumnsMap = {
  affidavits: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Purpose',
      render: (r) => (
        <div
          style={{
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <div>{r.purpose}</div>
          {r.affidavitNo && (
            <div
              style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}
              title={r.affidavitNo}
            >
              No: {r.affidavitNo}
            </div>
          )}
          {r.remark && (
            <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }} title={r.remark}>
              Remark: {r.remark}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Paper',
      render: (r) => (
        <span className="badge badge-blue">
          {r.paperType === 'stamp500' ? '₹500 Stamp' : 'Plain'}
        </span>
      ),
    },
    {
      header: 'Auth',
      render: (r) => (
        <span
          className={`badge ${r.authorizerType === 'magistrate' ? 'badge-green' : 'badge-amber'}`}
        >
          {r.authorizerType === 'magistrate' ? 'Magistrate' : 'Notary'}
        </span>
      ),
    },
  ],
  marriages: [
    { header: 'Contact', render: (r) => r.contactName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Spouses',
      render: (r) => (
        <span style={{ fontSize: 12 }}>
          {r.spouse1Name} &amp; {r.spouse2Name}
        </span>
      ),
    },
    {
      header: 'Act',
      render: (r) => (
        <span className="badge badge-blue" style={{ fontSize: 11 }}>
          {r.marriageAct === 'Hindu Marriage Act'
            ? 'Hindu'
            : r.marriageAct === 'Muslim Personal Law (Shariat)'
              ? 'Muslim'
              : 'Christian'}
        </span>
      ),
    },
  ],
  birthDeath: [
    {
      header: 'Type',
      render: (r) => (
        <span className={`badge ${r.certificateType === 'Birth' ? 'badge-green' : 'badge-amber'}`}>
          {r.certificateType}
        </span>
      ),
    },
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Person', render: (r) => r.personName },
    { header: 'Event Date', render: (r) => formatDate(r.eventDate) },
    { header: 'Copies', render: (r) => r.numberOfCopies, style: { textAlign: 'center' } },
  ],
  propertyCards: [
    { header: 'Type', render: (r) => <span className="badge badge-blue">{r.recordType}</span> },
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Property No.', render: (r) => r.propertyNumber },
  ],
  shopAct: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Business', render: (r) => r.businessName },
    {
      header: 'Email',
      render: (r) => r.email || '—',
      style: { color: 'var(--text-muted)', fontSize: 12 },
    },
  ],
  tradeLicenses: [
    {
      header: 'Service',
      render: (r) => (
        <span className="badge badge-blue">
          {SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
        </span>
      ),
    },
    { header: 'Business Name', render: (r) => r.business?.name || '—', style: { fontWeight: 500 } },
    {
      header: 'License No',
      render: (r) =>
        r.business?.licenseNo ? (
          <span className="badge badge-green" style={{ fontSize: 11 }}>
            {r.business.licenseNo}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        ),
    },
    { header: 'Phone', render: (r) => r.business?.phone || '—' },
    { header: 'Token', render: (r) => r.tokenNo || '—' },
  ],
  waterSupplies: [
    {
      header: 'Service Type',
      render: (r) => (
        <span className="badge badge-green">
          {WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
        </span>
      ),
    },
    {
      header: 'Customer Name',
      render: (r) => r.connection?.customer?.name || r.connection?.currentOwner || '—',
      style: { fontWeight: 500 },
    },
    { header: 'Phone', render: (r) => r.connection?.customer?.phone || r.connection?.contactPersonPhone || '—' },
    {
      header: 'Connection Address',
      render: (r) => r.connection?.connectionAddress || '—',
      style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    { header: 'Token', render: (r) => r.applicationTokenNo || '—' },
  ],
  propertyTaxes: [
    {
      header: 'Service Type',
      render: (r) => (
        <span className="badge badge-green">
          {PROPERTY_TAX_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType}
        </span>
      ),
    },
    { header: 'Customer Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Address',
      render: (r) => r.address,
      style: { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    },
    { header: 'Property Tax No.', render: (r) => r.propertyTaxNo },
  ],
  panCards: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Type',
      render: (r) => <span className="badge badge-blue">{r.applicationType}</span>,
    },
    { header: 'Ack No.', render: (r) => r.ackNo || '—' },
    {
      header: 'Official Fee',
      render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}`,
    },
    {
      header: 'Service Fee',
      render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}`,
    },
  ],
  passports: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Type',
      render: (r) => <span className="badge badge-blue">{r.applicationType}</span>,
    },
    { header: 'File No.', render: (r) => r.fileNo || '—' },
    { header: 'Appointment Date', render: (r) => formatDate(r.appointmentDate) },
    {
      header: 'Official Fee',
      render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}`,
    },
    {
      header: 'Service Fee',
      render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}`,
    },
  ],
  voterCards: [
    { header: 'Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    {
      header: 'Type',
      render: (r) => <span className="badge badge-blue">{r.applicationType}</span>,
    },
    {
      header: 'Token / EPIC No.',
      render: (r) =>
        r.applicationType === 'New' ? `Token: ${r.tokenNo || '—'}` : `EPIC: ${r.epicNo || '—'}`,
    },
    {
      header: 'Official Fee',
      render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}`,
    },
    {
      header: 'Service Fee',
      render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}`,
    },
  ],
  gazettes: [
    { header: 'Token No', render: (r) => r.tokenNo || '—', style: { fontWeight: 600 } },
    { header: 'Applicant Name', render: (r) => r.customerName, style: { fontWeight: 500 } },
    { header: 'Phone', render: (r) => r.phone },
    { header: 'Old Name', render: (r) => r.oldName },
    { header: 'New Name', render: (r) => r.newName },
    {
      header: 'Reason to Change',
      render: (r) => (
        <div
          style={{
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={r.reasonToChangeName}
        >
          {r.reasonToChangeName}
        </div>
      ),
    },
    {
      header: 'Official Fee',
      render: (r) => `₹${Number(r.officialFee || 0).toLocaleString('en-IN')}`,
    },
    {
      header: 'Service Fee',
      render: (r) => `₹${Number(r.serviceFee || 0).toLocaleString('en-IN')}`,
    },
  ],
};

export type ExportMappersMap = {
  [K in SubTab]: {
    sheetName: string;
    fileName: string;
    mapRow: (r: RecordTypeBySubTab<K>) => Record<string, unknown>;
  };
};

export const EXPORT_MAPPERS: ExportMappersMap = {
  affidavits: {
    sheetName: 'Affidavits',
    fileName: 'affidavits',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Purpose: r.purpose,
      'Affidavit No': r.affidavitNo || '',
      Paper: PAPER_LABELS[r.paperType as PaperType],
      Authorizer: AUTH_LABELS[r.authorizerType as AuthorizerType],
      'Auth Name': r.authorizerName || '',
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  marriages: {
    sheetName: 'Marriages',
    fileName: 'marriages',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Contact: r.contactName,
      Phone: r.phone,
      Spouse1: r.spouse1Name,
      Spouse2: r.spouse2Name,
      Act: r.marriageAct,
      MarriageDate: r.marriageDate,
      Services: (r.servicesProvided || []).join(', '),
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  birthDeath: {
    sheetName: 'BirthDeath',
    fileName: 'birth_death',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Type: CERT_TYPE_LABELS[r.certificateType as CertificateType],
      Name: r.customerName,
      Phone: r.phone,
      PersonName: r.personName,
      EventDate: r.eventDate,
      Copies: r.numberOfCopies,
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  propertyCards: {
    sheetName: 'PropertyCards',
    fileName: 'property_cards',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Type: r.recordType,
      PropertyNo: r.propertyNumber,
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  shopAct: {
    sheetName: 'ShopActLicenses',
    fileName: 'shop_act',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Business: r.businessName,
      Email: r.email || '',
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  tradeLicenses: {
    sheetName: 'TradeLicenses',
    fileName: 'trade_licenses',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Service: SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
      Business: r.business?.name || '—',
      LicenseNo: r.business?.licenseNo || '—',
      Phone: r.business?.phone || '—',
      TokenNo: r.tokenNo || '—',
      LicenseFee: r.licenseFee,
      FireFee: r.fireFee || 0,
      ServiceFee: r.serviceFee,
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  panCards: {
    sheetName: 'PanCards',
    fileName: 'pan_cards',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Type: r.applicationType,
      'Ack No': r.ackNo || '',
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  passports: {
    sheetName: 'Passports',
    fileName: 'passports',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Type: r.applicationType,
      'File No': r.fileNo || '',
      'Appointment Date': r.appointmentDate || '',
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  voterCards: {
    sheetName: 'VoterCards',
    fileName: 'voter_cards',
    mapRow: (r) => ({
      Date: r.dateOfService,
      Name: r.customerName,
      Phone: r.phone,
      Type: r.applicationType,
      'Token No': r.tokenNo || '',
      'EPIC No': r.epicNo || '',
      'Official Fee': r.officialFee,
      'Service Fee': r.serviceFee,
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  gazettes: {
    sheetName: 'Gazettes',
    fileName: 'gazettes',
    mapRow: (r) => ({
      Date: r.dateOfService,
      'Token No': r.tokenNo || '',
      Name: r.customerName,
      Phone: r.phone,
      'Old Name': r.oldName,
      'New Name': r.newName,
      Reason: r.reasonToChangeName,
      'Official Fee': r.officialFee,
      'Service Fee': r.serviceFee,
      Amount: r.amountCharged,
      By: r.createdBy?.name,
    }),
  },
  waterSupplies: {
    sheetName: 'WaterSupplies',
    fileName: 'water_supply',
    mapRow: (r) => {
      const details = (r.details || {}) as Record<string, unknown>;
      const conn = r.connection;
      const cust = conn?.customer;
      const transferSubtype = details.transferSubtype as string | undefined;
      return {
        Date: r.dateOfService,
        Name: cust?.name || conn?.currentOwner || '',
        Phone: cust?.phone || '',
        Type: WATER_SERVICE_TYPE_LABELS[r.serviceType] || r.serviceType,
        Address: conn?.connectionAddress || '',
        Token: r.applicationTokenNo || '',
        'App Date': r.applicationDate,
        'Plumber Name': (details.plumberName as string) || '',
        'Plumber Phone': (details.plumberPhone as string) || '',
        'Contact Name': conn?.contactPersonName || (details.contactPersonName as string) || '',
        'Contact Phone': conn?.contactPersonPhone || (details.contactPersonPhone as string) || '',
        'Connection No': conn?.connectionNo || '',
        'Current Owner': conn?.currentOwner || (details.currentOwner as string) || '',
        'New Owner Name': (details.newOwnerName as string) || '',
        'New Owner Phone': (details.newOwnerPhone as string) || '',
        'Transfer Subtype': transferSubtype
          ? WATER_TRANSFER_SUBTYPE_LABELS[transferSubtype] || transferSubtype
          : '',
        'Current Usage': conn?.currentUsage || (details.currentUsage as string) || '',
        'New Usage': (details.newUsage as string) || '',
        'Official Fee': r.officialFee,
        'Service Fee': r.serviceFee,
        Amount: r.amountCharged,
        By: r.createdBy?.name,
      };
    },
  },
  propertyTaxes: {
    sheetName: 'PropertyTaxes',
    fileName: 'property_tax',
    mapRow: (r) => ({
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
      By: r.createdBy?.name,
    }),
  },
};
