import React, { useEffect, useMemo, useState } from 'react'
import './styles.css'
import axios from 'axios'

type TransactionType = 'income' | 'expense'

interface Transaction {
  _id: string
  type: TransactionType
  amount: number
  description?: string
  date?: string
  createdAt?: string
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000' })

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [capital, setCapital] = useState<number>(0)
  const [type, setType] = useState<TransactionType>('income')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  const load = async () => {
    const [t, c] = await Promise.all([
      api.get<Transaction[]>('/transactions'),
      api.get<{ capital: number }>('/capital'),
    ])
    setTransactions(t.data)
    setCapital(c.data.capital)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt < 0) return
    await api.post('/transactions', { type, amount: amt, description })
    setAmount('')
    setDescription('')
    await load()
  }

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions])

  const handleDelete = async (id: string) => {
    await api.delete(`/transactions/${id}`)
    await load()
  }

  return (
    <div style={{ maxWidth: 840, margin: '24px auto', padding: 16, fontFamily: 'Inter, system-ui, Arial' }}>
      <h1 style={{ marginBottom: 8 }}>Financial Transactions</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card title="Current Capital" value={`$ ${capital.toFixed(2)}`} accent="#2563eb" />
        <Card title="Total Income" value={`$ ${totalIncome.toFixed(2)}`} accent="#16a34a" />
        <Card title="Total Expense" value={`$ ${totalExpense.toFixed(2)}`} accent="#dc2626" />
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <label>Type</label><br />
          <select value={type} onChange={e => setType(e.target.value as TransactionType)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label>Amount</label><br />
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" />
        </div>
        <div style={{ flex: 1 }}>
          <label>Description</label><br />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" />
        </div>
        <button type="submit">Add</button>
      </form>

      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
            <th>Type</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>{t.type}</td>
              <td>$ {t.amount.toFixed(2)}</td>
              <td>{t.description || '-'}</td>
              <td>{t.date ? new Date(t.date).toLocaleDateString() : (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-')}</td>
              <td><button onClick={() => handleDelete(t._id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Card: React.FC<{ title: string, value: string, accent: string }> = ({ title, value, accent }) => (
  <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: accent }}>{value}</div>
  </div>
)

