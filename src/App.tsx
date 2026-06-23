import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import TransactionManager from './components/TransactionManager';
import BudgetTracker from './components/BudgetTracker';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import AddTransactionModal from './components/AddTransactionModal';
import Auth from './components/Auth';
import api from './services/api';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Transaction, Budget, SavingsGoal, User } from './types';
import { DEFAULT_CATEGORIES } from './constants';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('finspire-darkmode', true);
  
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('finspire-token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('finspire-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Data states loaded from database API
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  // Sync Dark/Light theme class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Load database data when token changes (login/mount)
  useEffect(() => {
    if (!token) {
      // Clear data states if no user token exists
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      return;
    }

    const loadUserData = async () => {
      setLoading(true);
      try {
        // 1. Verify token with /auth/me
        const authCheck = await api.auth.getMe();
        setUser(authCheck.user);
        localStorage.setItem('finspire-user', JSON.stringify(authCheck.user));

        // 2. Fetch SQLite data concurrently
        const [txs, budg, goals] = await Promise.all([
          api.transactions.getAll(),
          api.budgets.getAll(),
          api.goals.getAll()
        ]);

        setTransactions(txs);
        setBudgets(budg);
        setSavingsGoals(goals);
      } catch (error) {
        console.error('Error fetching data from API:', error);
        // If token verification fails (expired/invalid), force logout
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [token]);

  // Session Handlers
  const handleAuthSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('finspire-token', newToken);
    localStorage.setItem('finspire-user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('finspire-token');
    localStorage.removeItem('finspire-user');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
  };

  // Transaction CRUD handlers
  const handleSaveTransaction = async (tx: Omit<Transaction, 'id'> & { id?: string }) => {
    try {
      if (tx.id) {
        // Edit transaction
        const updated = await api.transactions.update(tx.id, tx);
        setTransactions((prev) =>
          prev.map((item) => (item.id === tx.id ? updated : item))
        );
      } else {
        // Create new transaction
        const saved = await api.transactions.create(tx);
        setTransactions((prev) => [saved, ...prev]);
      }
    } catch (err: any) {
      alert(`Failed to save transaction: ${err.message}`);
    }
    setEditTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.transactions.delete(id);
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        if (editTransaction?.id === id) {
          setEditTransaction(null);
        }
      } catch (err: any) {
        alert(`Failed to delete transaction: ${err.message}`);
      }
    }
  };

  const handleEditClick = (tx: Transaction) => {
    setEditTransaction(tx);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditTransaction(null);
    setIsModalOpen(true);
  };

  // Budget handlers
  const handleSaveBudget = async (budget: Budget) => {
    try {
      const saved = await api.budgets.save(budget);
      setBudgets((prev) => {
        const exists = prev.some((b) => b.categoryId === budget.categoryId);
        if (exists) {
          return prev.map((b) => (b.categoryId === budget.categoryId ? saved : b));
        } else {
          return [...prev, saved];
        }
      });
    } catch (err: any) {
      alert(`Failed to save budget: ${err.message}`);
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      try {
        await api.budgets.delete(categoryId);
        setBudgets((prev) => prev.filter((b) => b.categoryId !== categoryId));
      } catch (err: any) {
        alert(`Failed to remove budget: ${err.message}`);
      }
    }
  };

  // Savings Goal handlers
  const handleSaveGoal = async (goal: SavingsGoal) => {
    try {
      const saved = await api.goals.save(goal);
      setSavingsGoals((prev) => {
        const exists = prev.some((g) => g.id === goal.id);
        if (exists) {
          return prev.map((g) => (g.id === goal.id ? saved : g));
        } else {
          return [...prev, saved];
        }
      });
    } catch (err: any) {
      alert(`Failed to save goal: ${err.message}`);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await api.goals.delete(id);
        setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      } catch (err: any) {
        alert(`Failed to delete goal: ${err.message}`);
      }
    }
  };

  // 1. Auth Gate
  if (!token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // 2. Loading Gate
  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Securing database session...
        </span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // 3. Main Dashboard View
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        {activeTab === 'overview' && (
          <DashboardOverview
            transactions={transactions}
            categories={DEFAULT_CATEGORIES}
            budgets={budgets}
            setActiveTab={setActiveTab}
            onEditTransaction={handleEditClick}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionManager
            transactions={transactions}
            categories={DEFAULT_CATEGORIES}
            onAddClick={handleOpenAddModal}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteTransaction}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetTracker
            transactions={transactions}
            categories={DEFAULT_CATEGORIES}
            budgets={budgets}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        )}

        {activeTab === 'analytics' && (
          <AdvancedAnalytics
            transactions={transactions}
            savingsGoals={savingsGoals}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
      </main>

      {/* Transaction Modal Overlay Form */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editTransaction={editTransaction}
        categories={DEFAULT_CATEGORIES}
      />
    </div>
  );
}

export default App;
