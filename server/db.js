import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(__dirname, '../expense.db');

let db = null;

export async function getDatabase() {
  if (db) return db;

  // Open database connection
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys support
  await db.run('PRAGMA foreign_keys = ON');

  // Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  // Create Transactions Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      paymentMethod TEXT NOT NULL,
      isRecurring INTEGER NOT NULL, -- 0 for false, 1 for true
      recurrenceInterval TEXT,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Budgets Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      categoryId TEXT NOT NULL,
      limitAmount REAL NOT NULL,
      userId TEXT NOT NULL,
      PRIMARY KEY (categoryId, userId),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Savings Goals Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      currentAmount REAL NOT NULL,
      targetDate TEXT NOT NULL,
      userId TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Seed default data if database is brand new (i.e. no users exist)
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding database with default user and transactions...');
    
    // Create demo user
    const demoUserId = 'user-demo';
    const hashedPassword = bcrypt.hashSync('password123', 10);
    await db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [demoUserId, 'demo@example.com', hashedPassword, 'Gokul']
    );

    // Seed mock budgets
    const initialBudgets = [
      { categoryId: 'food', limit: 500 },
      { categoryId: 'entertainment', limit: 250 },
      { categoryId: 'shopping', limit: 400 },
      { categoryId: 'transportation', limit: 150 },
      { categoryId: 'health', limit: 100 }
    ];
    for (const b of initialBudgets) {
      await db.run(
        'INSERT INTO budgets (categoryId, limitAmount, userId) VALUES (?, ?, ?)',
        [b.categoryId, b.limit, demoUserId]
      );
    }

    // Seed mock savings goals
    const initialGoals = [
      { id: 'goal-1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 6850, targetDate: '2026-12-31' },
      { id: 'goal-2', name: 'New Laptop', targetAmount: 2000, currentAmount: 1400, targetDate: '2026-09-30' }
    ];
    for (const g of initialGoals) {
      await db.run(
        'INSERT INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, userId) VALUES (?, ?, ?, ?, ?, ?)',
        [g.id, g.name, g.targetAmount, g.currentAmount, g.targetDate, demoUserId]
      );
    }

    // Seed mock transactions
    // (Import initial transactions list dynamically to save space/readability, same values as constants)
    const txs = [
      { id: 'tx-1', amount: 5200, type: 'income', category: 'salary', date: '2026-06-01', description: 'Monthly Corporate Salary payment', paymentMethod: 'Bank Transfer', isRecurring: 1, recurrenceInterval: 'monthly' },
      { id: 'tx-2', amount: 1500, type: 'expense', category: 'housing', date: '2026-06-01', description: 'Apartment Monthly Rent', paymentMethod: 'Bank Transfer', isRecurring: 1, recurrenceInterval: 'monthly' },
      { id: 'tx-3', amount: 120, type: 'expense', category: 'food', date: '2026-06-02', description: 'Weekly Organic Grocery restock', paymentMethod: 'Debit Card', isRecurring: 0 },
      { id: 'tx-4', amount: 220, type: 'expense', category: 'utilities', date: '2026-06-03', description: 'Electricity & Internet bills', paymentMethod: 'UPI / Digital Wallet', isRecurring: 1, recurrenceInterval: 'monthly' },
      { id: 'tx-5', amount: 75, type: 'expense', category: 'food', date: '2026-06-05', description: 'Sushi Dinner with team', paymentMethod: 'Credit Card', isRecurring: 0 },
      { id: 'tx-6', amount: 18, type: 'expense', category: 'transportation', date: '2026-06-06', description: 'Ride home from office', paymentMethod: 'UPI / Digital Wallet', isRecurring: 0 },
      { id: 'tx-7', amount: 15, type: 'expense', category: 'entertainment', date: '2026-06-07', description: 'Netflix UHD Subscription', paymentMethod: 'Credit Card', isRecurring: 1, recurrenceInterval: 'monthly' },
      { id: 'tx-8', amount: 50, type: 'expense', category: 'health', date: '2026-06-08', description: 'Gym Monthly Membership', paymentMethod: 'Credit Card', isRecurring: 1, recurrenceInterval: 'monthly' },
      { id: 'tx-9', amount: 850, type: 'income', category: 'freelance', date: '2026-06-10', description: 'Web Design Freelance Milestone 1', paymentMethod: 'Bank Transfer', isRecurring: 0 },
      { id: 'tx-10', amount: 110, type: 'expense', category: 'shopping', date: '2026-06-12', description: 'Sneakers and sports shirt', paymentMethod: 'Credit Card', isRecurring: 0 },
      { id: 'tx-11', amount: 95, type: 'expense', category: 'food', date: '2026-06-15', description: 'Weekly Mid-Month Groceries', paymentMethod: 'Debit Card', isRecurring: 0 },
      { id: 'tx-12', amount: 140, type: 'expense', category: 'food', date: '2026-06-18', description: 'Birthday celebration dinner', paymentMethod: 'Credit Card', isRecurring: 0 },
      { id: 'tx-13', amount: 45, type: 'expense', category: 'transportation', date: '2026-06-19', description: 'Gas tank refill', paymentMethod: 'Debit Card', isRecurring: 0 },
      { id: 'tx-14', amount: 8, type: 'expense', category: 'food', date: '2026-06-20', description: 'Latte & Croissant at Cafe', paymentMethod: 'UPI / Digital Wallet', isRecurring: 0 },
      { id: 'tx-15', amount: 250, type: 'expense', category: 'shopping', date: '2026-06-21', description: 'Noise Cancelling Wireless Earbuds', paymentMethod: 'Credit Card', isRecurring: 0 },
      { id: 'tx-16', amount: 125, type: 'income', category: 'investments', date: '2026-06-22', description: 'Stock portfolio quarterly dividend', paymentMethod: 'Bank Transfer', isRecurring: 0 },
      { id: 'tx-17', amount: 90, type: 'expense', category: 'entertainment', date: '2026-06-22', description: 'Standup Comedy Show Tickets', paymentMethod: 'UPI / Digital Wallet', isRecurring: 0 },
      { id: 'tx-18', amount: 30, type: 'expense', category: 'health', date: '2026-06-23', description: 'Vitamins & Supplements', paymentMethod: 'Debit Card', isRecurring: 0 }
    ];

    for (const t of txs) {
      await db.run(
        `INSERT INTO transactions 
         (id, amount, type, category, date, description, paymentMethod, isRecurring, recurrenceInterval, userId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.amount, t.type, t.category, t.date, t.description, t.paymentMethod, t.isRecurring, t.recurrenceInterval || null, demoUserId]
      );
    }
    console.log('Seeding finished successfully.');
  }

  return db;
}
export default getDatabase;
