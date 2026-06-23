import { useState, useMemo } from 'react';
import type { Transaction, SavingsGoal } from '../types';
import CategoryIcon from './CategoryIcon';

interface AdvancedAnalyticsProps {
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export function AdvancedAnalytics({
  transactions,
  savingsGoals,
  onSaveGoal,
  onDeleteGoal
}: AdvancedAnalyticsProps) {
  // Goal form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // 1. Projections Calculator
  const projections = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate(); // 1 - 31
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentYearMonth = today.toISOString().substring(0, 7); // YYYY-MM

    // Filter current month expenses
    const monthlyExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(currentYearMonth)
    );
    const monthlyIncomeTx = transactions.filter(
      (tx) => tx.type === 'income' && tx.date.startsWith(currentYearMonth)
    );

    const totalSpentThisMonth = monthlyExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncomeThisMonth = monthlyIncomeTx.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate daily average expense
    const dailyAverageExpense = currentDay > 0 ? totalSpentThisMonth / currentDay : 0;
    
    // Project end of month expense
    const projectedExpense = dailyAverageExpense * totalDaysInMonth;
    
    // Projected net balance
    const projectedNetSavings = totalIncomeThisMonth - projectedExpense;

    return {
      dailyAverageExpense,
      projectedExpense,
      projectedNetSavings,
      totalSpentThisMonth,
      totalIncomeThisMonth,
      daysRemaining: totalDaysInMonth - currentDay
    };
  }, [transactions]);

  // 2. Rule-Based Smart Insights
  const insights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; text: string; action: string }[] = [];
    const today = new Date();
    const currentYearMonth = today.toISOString().substring(0, 7);

    // Check savings rate
    const income = projections.totalIncomeThisMonth;
    const spent = projections.totalSpentThisMonth;
    const rate = income > 0 ? ((income - spent) / income) * 100 : 0;

    if (rate >= 30) {
      list.push({
        type: 'success',
        text: `Your savings rate is ${rate.toFixed(0)}%! That puts you in the top bracket of wealth builders.`,
        action: 'Consider setting up an automated transfer of 15% of your savings into index funds or high-yield savings.'
      });
    } else if (rate > 0 && rate < 15) {
      list.push({
        type: 'info',
        text: `Your savings rate is ${rate.toFixed(0)}% this month. A rate of 20% is recommended for healthy long-term growth.`,
        action: 'Review your shopping and dining categories to find small opportunities for reductions.'
      });
    } else if (rate <= 0 && income > 0) {
      list.push({
        type: 'warning',
        text: 'You have spent more than you earned this month. Net flow is negative.',
        action: 'Examine recurring bills and pause non-essential shopping until next month.'
      });
    }

    // Category breakdown check
    const catTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(currentYearMonth))
      .forEach((tx) => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
      });

    // Check if food dining is > 20% of total expenses
    const foodSpent = catTotals['food'] || 0;
    if (spent > 0 && foodSpent / spent > 0.22) {
      list.push({
        type: 'info',
        text: `Food & Dining represents ${( (foodSpent / spent) * 100 ).toFixed(0)}% of your monthly expenses (₹${foodSpent.toFixed(0)}).`,
        action: 'Cooking at home twice more per week could save you approximately ₹5,000-₹7,000 this month.'
      });
    }

    // Check if shopping is > 25% of total expenses
    const shoppingSpent = catTotals['shopping'] || 0;
    if (spent > 0 && shoppingSpent / spent > 0.25) {
      list.push({
        type: 'warning',
        text: `Shopping & Gear accounts for a substantial ${( (shoppingSpent / spent) * 100 ).toFixed(0)}% of your expenses this month.`,
        action: 'Try adopting a "48-hour rule": wait 2 days before completing any online non-essential purchase.'
      });
    }

    // Recurring subscriptions check
    const recurringExpenses = transactions.filter((t) => t.type === 'expense' && t.isRecurring);
    const recurringTotal = recurringExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    if (recurringExpenses.length >= 3) {
      list.push({
        type: 'info',
        text: `You have ${recurringExpenses.length} active recurring subscriptions, costing you ₹${recurringTotal.toFixed(0)} monthly.`,
        action: 'Periodically review your subscriptions and cancel any services you haven\'t used in the last 30 days.'
      });
    }

    // Fallback if no issues
    if (list.length === 0) {
      list.push({
        type: 'success',
        text: 'Your current spending patterns look healthy and optimized!',
        action: 'Keep log-booking daily. Consistency is the secret to compound wealth growth.'
      });
    }

    return list;
  }, [transactions, projections]);

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Target amount must be greater than 0.');
      return;
    }
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      alert('Current savings cannot be negative.');
      return;
    }
    if (!goalName.trim()) {
      alert('Please enter a goal name.');
      return;
    }
    if (!targetDate) {
      alert('Please select a target date.');
      return;
    }

    onSaveGoal({
      id: editingGoalId || 'goal-' + Date.now(),
      name: goalName,
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate
    });

    // Clear form
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setEditingGoalId(null);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Analytics & Insights</h1>
        <p>Smart savings progress, AI cash flow projections, and custom tips.</p>
      </div>

      {/* Projections Dashboard Row */}
      <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CategoryIcon name="TrendingUp" size={20} color="var(--primary)" />
          Month-End Forecast Projection
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginTop: '0.25rem'
        }}>
          {/* Daily Run-Rate Card */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily Expense Run-rate</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0', color: 'var(--text-primary)' }}>
              ₹{projections.dailyAverageExpense.toFixed(2)}/day
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average spend calculated over current month days</span>
          </div>

          {/* Projected Expense Card */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Projected Monthly Spend</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '6px 0', color: 'var(--danger)' }}>
              ₹{projections.projectedExpense.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Current month spent: ₹{projections.totalSpentThisMonth.toFixed(2)}
            </span>
          </div>

          {/* Projected Net Savings Card */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Projected Net Savings</span>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              margin: '6px 0', 
              color: projections.projectedNetSavings >= 0 ? 'var(--success)' : 'var(--danger)' 
            }}>
              {projections.projectedNetSavings >= 0 ? '+' : '-'}₹{Math.abs(projections.projectedNetSavings).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Projected end-of-month surplus
            </span>
          </div>
        </div>
      </div>

      {/* Main split grid: Savings goals and insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
      }} className="responsive-dashboard-grid">
        
        {/* Left Side: Savings Goals and Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Savings Goals Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Savings Goals</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savingsGoals.map((goal) => {
                const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const formattedDate = new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                
                return (
                  <div key={goal.id} className="glass-panel fade-in" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '34px',
                          height: '34px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--primary-glow)',
                          color: 'var(--primary)'
                        }}>
                          <CategoryIcon name="Compass" size={18} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block' }}>{goal.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target by {formattedDate}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon" 
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => handleEditGoal(goal)}
                          title="Edit"
                        >
                          <CategoryIcon name="Edit" size={13} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon" 
                          style={{ width: '28px', height: '28px' }}
                          onClick={() => onDeleteGoal(goal.id)}
                          title="Remove"
                        >
                          <CategoryIcon name="Trash" size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress slider */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--border-color)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, percent)}%`,
                          backgroundColor: 'var(--primary)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width var(--transition-slow)'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong>₹{goal.currentAmount.toLocaleString('en-IN')}</strong> of ₹{goal.targetAmount.toLocaleString('en-IN')} saved
                        </span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{percent.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {savingsGoals.length === 0 && (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No savings goals created yet. Use the form to declare your first goal.
                </div>
              )}
            </div>
          </div>

          {/* AI Advisor / Insight Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Smart Insights & Advice</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.map((insight, index) => {
                let borderCol = 'rgba(255,255,255,0.05)';
                let glowBg = 'rgba(255,255,255,0.01)';
                let labelColor = 'var(--text-primary)';
                let labelIcon = 'Lightbulb';

                if (insight.type === 'success') {
                  borderCol = 'rgba(16, 185, 129, 0.2)';
                  glowBg = 'var(--success-glow)';
                  labelColor = 'var(--success)';
                  labelIcon = 'CheckCircle';
                } else if (insight.type === 'warning') {
                  borderCol = 'rgba(244, 63, 94, 0.2)';
                  glowBg = 'var(--danger-glow)';
                  labelColor = 'var(--danger)';
                  labelIcon = 'AlertTriangle';
                } else if (insight.type === 'info') {
                  borderCol = 'rgba(6, 182, 212, 0.2)';
                  glowBg = 'var(--info-glow)';
                  labelColor = 'var(--info)';
                  labelIcon = 'Info';
                }

                return (
                  <div 
                    key={index} 
                    className="glass-panel fade-in" 
                    style={{ 
                      padding: '1.25rem', 
                      display: 'flex', 
                      gap: '0.85rem', 
                      borderLeft: `4px solid ${labelColor}`,
                      borderColor: borderCol,
                      backgroundColor: glowBg
                    }}
                  >
                    <div style={{ color: labelColor, marginTop: '2px' }}>
                      <CategoryIcon name={labelIcon} size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {insight.text}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <strong>Tip:</strong> {insight.action}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Manage Goals Form */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editingGoalId ? 'Modify Goal' : 'Establish Goal'}
          </h3>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="goalName">Goal Target</label>
                <input
                  id="goalName"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Travel Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetAmount">Target Amount (₹)</label>
                <input
                  id="targetAmount"
                  type="number"
                  required
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currentAmount">Current Savings (₹)</label>
                <input
                  id="currentAmount"
                  type="number"
                  required
                  className="form-control"
                  placeholder="e.g. 1500"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetDate">Target Date</label>
                <input
                  id="targetDate"
                  type="date"
                  required
                  className="form-control"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {editingGoalId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setEditingGoalId(null);
                      setGoalName('');
                      setTargetAmount('');
                      setCurrentAmount('');
                      setTargetDate('');
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingGoalId ? 'Save Changes' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
