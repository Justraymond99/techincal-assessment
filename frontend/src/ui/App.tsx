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

interface ApiError {
  error: string
  details?: string[]
}

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

// Add request interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection')
    }
    if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later')
    }
    throw error
  }
)

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [capital, setCapital] = useState<number>(0)
  const [panelOpen, setPanelOpen] = useState<boolean>(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>(localStorage.getItem('email') || '')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('type', filterType)
      
      const [t, c] = await Promise.all([
        api.get<Transaction[]>(`/transactions?${params.toString()}`),
        api.get<{ capital: number }>('/capital'),
      ])
      setTransactions(t.data)
      setCapital(c.data.capital)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [searchTerm, filterType])

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  if (!email) {
    return <Login onContinue={(e) => { localStorage.setItem('email', e); setEmail(e) }} />
  }

  const name = email.split('@')[0]
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions])
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions])

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/transactions/${deleteId}`)
      setDeleteId(null)
      await load()
    } catch (err: any) {
      showError(err.message || 'Failed to delete transaction')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setPanelOpen(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16, fontFamily: 'Inter, system-ui, Arial', position: 'relative' }}>
      {/* Error Banner */}
      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '12px 16px', 
          borderRadius: 8, 
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Header */}
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
          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: 6,
                fontSize: 14
              }}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: 6,
                fontSize: 14,
                background: 'white'
              }}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Transactions Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>
              My Transactions {loading && <span style={{ fontSize: 12, color: '#6b7280' }}>(Loading...)</span>}
            </div>
            <button 
              onClick={() => { setEditingTransaction(null); setPanelOpen(true) }}
              style={{ 
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Add Transaction
            </button>
          </div>

          {/* Transactions Table */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table width="100%" cellPadding={12} style={{ borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ fontWeight: 600, fontSize: 14 }}>Date</th>
                  <th style={{ fontWeight: 600, fontSize: 14 }}>Type</th>
                  <th style={{ fontWeight: 600, fontSize: 14 }}>Amount</th>
                  <th style={{ fontWeight: 600, fontSize: 14 }}>Description</th>
                  <th style={{ fontWeight: 600, fontSize: 14, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                      {loading ? 'Loading transactions...' : 'No transactions found'}
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ fontSize: 14 }}>{formatDate(t.date || t.createdAt)}</td>
                      <td>
                        <span style={{ 
                          color: t.type === 'income' ? '#16a34a' : '#dc2626',
                          fontWeight: 500,
                          fontSize: 14
                        }}>
                          {t.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 14 }}>$ {t.amount.toFixed(2)}</td>
                      <td style={{ fontSize: 14, color: t.description ? '#111' : '#6b7280' }}>
                        {t.description || 'No description'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleEdit(t)}
                            style={{ 
                              background: '#f59e0b', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 8px', 
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteId(t._id)} 
                            style={{ 
                              background: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 8px', 
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <Card title="Total Income" value={`$ ${totalIncome.toFixed(2)}`} accent="#16a34a" />
            <Card title="Total Expenses" value={`$ ${totalExpense.toFixed(2)}`} accent="#dc2626" />
          </div>
        </div>

        {/* Add/Edit Panel */}
        {panelOpen && (
          <AddPanel 
            transaction={editingTransaction}
            onClose={() => { setPanelOpen(false); setEditingTransaction(null) }} 
            onCreated={async () => { setPanelOpen(false); setEditingTransaction(null); await load() }} 
          />
        )}
      </div>

      {/* Delete Confirmation */}
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
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    if (!email) {
      setError('Please enter your email')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    onContinue(email)
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', fontFamily: 'Inter, system-ui, Arial' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', border: '2px dashed #e5e7eb', margin: '0 auto 24px' }} />
      <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Enter your email</div>
      <div style={{ marginBottom: 16, color: '#6b7280' }}>Sign in to manage your financial transactions</div>
      
      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '8px 12px', 
          borderRadius: 6, 
          marginBottom: 16,
          fontSize: 14
        }}>
          {error}
        </div>
      )}
      
      <input 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="you@example.com" 
        style={{ 
          width: '100%', 
          marginBottom: 12, 
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 16
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
      />
      <button 
        onClick={handleContinue} 
        style={{ 
          width: '100%', 
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 16px',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Continue
      </button>
    </div>
  )
}

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#111', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{initials}</div>
  )
}

const AddPanel: React.FC<{ transaction?: Transaction | null, onClose: () => void, onCreated: () => void }> = ({ transaction, onClose, onCreated }) => {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'income')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!transaction

  const validateForm = () => {
    const errors: string[] = []
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push('Amount must be a positive number')
    }
    
    if (description && description.length > 255) {
      errors.push('Description must be less than 255 characters')
    }
    
    if (date && isNaN(Date.parse(date))) {
      errors.push('Please enter a valid date')
    }
    
    return errors
  }

  const handleSubmit = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const amt = parseFloat(amount)
      const payload = { 
        type, 
        amount: amt, 
        description: description.trim() || undefined,
        date: date || undefined
      }

      if (isEditing) {
        await api.patch(`/transactions/${transaction._id}`, payload)
      } else {
        await api.post('/transactions', payload)
      }
      
      await onCreated()
    } catch (err: any) {
      if (err.response?.data?.details) {
        setError(err.response.data.details.join(', '))
      } else {
        setError(err.message || 'Failed to save transaction')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: 360, borderLeft: '1px solid #e5e7eb', padding: 20, background: '#fafafa' }}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 18 }}>
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </div>
      
      {error && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '8px 12px', 
          borderRadius: 6, 
          marginBottom: 16,
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {/* Type Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setType('income')} 
            style={{ 
              flex: 1,
              background: type === 'income' ? '#16a34a' : '#fff', 
              color: type === 'income' ? '#fff' : '#111',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Income
          </button>
          <button 
            onClick={() => setType('expense')} 
            style={{ 
              flex: 1,
              background: type === 'expense' ? '#dc2626' : '#fff', 
              color: type === 'expense' ? '#fff' : '#111',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Amount *</label>
        <input 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="0.00" 
          type="number" 
          min="0" 
          step="0.01" 
          style={{ 
            width: '100%', 
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 16
          }} 
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
        <input 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Optional description" 
          maxLength={255}
          style={{ 
            width: '100%', 
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 16
          }} 
        />
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {description.length}/255 characters
        </div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
        <input 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          type="date" 
          style={{ 
            width: '100%', 
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 16
          }} 
        />
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          Leave empty to use current date
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          style={{ 
            flex: 1, 
            background: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500
          }}
        >
          {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
        </button>
        <button 
          onClick={onClose} 
          style={{ 
            flex: 1, 
            background: '#e5e7eb', 
            color: '#111',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const DeleteConfirm: React.FC<{ onCancel: () => void, onConfirm: () => void }> = ({ onCancel, onConfirm }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
    <div style={{ background: '#fff', color: '#111', padding: 24, borderRadius: 8, width: 400, maxWidth: '90vw' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 18 }}>Delete Transaction</div>
      <div style={{ marginBottom: 20, color: '#6b7280' }}>Are you sure you want to delete this transaction? This action cannot be undone.</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button 
          onClick={onCancel} 
          style={{ 
            background: '#e5e7eb', 
            color: '#111',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          style={{ 
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)