import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

// Use a free cloud PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/finances',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
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

    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Database init error:', error);
  } finally {
    client.release();
  }
}

// Helper to update capital
async function updateCapital() {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'income' THEN amount 
          WHEN type = 'expense' THEN -amount 
          ELSE 0 
        END
      ), 0) as total
      FROM transactions
    `);
    
    const capital = parseFloat(result.rows[0].total);
    
    await pool.query(`
      UPDATE capital 
      SET value = $1, updated_at = CURRENT_TIMESTAMP
    `, [capital]);
    
    return capital;
  } catch (error) {
    console.error('Error updating capital:', error);
    return 0;
  }
}

// Routes
app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id as _id,
        type,
        amount,
        description,
        date,
        created_at as "createdAt"
      FROM transactions 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/transactions', async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;
    
    const result = await pool.query(`
      INSERT INTO transactions (type, amount, description, date)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id as _id,
        type,
        amount,
        description,
        date,
        created_at as "createdAt"
    `, [type, Number(amount), description, date ? new Date(date) : null]);
    
    await updateCapital();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.patch('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description, date } = req.body;
    
    const result = await pool.query(`
      UPDATE transactions 
      SET type = $1, amount = $2, description = $3, date = $4
      WHERE id = $5
      RETURNING 
        id as _id,
        type,
        amount,
        description,
        date,
        created_at as "createdAt"
    `, [type, Number(amount), description, date ? new Date(date) : null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    await updateCapital();
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM transactions 
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    await updateCapital();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.get('/capital', async (req, res) => {
  try {
    const result = await pool.query('SELECT value as capital FROM capital LIMIT 1');
    res.json({ capital: parseFloat(result.rows[0].capital) });
  } catch (error) {
    console.error('Error fetching capital:', error);
    res.status(500).json({ error: 'Failed to fetch capital' });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`PostgreSQL backend running on http://localhost:${PORT}`);
    console.log('Using PostgreSQL database');
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  console.log('Starting with in-memory fallback...');
  
  // Fallback to in-memory storage
  let transactions: any[] = [];
  let capital = 0;
  
  app.get('/transactions', (req, res) => {
    res.json(transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  });
  
  app.post('/transactions', (req, res) => {
    const { type, amount, description, date } = req.body;
    const transaction = {
      _id: Date.now().toString(),
      type,
      amount: Number(amount),
      description,
      date: date ? new Date(date) : undefined,
      createdAt: new Date().toISOString()
    };
    transactions.push(transaction);
    capital += type === 'income' ? Number(amount) : -Number(amount);
    res.json(transaction);
  });
  
  app.patch('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, description, date } = req.body;
    const index = transactions.findIndex(t => t._id === id);
    if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
    
    const oldAmount = transactions[index].amount;
    const oldType = transactions[index].type;
    
    transactions[index] = { 
      ...transactions[index], 
      type, 
      amount: Number(amount), 
      description, 
      date: date ? new Date(date) : undefined 
    };
    
    // Recalculate capital
    capital = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    res.json(transactions[index]);
  });
  
  app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const index = transactions.findIndex(t => t._id === id);
    if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
    
    const transaction = transactions[index];
    transactions.splice(index, 1);
    capital -= transaction.type === 'income' ? transaction.amount : -transaction.amount;
    res.status(204).send();
  });
  
  app.get('/capital', (req, res) => {
    res.json({ capital });
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Fallback backend running on http://localhost:${PORT}`);
    console.log('Using in-memory storage (PostgreSQL unavailable)');
  });
});