import { useState, useMemo } from 'react';
import type { Transaction, Category } from '../types';
import CategoryIcon from './CategoryIcon';

interface TransactionManagerProps {
  transactions: Transaction[];
  categories: Category[];
  onAddClick: () => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
}

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

export function TransactionManager({
  transactions,
  categories,
  onAddClick,
  onEditClick,
  onDeleteClick
}: TransactionManagerProps) {
  // Search and filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter and sort logic
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search term filtering (description or amount)
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(term) ||
          tx.amount.toString().includes(term)
      );
    }

    // Type filtering
    if (typeFilter !== 'all') {
      result = result.filter((tx) => tx.type === typeFilter);
    }

    // Category filtering
    if (categoryFilter !== 'all') {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    // Date range filtering
    if (startDate) {
      result = result.filter((tx) => tx.date >= startDate);
    }
    if (endDate) {
      result = result.filter((tx) => tx.date <= endDate);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, startDate, endDate, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(start, start + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getCategoryColor = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.color : '#64748b';
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : catId;
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (processedTransactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = ['ID', 'Type', 'Category', 'Date', 'Description', 'Amount', 'Payment Method', 'Recurring'];
    const rows = processedTransactions.map((tx) => [
      tx.id,
      tx.type.toUpperCase(),
      getCategoryName(tx.category),
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.paymentMethod,
      tx.isRecurring ? `Yes (${tx.recurrenceInterval})` : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FinSpire_Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Ledger</h1>
          <p>Search, filter, and export transaction logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV} title="Export as CSV">
            <CategoryIcon name="Download" size={16} />
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={onAddClick}>
            <CategoryIcon name="Plus" size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {/* Text Search */}
          <div className="form-group">
            <label>Search Details</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search description or amount..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Type Filter */}
          <div className="form-group">
            <label>Type</label>
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label>Category</label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* End Date */}
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Sorting and Clear Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sort by:</span>
            
            <button 
              className={`btn btn-secondary ${sortField === 'date' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setSortField('date')}
            >
              Date
            </button>
            <button 
              className={`btn btn-secondary ${sortField === 'amount' ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setSortField('amount')}
            >
              Amount
            </button>

            <span style={{ color: 'var(--border-color-hover)' }}>|</span>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </button>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(244,63,94,0.1)' }}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
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
              {paginatedTransactions.map((tx) => (
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
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onEditClick(tx)}
                        title="Edit"
                      >
                        <CategoryIcon name="Edit" size={14} />
                      </button>
                      <button 
                        className="btn btn-danger btn-icon" 
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onDeleteClick(tx.id)}
                        title="Delete"
                      >
                        <CategoryIcon name="Trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No matching transactions found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            padding: '0.25rem 0.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing page <strong>{currentPage}</strong> of {totalPages} ({processedTransactions.length} records)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionManager;
