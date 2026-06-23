import { useState, useMemo } from 'react';
import type { Transaction, Category, Budget } from '../types';
import CategoryIcon from './CategoryIcon';

interface BudgetTrackerProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (categoryId: string) => void;
}

export function BudgetTracker({
  transactions,
  categories,
  budgets,
  onSaveBudget,
  onDeleteBudget
}: BudgetTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Group transaction expenses by category for current month
  const categoryExpenses = useMemo(() => {
    const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const expenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(currentYearMonth)
    );

    const totals: Record<string, number> = {};
    expenses.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });
    return totals;
  }, [transactions]);

  // Aggregate budget details (spent vs limit)
  const budgetDetails = useMemo(() => {
    return budgets.map((b) => {
      const category = categories.find((c) => c.id === b.categoryId);
      const spent = categoryExpenses[b.categoryId] || 0;
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      
      let statusColor = 'var(--success)';
      if (percentage >= 100) statusColor = 'var(--danger)';
      else if (percentage >= 75) statusColor = 'var(--warning)';

      return {
        categoryId: b.categoryId,
        categoryName: category ? category.name : b.categoryId,
        categoryIcon: category ? category.icon : 'HelpCircle',
        categoryColor: category ? category.color : '#64748b',
        limit: b.limit,
        spent,
        percentage,
        statusColor
      };
    });
  }, [budgets, categories, categoryExpenses]);

  // Determine which categories don't have a budget yet
  const availableCategories = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');
    return expenseCats.filter(
      (cat) => !budgets.some((b) => b.categoryId === cat.id)
    );
  }, [categories, budgets]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (!selectedCategory) {
      alert('Please select a category.');
      return;
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Please enter a valid limit greater than 0.');
      return;
    }

    onSaveBudget({
      categoryId: selectedCategory,
      limit: parsedLimit
    });

    setLimit('');
    setSelectedCategory('');
    setIsEditing(false);
  };

  const handleEditClick = (b: { categoryId: string; limit: number }) => {
    setSelectedCategory(b.categoryId);
    setLimit(b.limit.toString());
    setIsEditing(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Budgets</h1>
        <p>Set caps and monitor spending limits per expense category.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
      }} className="responsive-dashboard-grid">
        
        {/* Left Side: Active Budgets Tracker List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Active Limits</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {budgetDetails.map((b) => (
              <div 
                key={b.categoryId} 
                className="glass-panel fade-in" 
                style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${b.categoryColor}1A`,
                      color: b.categoryColor
                    }}>
                      <CategoryIcon name={b.categoryIcon} size={18} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{b.categoryName}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                      className="btn btn-secondary btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => handleEditClick(b)}
                      title="Adjust Budget"
                    >
                      <CategoryIcon name="Edit" size={13} />
                    </button>
                    <button 
                      className="btn btn-danger btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      onClick={() => onDeleteBudget(b.categoryId)}
                      title="Delete Budget"
                    >
                      <CategoryIcon name="Trash" size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar container */}
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
                      width: `${Math.min(100, b.percentage)}%`,
                      backgroundColor: b.statusColor,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-slow)'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong>₹{b.spent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong> spent of ₹{b.limit.toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: b.statusColor, fontWeight: 600 }}>
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Warning flags */}
                {b.percentage >= 100 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--danger)',
                    backgroundColor: 'var(--danger-glow)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                    width: 'fit-content'
                  }}>
                    <CategoryIcon name="AlertTriangle" size={12} />
                    Budget limit exceeded by ₹{(b.spent - b.limit).toFixed(2)}!
                  </div>
                ) : b.percentage >= 75 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--warning)',
                    backgroundColor: 'var(--warning-glow)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                    width: 'fit-content'
                  }}>
                    <CategoryIcon name="AlertCircle" size={12} />
                    Approaching limit! ₹{(b.limit - b.spent).toFixed(2)} remaining.
                  </div>
                ) : null}
              </div>
            ))}

            {budgets.length === 0 && (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active budgets set. Configure one on the right to start tracking.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Configure Budget Form */}
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {isEditing ? 'Adjust Limit' : 'Configure Limit'}
          </h3>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label htmlFor="budgetCategory">Expense Category</label>
                <select
                  id="budgetCategory"
                  className="form-control"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isEditing}
                >
                  <option value="">Select category...</option>
                  {isEditing ? (
                    // In edit mode, show the category we are editing
                    <option value={selectedCategory}>
                      {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                    </option>
                  ) : (
                    // In create mode, show categories that don't have budgets yet
                    availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="budgetLimit">Monthly Limit (₹)</label>
                <input
                  id="budgetLimit"
                  type="number"
                  required
                  className="form-control"
                  placeholder="e.g. 500"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {isEditing && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedCategory('');
                      setLimit('');
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {isEditing ? 'Update Limit' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetTracker;
