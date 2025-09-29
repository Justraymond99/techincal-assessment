import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'finances',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Initialize database tables
export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
        description TEXT,
        date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create capital table (single row)
    await client.query(`
      CREATE TABLE IF NOT EXISTS capital (
        id SERIAL PRIMARY KEY,
        value DECIMAL(10,2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert initial capital if not exists
    await client.query(`
      INSERT INTO capital (value) 
      SELECT 0 
      WHERE NOT EXISTS (SELECT 1 FROM capital)
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export { pool };