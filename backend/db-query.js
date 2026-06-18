const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'familystore',
});

async function main() {
  await client.connect();
  
  const aff = await client.query('SELECT "createdAt", "customerName", purpose FROM affidavits WHERE id=\'9aad9512-e566-4325-af28-e8fb69728448\';');
  console.log('Affidavit:', aff.rows[0]);

  const mar = await client.query('SELECT "createdAt", "contactName", "spouse1Name", "spouse2Name" FROM marriages WHERE id=\'2b577c86-93eb-44a3-8108-a6f65fb0c4b3\';');
  console.log('Marriage:', mar.rows[0]);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
