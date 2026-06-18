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

  console.log('--- LATEST MARRIAGES ---');
  const marRes = await client.query('SELECT id, "contactName", "spouse1Name", "spouse2Name", "phone" FROM marriages ORDER BY "createdAt" DESC LIMIT 5;');
  console.log(JSON.stringify(marRes.rows, null, 2));

  console.log('--- LATEST TICKETS ---');
  const tktRes = await client.query('SELECT id, "ticketNumber", "contactName", status, "marriage_id", "questionnaireData" FROM marriage_tickets ORDER BY "createdAt" DESC LIMIT 5;');
  console.log(JSON.stringify(tktRes.rows, null, 2));

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
