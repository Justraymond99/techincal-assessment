import express from 'express';
import cors from 'cors';
import { pool, initDatabase } from './database.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database on startup
await initDatabase();

// Helper to update capital
async function updateCapital() {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PostgreSQL backend running on http://localhost:${PORT}`);
  console.log('Using PostgreSQL database');
});