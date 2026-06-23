import type { Transaction, Budget, SavingsGoal, User, AuthResponse } from '../types';

const API_BASE = 'http://localhost:3001/api';

// Helper to get token
const getToken = () => localStorage.getItem('finspire-token');

// Helper for fetch wrapper
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  // Authentication API
  auth: {
    async login(credentials: { email: string; password?: string }): Promise<AuthResponse> {
      return fetchWithAuth<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },

    async signup(userInfo: { email: string; password?: string; name: string }): Promise<AuthResponse> {
      return fetchWithAuth<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userInfo)
      });
    },

    async getMe(): Promise<{ user: User }> {
      return fetchWithAuth<{ user: User }>('/auth/me');
    }
  },

  // Transactions API
  transactions: {
    async getAll(): Promise<Transaction[]> {
      return fetchWithAuth<Transaction[]>('/transactions');
    },

    async create(tx: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
      return fetchWithAuth<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(tx)
      });
    },

    async update(id: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
      return fetchWithAuth<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tx)
      });
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return fetchWithAuth<{ success: boolean; message: string }>(`/transactions/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Budgets API
  budgets: {
    async getAll(): Promise<Budget[]> {
      return fetchWithAuth<Budget[]>('/budgets');
    },

    async save(budget: Budget): Promise<Budget> {
      return fetchWithAuth<Budget>('/budgets', {
        method: 'POST',
        body: JSON.stringify(budget)
      });
    },

    async delete(categoryId: string): Promise<{ success: boolean; message: string }> {
      return fetchWithAuth<{ success: boolean; message: string }>(`/budgets/${categoryId}`, {
        method: 'DELETE'
      });
    }
  },

  // Savings Goals API
  goals: {
    async getAll(): Promise<SavingsGoal[]> {
      return fetchWithAuth<SavingsGoal[]>('/goals');
    },

    async save(goal: SavingsGoal): Promise<SavingsGoal> {
      return fetchWithAuth<SavingsGoal>('/goals', {
        method: 'POST',
        body: JSON.stringify(goal)
      });
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return fetchWithAuth<{ success: boolean; message: string }>(`/goals/${id}`, {
        method: 'DELETE'
      });
    }
  }
};

export default api;
