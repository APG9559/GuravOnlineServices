export interface CustomerHistoryItem {
  id: string;
  type: string;
  typeName: string;
  dateOfService: string;
  amountCharged: number;
  description: string;
  createdBy: string;
  createdAt: Date;
}

export interface ICustomerHistoryProvider {
  getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]>;
}

export const CUSTOMER_HISTORY_PROVIDER = 'CUSTOMER_HISTORY_PROVIDER';
