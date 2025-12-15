export function Card({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      border: '1px solid var(--border)',
      transition: 'all 200ms ease',
      ...style
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon }) {
  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>
          {title}
        </h2>
      </div>
      {subtitle && <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{subtitle}</p>}
    </div>
  );
}

export function StatCard({ icon, label, value }) {
  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      border: '1px solid var(--border)',
      transition: 'all 200ms ease'
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'; }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: '500' }}>
        {label}
      </div>
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', ...props }) {
  const baseStyle = {
    border: 'none',
    borderRadius: '10px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
    padding: size === 'sm' ? '8px 12px' : size === 'lg' ? '14px 20px' : '10px 16px',
  };

  const variants = {
    primary: {
      ...baseStyle,
      background: 'var(--accent)',
      color: 'white',
    },
    secondary: {
      ...baseStyle,
      background: 'var(--card-bg)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    danger: {
      ...baseStyle,
      background: '#ef4444',
      color: 'white',
    }
  };

  return (
    <button
      style={variants[variant]}
      {...props}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
}
