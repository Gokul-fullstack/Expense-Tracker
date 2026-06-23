import type { Category, Transaction, Budget, SavingsGoal } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#f43f5e', type: 'expense' },
  { id: 'housing', name: 'Rent & Housing', icon: 'Home', color: '#3b82f6', type: 'expense' },
  { id: 'transportation', name: 'Transport & Fuel', icon: 'Car', color: '#eab308', type: 'expense' },
  { id: 'utilities', name: 'Bills & Utilities', icon: 'Zap', color: '#06b6d4', type: 'expense' },
  { id: 'entertainment', name: 'Leisure & Fun', icon: 'Sparkles', color: '#a855f7', type: 'expense' },
  { id: 'shopping', name: 'Shopping & Gear', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: 'health', name: 'Health & Wellness', icon: 'Heart', color: '#10b981', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#f97316', type: 'expense' },
  { id: 'other', name: 'Miscellaneous', icon: 'HelpCircle', color: '#64748b', type: 'expense' },
  
  // Income Categories
  { id: 'salary', name: 'Monthly Salary', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'freelance', name: 'Freelance & Side Hustles', icon: 'Laptop', color: '#8b5cf6', type: 'income' },
  { id: 'investments', name: 'Investments & Dividends', icon: 'TrendingUp', color: '#06b6d4', type: 'income' }
];

export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'UPI / Digital Wallet',
  'Cash',
  'Bank Transfer'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    amount: 5200,
    type: 'income',
    category: 'salary',
    date: '2026-06-01',
    description: 'Monthly Corporate Salary payment',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  },
  {
    id: 'tx-2',
    amount: 1500,
    type: 'expense',
    category: 'housing',
    date: '2026-06-01',
    description: 'Apartment Monthly Rent',
    paymentMethod: 'Bank Transfer',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  },
  {
    id: 'tx-3',
    amount: 120,
    type: 'expense',
    category: 'food',
    date: '2026-06-02',
    description: 'Weekly Organic Grocery restock',
    paymentMethod: 'Debit Card',
    isRecurring: false
  },
  {
    id: 'tx-4',
    amount: 220,
    type: 'expense',
    category: 'utilities',
    date: '2026-06-03',
    description: 'Electricity & Internet bills',
    paymentMethod: 'UPI / Digital Wallet',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  },
  {
    id: 'tx-5',
    amount: 75,
    type: 'expense',
    category: 'food',
    date: '2026-06-05',
    description: 'Sushi Dinner with team',
    paymentMethod: 'Credit Card',
    isRecurring: false
  },
  {
    id: 'tx-6',
    amount: 18,
    type: 'expense',
    category: 'transportation',
    date: '2026-06-06',
    description: 'Ride home from office',
    paymentMethod: 'UPI / Digital Wallet',
    isRecurring: false
  },
  {
    id: 'tx-7',
    amount: 15,
    type: 'expense',
    category: 'entertainment',
    date: '2026-06-07',
    description: 'Netflix UHD Subscription',
    paymentMethod: 'Credit Card',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  },
  {
    id: 'tx-8',
    amount: 50,
    type: 'expense',
    category: 'health',
    date: '2026-06-08',
    description: 'Gym Monthly Membership',
    paymentMethod: 'Credit Card',
    isRecurring: true,
    recurrenceInterval: 'monthly'
  },
  {
    id: 'tx-9',
    amount: 850,
    type: 'income',
    category: 'freelance',
    date: '2026-06-10',
    description: 'Web Design Freelance Milestone 1',
    paymentMethod: 'Bank Transfer',
    isRecurring: false
  },
  {
    id: 'tx-10',
    amount: 110,
    type: 'expense',
    category: 'shopping',
    date: '2026-06-12',
    description: 'Sneakers and sports shirt',
    paymentMethod: 'Credit Card',
    isRecurring: false
  },
  {
    id: 'tx-11',
    amount: 95,
    type: 'expense',
    category: 'food',
    date: '2026-06-15',
    description: 'Weekly Mid-Month Groceries',
    paymentMethod: 'Debit Card',
    isRecurring: false
  },
  {
    id: 'tx-12',
    amount: 140,
    type: 'expense',
    category: 'food',
    date: '2026-06-18',
    description: 'Birthday celebration dinner',
    paymentMethod: 'Credit Card',
    isRecurring: false
  },
  {
    id: 'tx-13',
    amount: 45,
    type: 'expense',
    category: 'transportation',
    date: '2026-06-19',
    description: 'Gas tank refill',
    paymentMethod: 'Debit Card',
    isRecurring: false
  },
  {
    id: 'tx-14',
    amount: 8,
    type: 'expense',
    category: 'food',
    date: '2026-06-20',
    description: 'Latte & Croissant at Cafe',
    paymentMethod: 'UPI / Digital Wallet',
    isRecurring: false
  },
  {
    id: 'tx-15',
    amount: 250,
    type: 'expense',
    category: 'shopping',
    date: '2026-06-21',
    description: 'Noise Cancelling Wireless Earbuds',
    paymentMethod: 'Credit Card',
    isRecurring: false
  },
  {
    id: 'tx-16',
    amount: 125,
    type: 'income',
    category: 'investments',
    date: '2026-06-22',
    description: 'Stock portfolio quarterly dividend',
    paymentMethod: 'Bank Transfer',
    isRecurring: false
  },
  {
    id: 'tx-17',
    amount: 90,
    type: 'expense',
    category: 'entertainment',
    date: '2026-06-22',
    description: 'Standup Comedy Show Tickets',
    paymentMethod: 'UPI / Digital Wallet',
    isRecurring: false
  },
  {
    id: 'tx-18',
    amount: 30,
    type: 'expense',
    category: 'health',
    date: '2026-06-23',
    description: 'Vitamins & Supplements',
    paymentMethod: 'Debit Card',
    isRecurring: false
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { categoryId: 'food', limit: 500 },
  { categoryId: 'entertainment', limit: 250 },
  { categoryId: 'shopping', limit: 400 },
  { categoryId: 'transportation', limit: 150 },
  { categoryId: 'health', limit: 100 }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6850,
    targetDate: '2026-12-31'
  },
  {
    id: 'goal-2',
    name: 'New Laptop',
    targetAmount: 2000,
    currentAmount: 1400,
    targetDate: '2026-09-30'
  }
];
