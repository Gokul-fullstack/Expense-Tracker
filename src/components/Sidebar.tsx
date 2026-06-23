import type { User } from '../types';
import CategoryIcon from './CategoryIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, darkMode, setDarkMode, user, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'overview', name: 'Overview', icon: 'LayoutDashboard' },
    { id: 'transactions', name: 'Transactions', icon: 'ArrowLeftRight' },
    { id: 'budgets', name: 'PieChart', icon: 'PieChart', displayName: 'Budgets' },
    { id: 'analytics', name: 'BarChart3', icon: 'BarChart3', displayName: 'Analytics' }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="sidebar-brand">
        <div className="brand-logo-container">
          <CategoryIcon name="Wallet" size={24} className="brand-logo-icon" />
        </div>
        <div className="brand-info">
          <span className="brand-name">FinSpire</span>
          <span className="brand-tagline">Personal Wealth</span>
        </div>
      </div>

      {/* User Greeting */}
      <div className="sidebar-profile">
        <div className="avatar-container">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
            alt="User Avatar" 
            className="avatar-img"
          />
          <span className="avatar-status"></span>
        </div>
        <div className="profile-info">
          <span className="profile-name">{user ? user.name : 'Guest'}</span>
          <span className="profile-role">Pro Planner</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <CategoryIcon 
                name={item.icon} 
                size={20} 
                className={`nav-icon ${isActive ? 'active' : ''}`} 
              />
              <span className="nav-label">{item.displayName || item.name}</span>
              {isActive && <span className="active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Settings & Theme Toggle */}
      <div className="sidebar-footer" style={{ gap: '0.35rem' }}>
        <button 
          className="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
        >
          <CategoryIcon name={darkMode ? 'Sun' : 'Moon'} size={18} />
          <span className="toggle-label">{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
        <button 
          className="theme-toggle-btn"
          style={{ color: 'var(--danger)' }}
          onClick={onLogout}
          title="Sign Out"
        >
          <CategoryIcon name="LogOut" size={18} />
          <span className="toggle-label">Log Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
