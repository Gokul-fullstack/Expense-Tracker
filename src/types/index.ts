export type TransactionType = 'income' | 'expense';

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string; // references Category.id
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurrenceInterval?: RecurrenceInterval;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name (e.g. 'ShoppingBag', 'Coffee', 'Cpu')
  color: string; // Hex color code
  type: TransactionType | 'both';
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

