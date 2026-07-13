import { Affidavit, PanCardRecord } from '@/types';
import { affidavitsApi, panCardsApi } from '@/api';
import { AffidavitReceipt, PanCardReceipt } from '@/components/ReceiptModal/Receipt';
import NewRecordForm from '@/components/Affidavits/components/NewRecordForm';
import PanCardForm from '@/components/PanCards/components/PanCardForm';
import type { ServiceCrudPageConfig } from '@/components/ServiceCrudPage';

export const affidavitConfig: ServiceCrudPageConfig<Affidavit> = {
  title: 'Affidavit / Notary',
  queryKey: 'affidavits',
  receiptType: 'affidavit',
  receiptTypeName: 'Affidavit / Notary',
  api: {
    create: (data) => affidavitsApi.create(data),
  },
  receiptComponent: AffidavitReceipt,
  formComponent: NewRecordForm,
  getDescription: (record) => `Affidavit - ${record.purpose}`,
};

export const panCardConfig: ServiceCrudPageConfig<PanCardRecord> = {
  title: 'PAN Card Application',
  queryKey: 'pan-cards',
  receiptType: 'pan-card',
  receiptTypeName: 'PAN Card',
  api: {
    create: (data) => panCardsApi.create(data),
  },
  receiptComponent: PanCardReceipt,
  formComponent: PanCardForm,
  getDescription: (record) => `PAN Card - ${record.applicationType}`,
};
