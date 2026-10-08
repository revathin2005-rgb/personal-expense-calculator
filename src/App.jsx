import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'personal-expense-calculator-data'

const categories = [
  'Food',
  'Education',
  'Transport',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]

const categoryColors = {
  Food: '#f59e0b',
  Education: '#8b5cf6',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Health: '#10b981',
  Entertainment: '#f97316',
  Other: '#64748b',
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const defaultData = {
  income: [
    { id: 1, source: 'Salary', amount: 4200, date: todayISO() },
    { id: 2, source: 'Freelance', amount: 600, date: todayISO() },
  ],
  expenses: [
    { id: 3, name: 'Groceries', amount: 280, category: 'Food', date: todayISO() },
    { id: 4, name: 'Bus Pass', amount: 90, category: 'Transport', date: todayISO() },
    { id: 5, name: 'Movie Night', amount: 35, category: 'Entertainment', date: todayISO() },
  ],
}

const initialIncomeForm = { source: '', amount: '', date: todayISO() }
const initialExpenseForm = {
  name: '',
  amount: '',
  category: 'Food',
  date: todayISO(),
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`))
}

function getMonthLabel(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`))
}

function getDefaultData() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return defaultData
  }

  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed.income) && Array.isArray(parsed.expenses)) {
      return parsed
    }
  } catch {
    // Ignore invalid saved data and use the defaults.
  }

  return defaultData
}

function Sidebar({ activeView, onSelect }) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: '▣' },
    { id: 'income', label: 'Income', icon: '↗' },
    { id: 'expenses', label: 'Expenses', icon: '↘' },
    { id: 'reports', label: 'Reports', icon: '▤' },
    { id: 'learning', label: 'AI Learning', icon: '✦' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">₹</div>
        <div>
          <p className="eyebrow">Finance planner</p>
          <h1>Expense Calculator</h1>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={activeView === link.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(link.id)}
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-tip">
        <span>💡</span>
        <p>Keep your monthly spending below the money you earn.</p>
      </div>
    </aside>
  )
}

