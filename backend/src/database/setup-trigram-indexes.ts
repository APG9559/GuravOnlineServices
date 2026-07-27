import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('SetupTrigramIndexes');

export async function setupTrigramIndexes(dataSource: DataSource): Promise<void> {
  try {
    const queryRunner = dataSource.createQueryRunner();

    // 1. Enable pg_trgm extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Helper to safely create GIN trigram index
    const createTrigramIndex = async (tableName: string, indexName: string, columnName: string) => {
      try {
        const tableExists = await queryRunner.hasTable(tableName);
        if (!tableExists) return;

        await queryRunner.query(
          `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" USING gin (LOWER("${columnName}") gin_trgm_ops);`
        );
      } catch (err: any) {
        logger.warn(`Could not create trigram index ${indexName} on ${tableName}.${columnName}: ${err?.message || err}`);
      }
    };

    // 2. Create trigram indexes on key search columns
    await createTrigramIndex('affidavits', 'idx_affidavits_customer_name_trgm', 'customerName');
    await createTrigramIndex('affidavits', 'idx_affidavits_phone_trgm', 'phone');
    await createTrigramIndex('affidavits', 'idx_affidavits_purpose_trgm', 'purpose');

    await createTrigramIndex('marriages', 'idx_marriages_contact_name_trgm', 'contactName');
    await createTrigramIndex('marriages', 'idx_marriages_phone_trgm', 'phone');
    await createTrigramIndex('marriages', 'idx_marriages_spouse1_trgm', 'spouse1Name');
    await createTrigramIndex('marriages', 'idx_marriages_spouse2_trgm', 'spouse2Name');

    await createTrigramIndex('customers', 'idx_customers_name_trgm', 'name');
    await createTrigramIndex('customers', 'idx_customers_phone_trgm', 'phone');
    await createTrigramIndex('customers', 'idx_customers_address_trgm', 'address');

    await createTrigramIndex('water_connections', 'idx_water_conn_owner_trgm', 'currentOwner');
    await createTrigramIndex('water_connections', 'idx_water_conn_no_trgm', 'connectionNo');
    await createTrigramIndex('water_connections', 'idx_water_conn_address_trgm', 'connectionAddress');

    await createTrigramIndex('shop_act_licenses', 'idx_shop_act_customer_name_trgm', 'customerName');
    await createTrigramIndex('shop_act_licenses', 'idx_shop_act_phone_trgm', 'phone');
    await createTrigramIndex('shop_act_licenses', 'idx_shop_act_business_name_trgm', 'businessName');

    await createTrigramIndex('property_cards', 'idx_property_cards_customer_name_trgm', 'customerName');
    await createTrigramIndex('property_cards', 'idx_property_cards_phone_trgm', 'phone');
    await createTrigramIndex('property_cards', 'idx_property_cards_property_number_trgm', 'propertyNumber');

    await createTrigramIndex('trade_license_records', 'idx_trade_records_token_no_trgm', 'tokenNo');
    await createTrigramIndex('businesses', 'idx_businesses_name_trgm', 'name');
    await createTrigramIndex('businesses', 'idx_businesses_license_no_trgm', 'licenseNo');

    await queryRunner.release();
    logger.log('✅ PostgreSQL pg_trgm GIN search indexes initialized successfully.');
  } catch (error: any) {
    logger.error('❌ Error setting up pg_trgm trigram indexes:', error?.stack || error);
  }
}
