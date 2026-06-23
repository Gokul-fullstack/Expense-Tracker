import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from './db.js';
import { authenticateToken, JWT_SECRET } from './middleware.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Database connection on boot
let db;
try {
  db = await getDatabase();
  console.log('Successfully connected to SQLite database (expense.db)');
} catch (error) {
  console.error('Failed to initialize database on startup:', error);
  process.exit(1);
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// User Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  try {
    // Check if user email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = 'user-' + Date.now();
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Save user to DB
    await db.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [userId, email.toLowerCase(), hashedPassword, name]
    );

    // Generate JWT Token
    const userPayload = { id: userId, email: email.toLowerCase(), name };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: userPayload });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Database error occurred during signup.' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const userPayload = { id: user.id, email: user.email, name: user.name };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: userPayload });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Database error occurred during login.' });
  }
});

// Token check & session validation
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------
// TRANSACTION ROUTES (SECURED)
// ----------------------------------------------------

// Get user-specific transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await db.all(
      'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC',
      [req.user.id]
    );
    // Convert isRecurring from 0/1 back to boolean for React
    const formatted = transactions.map(t => ({
      ...t,
      isRecurring: t.isRecurring === 1
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error loading transactions:', err);
    res.status(500).json({ error: 'Error loading transactions.' });
  }
});

// Create or save new transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { id, amount, type, category, date, description, paymentMethod, isRecurring, recurrenceInterval } = req.body;

  if (!amount || !type || !category || !date || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required transaction fields.' });
  }

  const txId = id || 'tx-' + Date.now();
  const dbIsRecurring = isRecurring ? 1 : 0;

  try {
    await db.run(
      `INSERT INTO transactions 
       (id, amount, type, category, date, description, paymentMethod, isRecurring, recurrenceInterval, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, amount, type, category, date, description || '', paymentMethod, dbIsRecurring, recurrenceInterval || null, req.user.id]
    );

    const savedTx = {
      id: txId,
      amount,
      type,
      category,
      date,
      description,
      paymentMethod,
      isRecurring: !!isRecurring,
      recurrenceInterval
    };

    res.status(201).json(savedTx);
  } catch (err) {
    console.error('Error saving transaction:', err);
    res.status(500).json({ error: 'Error writing transaction database log.' });
  }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, date, description, paymentMethod, isRecurring, recurrenceInterval } = req.body;

  try {
    // Check ownership first
    const tx = await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction record not found or access denied.' });
    }

    const dbIsRecurring = isRecurring ? 1 : 0;
    await db.run(
      `UPDATE transactions 
       SET amount = ?, type = ?, category = ?, date = ?, description = ?, paymentMethod = ?, isRecurring = ?, recurrenceInterval = ? 
       WHERE id = ? AND userId = ?`,
      [amount, type, category, date, description, paymentMethod, dbIsRecurring, recurrenceInterval || null, id, req.user.id]
    );

    res.json({ id, amount, type, category, date, description, paymentMethod, isRecurring, recurrenceInterval });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify ownership
    const tx = await db.get('SELECT * FROM transactions WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction record not found or access denied.' });
    }

    await db.run('DELETE FROM transactions WHERE id = ? AND userId = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

// ----------------------------------------------------
// BUDGET LIMIT ROUTES (SECURED)
// ----------------------------------------------------

// Get user budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const budgets = await db.all('SELECT * FROM budgets WHERE userId = ?', [req.user.id]);
    // Format to match React frontend props: limitAmount -> limit
    const formatted = budgets.map(b => ({
      categoryId: b.categoryId,
      limit: b.limitAmount
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error loading budgets:', err);
    res.status(500).json({ error: 'Error loading budget configuration.' });
  }
});

// Set or Update category budget
app.post('/api/budgets', authenticateToken, async (req, res) => {
  const { categoryId, limit } = req.body;

  if (!categoryId || limit === undefined) {
    return res.status(400).json({ error: 'Category ID and limit amount required.' });
  }

  try {
    await db.run(
      `INSERT OR REPLACE INTO budgets (categoryId, limitAmount, userId) VALUES (?, ?, ?)`,
      [categoryId, limit, req.user.id]
    );
    res.status(200).json({ categoryId, limit });
  } catch (err) {
    console.error('Error saving budget:', err);
    res.status(500).json({ error: 'Failed to save budget limit.' });
  }
});

// Delete category budget
app.delete('/api/budgets/:categoryId', authenticateToken, async (req, res) => {
  const { categoryId } = req.params;

  try {
    await db.run(
      'DELETE FROM budgets WHERE categoryId = ? AND userId = ?',
      [categoryId, req.user.id]
    );
    res.json({ success: true, message: 'Budget limit removed successfully.' });
  } catch (err) {
    console.error('Error removing budget:', err);
    res.status(500).json({ error: 'Failed to remove budget limit.' });
  }
});

// ----------------------------------------------------
// SAVINGS GOALS ROUTES (SECURED)
// ----------------------------------------------------

// Get goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await db.all('SELECT * FROM savings_goals WHERE userId = ?', [req.user.id]);
    res.json(goals);
  } catch (err) {
    console.error('Error loading goals:', err);
    res.status(500).json({ error: 'Error loading goals.' });
  }
});

// Create/Update goal
app.post('/api/goals', authenticateToken, async (req, res) => {
  const { id, name, targetAmount, currentAmount, targetDate } = req.body;

  if (!name || targetAmount === undefined || currentAmount === undefined || !targetDate) {
    return res.status(400).json({ error: 'Missing required goals fields.' });
  }

  const goalId = id || 'goal-' + Date.now();

  try {
    await db.run(
      `INSERT OR REPLACE INTO savings_goals (id, name, targetAmount, currentAmount, targetDate, userId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [goalId, name, targetAmount, currentAmount, targetDate, req.user.id]
    );
    res.status(200).json({ id: goalId, name, targetAmount, currentAmount, targetDate });
  } catch (err) {
    console.error('Error saving savings goal:', err);
    res.status(500).json({ error: 'Failed to save savings goal.' });
  }
});

// Delete goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const goal = await db.get('SELECT * FROM savings_goals WHERE id = ? AND userId = ?', [id, req.user.id]);
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal record not found or access denied.' });
    }

    await db.run('DELETE FROM savings_goals WHERE id = ? AND userId = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Savings goal deleted successfully.' });
  } catch (err) {
    console.error('Error deleting savings goal:', err);
    res.status(500).json({ error: 'Failed to delete savings goal.' });
  }
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`FinSpire backend server is running on http://localhost:${PORT}`);
});
