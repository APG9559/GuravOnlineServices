export interface ReferenceItem {
  serviceType: string;
  applicationNo: string;
  customerName: string;
  status: string;
  applicationDate: string;
  contactName: string;
  contactPhone: string;
  contactAddress?: string;
  dateOfService: string;
}

export interface ReferenceProvider {
  getReferences(): Promise<ReferenceItem[]>;
}

export interface GroupedReference {
  phone: string;
  name: string;
  address?: string;
  referredCount: number;
  records: ReferenceItem[];
}
