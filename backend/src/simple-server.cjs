const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage
let transactions = [];
let capital = 0;

// Helper to update capital
function updateCapital() {
  capital = transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}

// Routes
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
  updateCapital();
  res.json(transaction);
});

app.patch('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, description, date } = req.body;
  const index = transactions.findIndex(t => t._id === id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
  
  transactions[index] = { ...transactions[index], type, amount: Number(amount), description, date: date ? new Date(date) : undefined };
  updateCapital();
  res.json(transactions[index]);
});

app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const index = transactions.findIndex(t => t._id === id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
  
  transactions.splice(index, 1);
  updateCapital();
  res.status(204).send();
});

app.get('/capital', (req, res) => {
  res.json({ capital });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Simple backend running on http://localhost:${PORT}`);
  console.log('Using in-memory storage (no persistence)');
});