function SummaryCard({ icon, label, value, tone }) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="card-icon" aria-hidden="true">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, min, name, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select name={name} value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          min={min}
          onChange={onChange}
          placeholder={placeholder}
          step={type === 'number' ? '0.01' : undefined}
        />
      )}
    </label>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">📭</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function Dashboard({ income, expenses }) {
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const savings = totalIncome - totalExpenses

  const topCategories = categories
    .map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  const chartMax = Math.max(...topCategories.map((item) => item.total), 1)

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Your financial dashboard</h2>
        </div>
        <span className="status-pill">Live updates</span>
      </div>

      <div className="summary-grid">
        <SummaryCard icon="↗" label="Total income" value={formatCurrency(totalIncome)} tone="income" />
        <SummaryCard icon="↘" label="Total expenses" value={formatCurrency(totalExpenses)} tone="expense" />
        <SummaryCard icon="💰" label="Total savings" value={formatCurrency(savings)} tone="savings" />
        <SummaryCard icon="🏦" label="Remaining balance" value={formatCurrency(savings)} tone="balance" />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Expense mix</p>
              <h3>Category breakdown</h3>
            </div>
          </div>
          {topCategories.length === 0 ? (
            <EmptyState title="No expenses yet" description="Add an expense to see the chart." />
          ) : (
            <div className="chart" aria-label="Expense category chart">
              {topCategories.map((item) => (
                <div key={item.category} className="chart-row">
                  <div className="chart-label-row">
                    <span>{item.category}</span>
                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                  <div className="chart-track">
                    <div
                      className="chart-bar"
                      style={{
                        width: `${(item.total / chartMax) * 100}%`,
                        background: categoryColors[item.category],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Spending</p>
              <h3>Top categories</h3>
            </div>
          </div>
          <div className="category-list">
            {topCategories.length === 0 ? (
              <EmptyState title="No category data" description="Your spending categories will appear here." />
            ) : (
              topCategories.map((item) => (
                <div key={item.category} className="category-item">
                  <span className="category-dot" style={{ background: categoryColors[item.category] }} />
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function IncomeSection({ income, onAddIncome, onDeleteIncome }) {
  const [form, setForm] = useState(initialIncomeForm)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const source = form.source.trim()
    const amount = Number(form.amount)

    if (!source) {
      setError('Please enter an income source.')
      return
    }

    if (!form.date) {
      setError('Please choose an income date.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Income amount must be greater than zero.')
      return
    }

    onAddIncome({ id: Date.now(), source, amount, date: form.date })
    setForm(initialIncomeForm)
    setError('')
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Income</p>
          <h2>Add income records</h2>
        </div>
      </div>

      <div className="form-table-layout">
        <form className="data-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Income source" name="source" value={form.source} onChange={handleChange} placeholder="Salary, bonus, freelance..." />
          <FormField label="Amount" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" />
          <FormField label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button">Add income</button>
        </form>

        <div className="data-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="eyebrow">Records</p>
              <h3>Income history</h3>
            </div>
            <span>{income.length} total</span>
          </div>

          {income.length === 0 ? (
            <EmptyState title="No income added" description="Your income records will appear here." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((item) => (
                    <tr key={item.id}>
                      <td>{item.source}</td>
                      <td>{formatDate(item.date)}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>
                        <button type="button" className="delete-button" onClick={() => onDeleteIncome(item.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ExpenseSection({ expenses, onAddExpense, onDeleteExpense }) {
  const [form, setForm] = useState(initialExpenseForm)
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const name = form.name.trim()
    const amount = Number(form.amount)

    if (!name) {
      setError('Please enter an expense name.')
      return
    }

    if (!form.date) {
      setError('Please choose an expense date.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Expense amount must be greater than zero.')
      return
    }

    onAddExpense({ id: Date.now(), name, amount, category: form.category, date: form.date })
    setForm(initialExpenseForm)
    setError('')
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Expenses</p>
          <h2>Add expense records</h2>
        </div>
      </div>

      <div className="form-table-layout">
        <form className="data-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Expense name" name="name" value={form.name} onChange={handleChange} placeholder="Rent, groceries, course..." />
          <FormField label="Amount" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" />
          <FormField label="Category" name="category" value={form.category} onChange={handleChange} options={categories} />
          <FormField label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button">Add expense</button>
        </form>

        <div className="data-panel">
          <div className="panel-header small-gap">
            <div>
              <p className="eyebrow">Records</p>
              <h3>Expense history</h3>
            </div>
            <span>{expenses.length} total</span>
          </div>

          {expenses.length === 0 ? (
            <EmptyState title="No expenses added" description="Your spending history will appear here." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td><span className="category-badge" style={{ background: `${categoryColors[item.category]}22`, color: categoryColors[item.category] }}>{item.category}</span></td>
                      <td>{formatDate(item.date)}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td><button type="button" className="delete-button" onClick={() => onDeleteExpense(item.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Reports({ income, expenses }) {
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const savings = totalIncome - totalExpenses
  const categoryTotals = categories
    .map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
    }))
    .filter((item) => item.total > 0)

  const monthlySummary = useMemo(() => {
    const months = new Map()

    for (const item of [...income, ...expenses]) {
      const month = getMonthLabel(item.date)
      const isIncome = 'source' in item
      const amount = Number(item.amount)
      const record = months.get(month) ?? { income: 0, expenses: 0 }

      if (isIncome) {
        record.income += amount
      } else {
        record.expenses += amount
      }

      months.set(month, record)
    }

    return Array.from(months.entries()).map(([month, values]) => ({
      month,
      income: values.income,
      expenses: values.expenses,
      savings: values.income - values.expenses,
    }))
  }, [income, expenses])

  function downloadReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalIncome,
      totalExpenses,
      savings,
      categoryTotals,
      monthlySummary,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'personal-expense-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="content-section">
      <div className="section-heading report-heading">
        <div>
          <p className="eyebrow">Summary report</p>
          <h2>Financial overview</h2>
        </div>
        <div className="report-actions">
          <button type="button" className="secondary-button" onClick={() => window.print()}>Print report</button>
          <button type="button" className="primary-button" onClick={downloadReport}>Download</button>
        </div>
      </div>

      <div className="summary-grid report-summary">
        <SummaryCard icon="↗" label="Total income" value={formatCurrency(totalIncome)} tone="income" />
        <SummaryCard icon="↘" label="Total expenses" value={formatCurrency(totalExpenses)} tone="expense" />
        <SummaryCard icon="💰" label="Savings" value={formatCurrency(savings)} tone="savings" />
      </div>

      <div className="report-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Breakdown</p>
              <h3>Category-wise expenses</h3>
            </div>
          </div>
          <div className="category-report">
            {categoryTotals.length === 0 ? (
              <EmptyState title="No categories" description="Expenses will appear here after you add them." />
            ) : (
              categoryTotals.map((item) => (
                <div key={item.category} className="report-row">
                  <span>{item.category}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Monthly</p>
              <h3>Monthly summary</h3>
            </div>
          </div>
          <div className="category-report">
            {monthlySummary.length === 0 ? (
              <EmptyState title="No monthly data" description="Records from all months will appear here." />
            ) : (
              monthlySummary.map((item) => (
                <div key={item.month} className="report-row">
                  <span>{item.month}</span>
                  <strong>{formatCurrency(item.savings)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Learning() {
  const pseudocode = `START
  READ income records
  READ expense records

  CALCULATE totalIncome
  CALCULATE totalExpenses
  CALCULATE savings = totalIncome - totalExpenses

  IF savings > 0 THEN
    DISPLAY "You are saving money"
  ELSE IF savings = 0 THEN
    DISPLAY "Your income and expenses are equal"
  ELSE
    DISPLAY "You are spending more than you earn"
  END IF

  GROUP expenses by category
  DISPLAY summary and reports
END`

  const flowchart = [
    'Start',
    'Input income and expense data',
    'Process totals and savings',
    'Decision: Is savings positive?',
    'Output dashboard and report',
    'End',
  ]

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI-assisted learning</p>
          <h2>Understand the calculator</h2>
        </div>
      </div>

      <div className="learning-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pseudocode</p>
              <h3>How the program works</h3>
            </div>
          </div>
          <pre className="code-block">{pseudocode}</pre>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Flowchart</p>
              <h3>Text-based process</h3>
            </div>
          </div>
          <ol className="flowchart">
            {flowchart.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="learning-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Concepts</p>
              <h3>Programming building blocks</h3>
            </div>
          </div>
          <ul className="concept-list">
            <li><strong>Variables:</strong> Store income, expenses, and savings in memory.</li>
            <li><strong>Loops:</strong> Repeat actions while reading each record or displaying every item.</li>
            <li><strong>Conditions:</strong> Check whether savings are positive, zero, or negative.</li>
            <li><strong>Functions:</strong> Reuse code to calculate totals, format currency, and update the dashboard.</li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Comparison</p>
              <h3>Human-written vs. AI-generated</h3>
            </div>
          </div>
          <div className="comparison-grid">
            <div>
              <h4>Human-written solution</h4>
              <p>A person may organize the code into clear sections and focus on practical rules for data entry and calculations.</p>
            </div>
            <div>
              <h4>AI-generated solution</h4>
              <p>AI can quickly draft reusable components, explain the logic, and suggest improvements for accessibility and design.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [data, setData] = useState(getDefaultData)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  function addIncome(record) {
    setData((current) => ({ ...current, income: [record, ...current.income] }))
  }

  function addExpense(record) {
    setData((current) => ({ ...current, expenses: [record, ...current.expenses] }))
  }

  function deleteIncome(id) {
    setData((current) => ({ ...current, income: current.income.filter((item) => item.id !== id) }))
  }

  function deleteExpense(id) {
    setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) }))
  }

  function renderView() {
    if (activeView === 'income') return <IncomeSection income={data.income} onAddIncome={addIncome} onDeleteIncome={deleteIncome} />
    if (activeView === 'expenses') return <ExpenseSection expenses={data.expenses} onAddExpense={addExpense} onDeleteExpense={deleteExpense} />
    if (activeView === 'reports') return <Reports income={data.income} expenses={data.expenses} />
    if (activeView === 'learning') return <Learning />
    return <Dashboard income={data.income} expenses={data.expenses} />
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onSelect={setActiveView} />
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Good financial habits</p>
            <h2>Welcome back</h2>
          </div>
          <button type="button" className="ghost-button" onClick={() => setData(defaultData)}>
            Reset sample data
          </button>
        </header>
        {renderView()}
      </main>
    </div>
  )
}

export default App
