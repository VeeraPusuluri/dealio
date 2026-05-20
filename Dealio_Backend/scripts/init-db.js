/**
 * init-db.js
 * Connects to the default 'postgres' database on AlloyDB and creates
 * the 'dealio' database if it doesn't already exist.
 * Run this before `prisma db push`.
 */
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  // Parse host + credentials from DATABASE_URL, swap db to 'postgres'
  const url = new URL(dbUrl);
  url.pathname = '/postgres';
  // Remove Prisma-specific params that pg doesn't understand
  url.searchParams.delete('schema');

  const client = new Client({ connectionString: url.toString() });

  try {
    await client.connect();
    console.log('Connected to AlloyDB (postgres db)');

    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'dealio'`
    );

    if (res.rowCount === 0) {
      // CREATE DATABASE cannot run inside a transaction
      await client.query('CREATE DATABASE dealio');
      console.log('✅ Created database: dealio');
    } else {
      console.log('ℹ️  Database dealio already exists — skipping creation');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ init-db failed:', err.message);
  process.exit(1);
});
