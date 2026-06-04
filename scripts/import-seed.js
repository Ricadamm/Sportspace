const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. Manually parse .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found at', envPath);
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      env[match[1]] = value;
    }
  });
  return env;
}

const DATABASES_TO_RESET = [
  'sportspace',
  'sportspace_greenfield',
  'sportspace_padel_arena',
  'sportspace_nusantara',
  'sportspace_bintang',
  'sportspace_raja_padel',
  'sportspace_elang',
  'sportspace_metro_tennis',
  'sportspace_sunrise',
  'sportspace_pro_badminton',
  'sportspace_champion',
  'sportspace_gopay',
  'sportspace_bca',
  'sportspace_finance'
];

async function main() {
  const env = loadEnv();
  
  const host = env.DB_HOST || 'localhost';
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const port = parseInt(env.DB_PORT || '3306');
  
  // Locate the schema.sql file
  const schemaPath = path.join(__dirname, '../../Sportspace/database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema.sql file not found at', schemaPath);
    process.exit(1);
  }
  
  console.log(`Reading SQL schema from ${schemaPath}...`);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });
    
    console.log('Connected! Cleaning up any existing SportSpace databases...');
    for (const db of DATABASES_TO_RESET) {
      await connection.query(`DROP DATABASE IF EXISTS ${db}`);
    }
    
    console.log('Database cleanup complete. Running schema/seed import...');
    await connection.query(sql);
    console.log('🎉 Database, tables, and seed data imported successfully!');
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    console.error('Please verify that your MySQL server is running and the credentials in .env.local are correct.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
