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
  const [panelOpen, setPanelOpen] = useState<boolean>(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>(localStorage.getItem('email') || '')

  const load = async () => {
    const [t, c] = await Promise.all([
      api.get<Transaction[]>('/transactions'),
      api.get<{ capital: number }>('/capital'),
    ])
    setTransactions(t.data)
    setCapital(c.data.capital)
  }

  useEffect(() => { load() }, [])

  if (!email) {
    return <Login onContinue={(e) => { localStorage.setItem('email', e); setEmail(e) }} />
  }

  const name = email.split('@')[0]
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions])

  const confirmDelete = async () => {
    if (!deleteId) return
    await api.delete(`/transactions/${deleteId}`)
    setDeleteId(null)
    await load()
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16, fontFamily: 'Inter, system-ui, Arial', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Avatar name={name} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Username</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{name}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Current Capital</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>$ {capital.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>My Transactions</div>
            <button onClick={() => setPanelOpen(true)}>Add</button>
          </div>
          <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td>{t.date ? new Date(t.date).toLocaleDateString() : (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-')}</td>
                  <td style={{ color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>{t.type === 'income' ? 'Income' : 'Expense'}</td>
                  <td>$ {t.amount.toFixed(2)}</td>
                  <td>{t.description || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setDeleteId(t._id)} style={{ background: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <Card title="Total Income" value={`$ ${totalIncome.toFixed(2)}`} accent="#16a34a" />
            <Card title="Total Expenses" value={`$ ${totalExpense.toFixed(2)}`} accent="#dc2626" />
          </div>
        </div>

        {panelOpen && <AddPanel onClose={() => setPanelOpen(false)} onCreated={async () => { setPanelOpen(false); await load() }} />}
      </div>

      {deleteId && (
        <DeleteConfirm onCancel={() => setDeleteId(null)} onConfirm={confirmDelete} />
      )}
    </div>
  )
}

const Card: React.FC<{ title: string, value: string, accent: string }> = ({ title, value, accent }) => (
  <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
    <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: accent }}>{value}</div>
  </div>
)

const Login: React.FC<{ onContinue: (email: string) => void }> = ({ onContinue }) => {
  const [email, setEmail] = useState('')
  return (
      <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', fontFamily: 'Inter, system-ui, Arial' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', border: '2px dashed #e5e7eb', margin: '0 auto 24px' }} />
      <div style={{ marginBottom: 8 }}>Enter your email</div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', marginBottom: 12 }} />
      <button onClick={() => email && onContinue(email)} style={{ width: '100%' }}>Continue</button>
    </div>
  )
}

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#111', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{initials}</div>
  )
}

const AddPanel: React.FC<{ onClose: () => void, onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [type, setType] = useState<TransactionType>('income')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const create = async () => {
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt < 0) return
    await api.post('/transactions', { type, amount: amt, description })
    await onCreated()
  }

  return (
    <div style={{ width: 320, borderLeft: '1px solid #e5e7eb', padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Add Transaction</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setType('income')} style={{ background: type === 'income' ? '#16a34a' : '#fff', color: type === 'income' ? '#fff' : '#111' }}>Income</button>
        <button onClick={() => setType('expense')} style={{ background: type === 'expense' ? '#dc2626' : '#fff', color: type === 'expense' ? '#fff' : '#111' }}>Expense</button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Amount</label><br />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Description</label><br />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" style={{ width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={create} style={{ flex: 1 }}>Create</button>
        <button onClick={onClose} style={{ flex: 1, background: '#e5e7eb', color: '#111' }}>Close</button>
      </div>
    </div>
  )
}

const DeleteConfirm: React.FC<{ onCancel: () => void, onConfirm: () => void }> = ({ onCancel, onConfirm }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'grid', placeItems: 'center' }}>
    <div style={{ background: '#fff', color: '#111', padding: 20, borderRadius: 8, width: 360 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete Transaction</div>
      <div style={{ marginBottom: 16 }}>Are you sure you want to delete this transaction?</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: '#e5e7eb', color: '#111' }}>Cancel</button>
        <button onClick={onConfirm} style={{ background: '#ef4444' }}>Delete</button>
      </div>
    </div>
  </div>
)

