export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerServiceUsage {
  id: string;
  type:
    | "affidavit"
    | "marriage"
    | "birth-death"
    | "property-card"
    | "shop-act"
    | "gazette"
    | "trade-license"
    | "pan-card"
    | "passport"
    | "voter-card"
    | "water-supply"
    | "property-tax";
  typeName: string;
  dateOfService: string;
  amountCharged: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  services: CustomerServiceUsage[];
}
