import { useState } from 'react';
import api from '../services/api';
import type { User } from '../types';
import CategoryIcon from './CategoryIcon';

interface AuthProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Log in
        const res = await api.auth.login({ email, password });
        onAuthSuccess(res.token, res.user);
      } else {
        // Sign up
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        const res = await api.auth.signup({ email, password, name });
        onAuthSuccess(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabToggle = (loginState: boolean) => {
    setIsLogin(loginState);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="auth-page-container fade-in">
      <div className="auth-wrapper">
        
        {/* Left Side: Brand Panel */}
        <div className="auth-brand-panel">
          <div className="auth-brand-logo">
            <CategoryIcon name="Wallet" size={32} />
            <span>FinSpire</span>
          </div>
          
          <h1 className="auth-brand-heading">
            Take Control of Your <br />
            <span>Financial Future</span>
          </h1>
          <p className="auth-brand-sub">
            Track daily expenses, set category budgets, monitor savings goals, and visualize cash flows.
          </p>

          <div className="auth-features-list">
            <div className="feature-item">
              <div className="feature-icon"><CategoryIcon name="CheckCircle" size={16} /></div>
              <span>Real-time income and expense tracking</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><CategoryIcon name="CheckCircle" size={16} /></div>
              <span>Category budget caps with threshold alerts</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><CategoryIcon name="CheckCircle" size={16} /></div>
              <span>End-of-month predictive run-rate forecasts</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><CategoryIcon name="CheckCircle" size={16} /></div>
              <span>Persistent secure cloud database</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-card glass-panel">
            
            {/* Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
                onClick={() => handleTabToggle(true)}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
                onClick={() => handleTabToggle(false)}
              >
                New Account
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="auth-error-alert fade-in">
                <CategoryIcon name="AlertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group fade-in">
                  <label htmlFor="authName">Full Name</label>
                  <input
                    id="authName"
                    type="text"
                    required
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="authEmail">Email Address</label>
                <input
                  id="authEmail"
                  type="email"
                  required
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="authPassword">Password</label>
                <input
                  id="authPassword"
                  type="password"
                  required
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary auth-submit-btn" 
                disabled={loading}
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Auth;
