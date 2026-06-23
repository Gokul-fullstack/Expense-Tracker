import CategoryIcon from './CategoryIcon';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: string;
}

export function MetricCard({ title, value, icon, trend, color = 'var(--primary)' }: MetricCardProps) {
  return (
    <div className="glass-panel fade-in" style={{ 
      position: 'relative',
      overflow: 'hidden',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      borderRadius: 'var(--radius-md)'
    }}>
      {/* Decorative gradient glow behind the icon */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${color}1A 0%, transparent 70%)`,
        pointerEvents: 'none',
        borderRadius: '50%'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {title}
        </span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: `${color}1A`,
          color: color
        }}>
          <CategoryIcon name={icon} size={20} />
        </div>
      </div>

      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {value}
      </div>

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
          <span style={{ 
            color: trend.isPositive ? 'var(--success)' : 'var(--danger)', 
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
