import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { AffidavitsService } from '../affidavits/affidavits.service';
import { MarriagesService } from '../marriages/marriages.service';
import { BirthDeathCertificatesService } from '../birth-death-certificates/birth-death-certificates.service';
import { PropertyCardsService } from '../property-cards/property-cards.service';
import { ShopActLicensesService } from '../shop-act-licenses/shop-act-licenses.service';
import { TradeLicensesService } from '../trade-licenses/trade-licenses.service';
import { PanCardsService } from '../csc-services/pan-cards.service';
import { PassportsService } from '../csc-services/passports.service';
import { VoterCardsService } from '../csc-services/voter-cards.service';
import { GazettesService } from '../gazettes/gazettes.service';
import { WaterSupplyService } from '../water-supply/water-supply.service';
import { PropertyTaxService } from '../property-tax/property-tax.service';
import { ICustomerHistoryProvider } from '../common/interfaces/customer-history.interface';

@Injectable()
export class CustomerHistoryService {
  private readonly historyProviders: ICustomerHistoryProvider[];

  constructor(
    private readonly customersService: CustomersService,
    affidavitsService: AffidavitsService,
    marriagesService: MarriagesService,
    birthDeathCertificatesService: BirthDeathCertificatesService,
    propertyCardsService: PropertyCardsService,
    shopActLicensesService: ShopActLicensesService,
    tradeLicensesService: TradeLicensesService,
    panCardsService: PanCardsService,
    passportsService: PassportsService,
    voterCardsService: VoterCardsService,
    gazettesService: GazettesService,
    waterSupplyService: WaterSupplyService,
    propertyTaxService: PropertyTaxService,
  ) {
    this.historyProviders = [
      affidavitsService,
      marriagesService,
      birthDeathCertificatesService,
      propertyCardsService,
      shopActLicensesService,
      tradeLicensesService,
      panCardsService,
      passportsService,
      voterCardsService,
      gazettesService,
      waterSupplyService,
      propertyTaxService,
    ];
  }

  async getCustomerDetails(id: string) {
    const customer = await this.customersService.findOne(id);

    // Fetch all service records linked to this customer via providers
    const providerResults = await Promise.all(
      this.historyProviders.map(p => p.getCustomerHistory(id)),
    );

    const services = providerResults.flat();

    // Sort services by dateOfService descending, falling back to createdAt
    services.sort((a, b) => {
      const dateDiff = new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      ...customer,
      services,
    };
  }
}
