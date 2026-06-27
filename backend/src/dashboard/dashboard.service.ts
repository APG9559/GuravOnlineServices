import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingSetting } from '../settings/pricing-setting.entity';
import { IDashboardMetrics, DASHBOARD_METRICS_PROVIDER } from '../common/interfaces/service-metrics.interface';

@Injectable()
export class DashboardService {
  private cache = new Map<string, { timestamp: number; data: any }>();
  private readonly CACHE_TTL_MS = 15000; // 15 seconds cache

  constructor(
    @InjectRepository(PricingSetting)
    private readonly pricingRepo: Repository<PricingSetting>,
    @Inject(DASHBOARD_METRICS_PROVIDER)
    private readonly providers: IDashboardMetrics[],
  ) {}

  async getSummary(from?: string, to?: string) {
    const todayObj = new Date();
    const startYear = todayObj.getFullYear();
    const startMonth = String(todayObj.getMonth() + 1).padStart(2, '0');
    const defaultFrom = `${startYear}-${startMonth}-01`;
    const lastDay = new Date(startYear, todayObj.getMonth() + 1, 0).getDate();
    const defaultTo = `${startYear}-${startMonth}-${String(lastDay).padStart(2, '0')}`;

    const actualFrom = from || defaultFrom;
    const actualTo = to || defaultTo;

    const cacheKey = `${actualFrom}_${actualTo}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return cached.data;
    }

    console.time(`Dashboard Query Execution [${actualFrom} to ${actualTo}]`);

    const pricingList = await this.pricingRepo.find();
    const pricing = pricingList.reduce((acc, r) => {
      acc[r.key] = Number(r.value);
      return acc;
    }, {} as Record<string, number>);

    // Fetch metrics from all providers
    const providerResults = await Promise.all(
      this.providers.map((p) => p.getDashboardMetrics(actualFrom, actualTo, pricing)),
    );

    // Initialize aggregates
    let totalEarnings = 0;
    let totalNetEarnings = 0;
    let totalExpenses = 0;

    const modules: any = {
      kmc: { label: 'KMC Services', grossEarnings: 0, netEarnings: 0, count: 0, subServices: {} },
      csc: { label: 'CSC Services', grossEarnings: 0, netEarnings: 0, count: 0, subServices: {} },
      aapleSarkar: { label: 'Aaple Sarkar Services', grossEarnings: 0, netEarnings: 0, count: 0, subServices: {} },
    };

    const countByService: Record<string, number> = {};
    const earningsByService: Record<string, number> = {};
    const netEarningsByService: Record<string, number> = {};

    const breakdown: any = {
      byAct: {},
      byAuthorizer: {},
      byPaper: {},
      byType: {},
      byCardType: {},
    };

    for (const res of providerResults) {
      if (res.isExpense) {
        totalExpenses += res.net;
        continue;
      }

      totalEarnings += res.gross;
      totalNetEarnings += res.net;

      countByService[res.key] = res.count;
      earningsByService[res.key] = res.gross;
      netEarningsByService[res.key] = res.net;

      const categoryKey = res.category === 'KMC' ? 'kmc' : res.category === 'CSC' ? 'csc' : 'aapleSarkar';
      const mod = modules[categoryKey];
      if (mod) {
        mod.count += res.count;
        mod.grossEarnings += res.gross;
        mod.netEarnings += res.net;
        mod.subServices[res.key] = {
          label: res.label,
          grossEarnings: res.gross,
          netEarnings: res.net,
          count: res.count,
        };
      }

      if (res.extra) {
        if (res.key === 'marriages' && res.extra.byAct) {
          for (const item of res.extra.byAct) {
            if (item.marriageAct) breakdown.byAct[item.marriageAct] = Number(item.count || 0);
          }
        }
        if (res.key === 'affidavits') {
          if (res.extra.byAuthorizer) {
            for (const item of res.extra.byAuthorizer) {
              if (item.authorizerType) breakdown.byAuthorizer[item.authorizerType] = Number(item.count || 0);
            }
          }
          if (res.extra.byPaper) {
            for (const item of res.extra.byPaper) {
              if (item.paperType) breakdown.byPaper[item.paperType] = Number(item.count || 0);
            }
          }
        }
        if (res.key === 'birthDeath' && res.extra.byType) {
          for (const item of res.extra.byType) {
            if (item.certificateType) breakdown.byType[item.certificateType] = Number(item.count || 0);
          }
        }
        if (res.key === 'propertyCards' && res.extra.byCardType) {
          for (const item of res.extra.byCardType) {
            if (item.recordType) breakdown.byCardType[item.recordType] = Number(item.count || 0);
          }
        }
      }
    }

    totalNetEarnings -= totalExpenses;

    // Calculate daily earnings series
    const dailyMap: Record<string, any> = {};
    const dates: string[] = [];
    const current = new Date(actualFrom);
    const end = new Date(actualTo);
    let safetyCounter = 0;

    while (current <= end && safetyCounter < 366) {
      safetyCounter++;
      const dStr = current.toISOString().split('T')[0];
      dates.push(dStr);
      dailyMap[dStr] = {
        date: dStr,
        affidavits: 0,
        marriages: 0,
        birthDeath: 0,
        propertyCards: 0,
        shopAct: 0,
        tradeLicenses: 0,
        panCards: 0,
        passports: 0,
        voterCards: 0,
        gazettes: 0,
        waterSupply: 0,
        propertyTax: 0,
        kmc: 0,
        csc: 0,
        aapleSarkar: 0,
        total: 0,
        expenses: 0,
      };
      current.setDate(current.getDate() + 1);
    }

    const addDailyNet = (rows: any[], serviceKey: string, isExpense = false) => {
      for (const r of rows) {
        if (!r.date) continue;
        const dateStr = r.date instanceof Date ? r.date.toISOString() : String(r.date);
        const normalizedDate = dateStr.split('T')[0];
        if (dailyMap[normalizedDate]) {
          const val = Number(r.net || r.amount || 0);
          if (isExpense) {
            dailyMap[normalizedDate].expenses += val;
          } else {
            dailyMap[normalizedDate][serviceKey] += val;
          }
        }
      }
    };

    for (const res of providerResults) {
      addDailyNet(res.daily, res.key, res.isExpense);
    }

    for (const dStr of dates) {
      const pt = dailyMap[dStr];
      pt.kmc = pt.marriages + pt.birthDeath + pt.tradeLicenses + pt.waterSupply + pt.propertyTax;
      pt.csc = pt.panCards + pt.passports;
      pt.aapleSarkar = pt.affidavits + pt.propertyCards + pt.shopAct + pt.gazettes + pt.voterCards;
      pt.total = pt.kmc + pt.csc + pt.aapleSarkar - pt.expenses;
    }

    // User breakdown
    const userBreakdowns: Record<string, { userId: string; userName: string; gross: number; net: number; expenses: number }> = {};

    const addUserStats = (rows: any[], isExpense = false) => {
      for (const r of rows) {
        const id = r.userId || 'unknown';
        const name = r.userName || 'Unknown User';
        if (!userBreakdowns[id]) {
          userBreakdowns[id] = { userId: id, userName: name, gross: 0, net: 0, expenses: 0 };
        }
        const grossVal = Number(r.gross || 0);
        const netVal = Number(r.net || 0);
        const expenseVal = Number(r.expenses || r.net || 0);
        if (isExpense) {
          userBreakdowns[id].expenses += expenseVal;
          userBreakdowns[id].net -= expenseVal;
        } else {
          userBreakdowns[id].gross += grossVal;
          userBreakdowns[id].net += netVal;
        }
      }
    };

    for (const res of providerResults) {
      addUserStats(res.userBreakdown, res.isExpense);
    }

    const userBreakdownList = Object.values(userBreakdowns);
    const dailyEarnings = dates.map((dStr) => dailyMap[dStr]);

    const result = {
      fromDate: actualFrom,
      toDate: actualTo,
      affidavitCount: countByService.affidavits || 0,
      marriageCount: countByService.marriages || 0,
      birthDeathCount: countByService.birthDeath || 0,
      propertyCardCount: countByService.propertyCards || 0,
      shopActLicenseCount: countByService.shopAct || 0,
      tradeLicenseCount: countByService.tradeLicenses || 0,
      panCardCount: countByService.panCards || 0,
      passportCount: countByService.passports || 0,
      voterCardCount: countByService.voterCards || 0,
      gazetteCount: countByService.gazettes || 0,
      waterSupplyCount: countByService.waterSupply || 0,
      propertyTaxCount: countByService.propertyTax || 0,
      affidavitEarnings: earningsByService.affidavits || 0,
      affidavitGrossEarnings: earningsByService.affidavits || 0,
      affidavitNetEarnings: netEarningsByService.affidavits || 0,
      marriageEarnings: earningsByService.marriages || 0,
      birthDeathEarnings: earningsByService.birthDeath || 0,
      propertyCardEarnings: earningsByService.propertyCards || 0,
      shopActLicenseEarnings: earningsByService.shopAct || 0,
      tradeLicenseEarnings: earningsByService.tradeLicenses || 0,
      tradeLicenseNetEarnings: netEarningsByService.tradeLicenses || 0,
      panCardEarnings: earningsByService.panCards || 0,
      passportEarnings: earningsByService.passports || 0,
      voterCardEarnings: earningsByService.voterCards || 0,
      gazetteEarnings: earningsByService.gazettes || 0,
      gazetteNetEarnings: netEarningsByService.gazettes || 0,
      waterSupplyEarnings: earningsByService.waterSupply || 0,
      waterSupplyNetEarnings: netEarningsByService.waterSupply || 0,
      propertyTaxEarnings: earningsByService.propertyTax || 0,
      propertyTaxNetEarnings: netEarningsByService.propertyTax || 0,
      totalEarnings,
      totalNetEarnings,
      totalExpenses,
      modules,
      breakdown,
      dailyEarnings,
      userBreakdown: userBreakdownList,
    };

    console.timeEnd(`Dashboard Query Execution [${actualFrom} to ${actualTo}]`);
    this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }
}
