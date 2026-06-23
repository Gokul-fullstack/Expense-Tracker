import { useState, useEffect } from 'react';
import type { Transaction, Category, TransactionType, RecurrenceInterval } from '../types';
import { PAYMENT_METHODS } from '../constants';
import CategoryIcon from './CategoryIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  editTransaction: Transaction | null;
  categories: Category[];
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  editTransaction,
  categories
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('monthly');

  // Reset or fill fields on open / edit change
  useEffect(() => {
    if (editTransaction) {
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setDate(editTransaction.date);
      setDescription(editTransaction.description);
      setPaymentMethod(editTransaction.paymentMethod);
      setIsRecurring(editTransaction.isRecurring);
      if (editTransaction.recurrenceInterval) {
        setRecurrenceInterval(editTransaction.recurrenceInterval);
      }
    } else {
      // Set defaults for a new transaction
      setAmount('');
      setType('expense');
      const filtered = categories.filter(c => c.type === 'expense');
      setCategory(filtered.length > 0 ? filtered[0].id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setPaymentMethod(PAYMENT_METHODS[0]);
      setIsRecurring(false);
      setRecurrenceInterval('monthly');
    }
  }, [editTransaction, isOpen, categories]);

  // Handle type change (update default category to match type)
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const filtered = categories.filter(c => c.type === newType);
    if (filtered.length > 0) {
      setCategory(filtered[0].id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (!category) {
      alert('Please select a category.');
      return;
    }

    onSave({
      id: editTransaction?.id,
      amount: parsedAmount,
      type,
      category,
      date,
      description,
      paymentMethod,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined
    });
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel fade-in">
        <div className="modal-header">
          <h2>{editTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className="close-btn" onClick={onClose}>
            <CategoryIcon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Toggle Type buttons */}
          <div className="type-toggle-container">
            <button
              type="button"
              className={`type-btn income-btn ${type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              <CategoryIcon name="TrendingUp" size={18} />
              Income
            </button>
            <button
              type="button"
              className={`type-btn expense-btn ${type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              <CategoryIcon name="TrendingDown" size={18} />
              Expense
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                step="any"
                required
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                required
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              className="form-control"
              placeholder="e.g. Weekly organic groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Recurrence Options */}
          <div className="recurrence-section">
            <div className="recurrence-toggle">
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span className="switch-text">Recurring Transaction</span>
              </label>
            </div>

            {isRecurring && (
              <div className="form-group fade-in" style={{ marginTop: '0.5rem' }}>
                <label htmlFor="recurrenceInterval">Frequency</label>
                <select
                  id="recurrenceInterval"
                  className="form-control"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(e.target.value as RecurrenceInterval)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
