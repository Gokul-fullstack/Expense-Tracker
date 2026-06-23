# FinSpire — Premium Full-Stack Expense Analytics Dashboard

**FinSpire** is a premium personal finance tracking and ledger dashboard designed to help users manage, visualize, and budget their daily transactions. The application is built using a modern full-stack TypeScript architecture, utilizing **React** for a responsive UI and **Node/Express + SQLite** for a persistent database layer. All credentials and data operations are fully secured with **JWT (JSON Web Token)** authentication.

---

## Key Features

* 🔐 **Secure User Authentication**: Complete registration and login system. Passwords are encrypted using `bcryptjs` and routes are protected via JWT bearer tokens.
* 📊 **Interactive Financial Analytics**: Rich data visualizations (income vs. expense distribution, monthly trends, and categories breakdown) powered by `Recharts` and animated via `Framer Motion`.
* 💸 **Transaction Ledger**: Complete CRUD operations for adding, updating, and deleting transactions with details like payment methods (Bank Transfer, Credit/Debit, UPI) and recurring intervals.
* 🎯 **Smart Budget Tracking**: Define category-specific monthly budget limits (e.g., Food, Shopping, Transport) that warn you in real-time when approaching or exceeding limits.
* 🏆 **Savings Goals**: Create, edit, and track progress toward savings milestones (e.g., Emergency Fund, New Laptop) with dynamic progress bars.
* 🇮🇳 **Indian Rupee Formatting**: Fully localized currency formatting (`₹`, en-IN locale using lakhs and crores notation).
* 🎨 **Premium Aesthetics**: Sleek dark-mode interface featuring glassmorphic overlays, vibrant gradients, and micro-interactive hover states.

---

## Technical Stack

* **Frontend**: React (v19), TypeScript, Vite (v8), Vanilla CSS (custom HSL color palette, no Tailwind).
* **Backend**: Node.js, Express, SQLite (relational database).
* **Security**: `bcryptjs` (password hashing), `jsonwebtoken` (session handling).
* **Visualization/Animation**: `recharts`, `framer-motion`, `lucide-react`.

---

## Getting Started (Local Development)

To run the application locally on your machine, follow these instructions:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18+) and `npm` installed.

### 1. Clone & Install Dependencies
Clone the repository, navigate to the folder, and install the root packages:
```bash
npm install
```

### 2. Boot the App
Run the dev command to launch both the Express backend and Vite frontend concurrently:
```bash
npm run dev
```

* **Vite Frontend**: Launches on [http://localhost:5173](http://localhost:5173)
* **Express Backend**: Runs on [http://localhost:3001](http://localhost:3001)

### 3. Demo Account Access
For convenience, a default demo account with pre-seeded transaction histories will be generated when the database is initialized. You can sign in using:
* **Email**: `demo@example.com`
* **Password**: `password123`

---

## Relational Database Schema (`expense.db`)

FinSpire uses a local SQLite database file to persist data across user sessions. The schema consists of four relational tables:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  paymentMethod TEXT NOT NULL,
  isRecurring INTEGER NOT NULL,
  recurrenceInterval TEXT,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
  categoryId TEXT NOT NULL,
  limitAmount REAL NOT NULL,
  userId TEXT NOT NULL,
  PRIMARY KEY (categoryId, userId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetAmount REAL NOT NULL,
  currentAmount REAL NOT NULL,
  targetDate TEXT NOT NULL,
  userId TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Cloud Deployment (Render)

This project is optimized to run as a single Web Service on **Render** (render.com). It serves static files from the `dist/` directory and API requests from the `/api` route.

### Deploying for Free (No Credit Card Required)
1. Log in to [Render](https://render.com).
2. Click **New** -> **Web Service**.
3. Connect this GitHub repository.
4. Input the following settings:
   * **Runtime**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm run start`
   * **Instance Type**: Select **Free**
5. Click **Advanced** and add one environment variable:
   * **Key**: `JWT_SECRET`
   * **Value**: *(Type a secure random string of your choice)*
6. Click **Deploy Web Service**.

*Note: Since Render's free tier uses an ephemeral disk, your SQLite database file (`expense.db`) will reset back to the default demo user data when the server spins down. For permanent production storage, you can attach a paid Render Persistent Disk and set the `DATABASE_PATH` env variable to point to it (e.g., `/var/data/expense.db`), or migrate to a managed database.*
