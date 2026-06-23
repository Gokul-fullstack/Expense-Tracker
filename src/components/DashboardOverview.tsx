import { useMemo } from 'react';
import type { Transaction, Category, Budget } from '../types';
import { MetricCard } from './MetricCard';
import CategoryIcon from './CategoryIcon';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardOverviewProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  setActiveTab: (tab: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function DashboardOverview({
  transactions,
  categories,
  budgets,
  setActiveTab,
  onEditTransaction,
  onDeleteTransaction
}: DashboardOverviewProps) {
  // 1. Basic Metrics Calculations
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    transactions.forEach((tx) => {
      const isCurrentMonth = tx.date.startsWith(currentYearMonth);
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (isCurrentMonth) monthlyIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        if (isCurrentMonth) monthlyExpense += tx.amount;
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const savingsRate = monthlyIncome > 0 ? Math.max(0, ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      savingsRate
    };
  }, [transactions]);

  // 2. Category Expense Aggregation for Pie Chart
  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totals: Record<string, number> = {};

    expenses.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(totals)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat ? cat.name : catId,
          value: parseFloat(amount.toFixed(2)),
          color: cat ? cat.color : '#64748b'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // 3. Time Series Data for Area Chart (Grouped by Date)
  const chartData = useMemo(() => {
    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    // Group income and expenses by date
    const dateMap: Record<string, { income: number; expense: number }> = {};
    
    sorted.forEach((tx) => {
      // Format date for chart (e.g., Jun 12)
      const dateObj = new Date(tx.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      
      if (!dateMap[formattedDate]) {
        dateMap[formattedDate] = { income: 0, expense: 0 };
      }
      
      if (tx.type === 'income') {
        dateMap[formattedDate].income += tx.amount;
      } else {
        dateMap[formattedDate].expense += tx.amount;
      }
    });

    return Object.entries(dateMap).map(([date, values]) => ({
      date,
      Income: parseFloat(values.income.toFixed(2)),
      Expense: parseFloat(values.expense.toFixed(2))
    })).slice(-10); // Show last 10 days of activity
  }, [transactions]);

  // 4. Financial Health Score (Calculated out of 100)
  const healthScore = useMemo(() => {
    let score = 50; // Starting midpoint

    // Factor A: Savings Rate (max 30 pts)
    const rate = metrics.savingsRate;
    if (rate >= 35) score += 30;
    else if (rate >= 20) score += 20;
    else if (rate >= 10) score += 10;
    else if (rate <= 0) score -= 15;

    // Factor B: Budget Overrun (max 30 pts)
    const categoryExpenses: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + tx.amount;
      }
    });

    let budgetOverruns = 0;
    budgets.forEach((b) => {
      const spent = categoryExpenses[b.categoryId] || 0;
      if (spent > b.limit) {
        budgetOverruns++;
      }
    });

    if (budgetOverruns === 0 && budgets.length > 0) score += 20;
    else score -= budgetOverruns * 10;

    // Factor C: Balance Safety Margin (max 20 pts)
    // If balance is greater than 1 month of expenses
    const monthlyExp = metrics.monthlyExpense;
    if (metrics.totalBalance > monthlyExp && monthlyExp > 0) score += 20;
    else if (metrics.totalBalance < 0) score -= 20;

    // Constrain score between 0 and 100
    const finalScore = Math.min(100, Math.max(0, score));

    let rating = 'Stable';
    let color = 'var(--warning)';
    if (finalScore >= 80) {
      rating = 'Excellent';
      color = 'var(--success)';
    } else if (finalScore >= 60) {
      rating = 'Healthy';
      color = 'var(--info)';
    } else if (finalScore < 40) {
      rating = 'Needs Attention';
      color = 'var(--danger)';
    }

    return { score: finalScore, rating, color };
  }, [metrics, transactions, budgets]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [transactions]);

  const getCategoryColor = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.color : '#64748b';
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Overview</h1>
          <p>Real-time analysis of your financial standing.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <MetricCard
          title="Total Net Balance"
          value={`₹${metrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="Wallet"
          color="var(--primary)"
        />
        <MetricCard
          title="Monthly Income"
          value={`₹${metrics.monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="TrendingUp"
          color="var(--success)"
          trend={{ value: 8.4, isPositive: true, label: 'vs last month' }}
        />
        <MetricCard
          title="Monthly Expense"
          value={`₹${metrics.monthlyExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon="TrendingDown"
          color="var(--danger)"
          trend={{ value: 3.1, isPositive: false, label: 'vs last month' }}
        />
        <MetricCard
          title="Savings Rate"
          value={`${metrics.savingsRate.toFixed(1)}%`}
          icon="Sparkles"
          color="var(--info)"
        />
      </div>

      {/* Health Score & Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '1.5rem',
      }} className="responsive-dashboard-grid">
        {/* Left Side: Health Score & Donut */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Financial Health Score Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', alignSelf: 'flex-start', margin: 0 }}>Financial Health</h3>
            
            <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Circular Gauge */}
              <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={healthScore.color}
                  strokeDasharray={`${healthScore.score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray var(--transition-slow)' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{healthScore.score}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Score</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: healthScore.color }}>{healthScore.rating}</span>
              <p style={{ fontSize: '0.8rem', maxWidth: '180px' }}>
                {healthScore.score >= 80 ? 'Excellent saving & budget habits!' : healthScore.score >= 60 ? 'Healthy standing. Keep monitoring budgets.' : 'Try setting tighter category budgets.'}
              </p>
            </div>
          </div>

          {/* Expense Category Break-down */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Expenses by Category</h3>
            <div style={{ width: '100%', height: '220px' }}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      formatter={(val) => [`₹${val}`, 'Expenses']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No expense records found.
                </div>
              )}
            </div>
            
            {/* Custom mini legend below chart */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.8rem', fontSize: '0.75rem' }}>
              {categoryData.slice(0, 5).map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cash Flow Trend */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Cash Flow Trend (Last 10 Activities)</h3>
          <div style={{ width: '100%', height: '420px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem' }} />
                  <Area type="monotone" dataKey="Income" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="var(--danger)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Insufficient transaction records for trend.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Recent Activity</h3>
          <button className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('transactions')}>
            Manage All
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="fade-in">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: `${getCategoryColor(tx.category)}1A`,
                        color: getCategoryColor(tx.category)
                      }}>
                        <CategoryIcon name={categories.find(c => c.id === tx.category)?.icon || 'HelpCircle'} size={16} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{getCategoryName(tx.category)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{tx.description || 'No description'}</span>
                      {tx.isRecurring && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                          ↺ Recurring ({tx.recurrenceInterval})
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{tx.paymentMethod}</td>
                  <td>
                    <span className={`badge badge-${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        style={{ width: '30px', height: '30px' }}
                        onClick={() => onEditTransaction(tx)}
                        title="Edit Transaction"
                      >
                        <CategoryIcon name="Edit" size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-icon" 
                        style={{ width: '30px', height: '30px' }}
                        onClick={() => onDeleteTransaction(tx.id)}
                        title="Delete Transaction"
                      >
                        <CategoryIcon name="Trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No transactions logger yet. Add one to see activity.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
