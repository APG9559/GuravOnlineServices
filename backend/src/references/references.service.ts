import { Injectable, Inject } from '@nestjs/common';
import { ReferenceItem, ReferenceProvider, GroupedReference } from './interfaces/reference-provider.interface';

@Injectable()
export class ReferencesService {
  constructor(
    @Inject('ReferenceProvider')
    private readonly providers: ReferenceProvider[],
  ) {}

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '').trim();
  }

  async findAll(query: { search?: string; page?: number; limit?: number }): Promise<{
    data: GroupedReference[];
    total: number;
    page: number;
    limit: number;
  }> {
    const search = query.search?.toLowerCase() || '';
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const offset = (page - 1) * limit;

    // 1. Gather all reference items from all registered providers
    let allItems: ReferenceItem[] = [];
    for (const provider of this.providers) {
      try {
        const providerItems = await provider.getReferences();
        allItems = allItems.concat(providerItems);
      } catch (err) {
        console.error('Error fetching references from provider:', err);
      }
    }

    // 2. Group by cleaned phone number
    const groupsMap = new Map<string, ReferenceItem[]>();
    for (const item of allItems) {
      if (!item.contactPhone) continue;
      const cleanPhone = this.cleanPhoneNumber(item.contactPhone);
      if (!cleanPhone) continue;

      if (!groupsMap.has(cleanPhone)) {
        groupsMap.set(cleanPhone, []);
      }
      groupsMap.get(cleanPhone)!.push(item);
    }

    // 3. Transform groups into GroupedReference objects
    let groupedList: GroupedReference[] = [];
    for (const [phone, records] of groupsMap.entries()) {
      // Sort records by date of service descending to get most recent details
      records.sort((a, b) => b.dateOfService.localeCompare(a.dateOfService));

      // Resolve contact name: try to find the longest name or most recent
      const contactName = records[0]?.contactName || 'Alternative Contact';
      // Find first non-empty address
      const contactAddress = records.find((r) => r.contactAddress && r.contactAddress.trim() !== '')?.contactAddress;

      groupedList.push({
        phone,
        name: contactName,
        address: contactAddress,
        referredCount: records.length,
        records,
      });
    }

    // 4. Apply search filter
    if (search) {
      groupedList = groupedList.filter(
        (ref) =>
          ref.name.toLowerCase().includes(search) ||
          ref.phone.toLowerCase().includes(search),
      );
    }

    // 5. Sort by referral count descending, then by name ascending
    groupedList.sort((a, b) => {
      if (b.referredCount !== a.referredCount) {
        return b.referredCount - a.referredCount;
      }
      return a.name.localeCompare(b.name);
    });

    const total = groupedList.length;
    const paginatedData = groupedList.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
    };
  }
}
export { GroupedReference };
