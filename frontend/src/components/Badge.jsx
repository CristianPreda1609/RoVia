/**
 * Modern Badge Component
 * Status indicators with semantic colors
 */

export default function Badge({ 
  children, 
  type = 'primary',
  icon = null,
  size = 'md'
}) {
  const typeStyles = {
    primary: {
      bg: 'var(--accent)',
      text: 'white'
    },
    success: {
      bg: 'var(--success)',
      text: 'white'
    },
    warning: {
      bg: 'var(--warning)',
      text: 'white'
    },
    error: {
      bg: 'var(--error)',
      text: 'white'
    },
    neutral: {
      bg: 'var(--card-bg)',
      text: 'var(--text)',
      border: '1px solid var(--border)'
    }
  };

  const sizes = {
    sm: { padding: '3px 8px', fontSize: '11px' },
    md: { padding: '6px 12px', fontSize: '13px' },
    lg: { padding: '8px 16px', fontSize: '14px' }
  };

  const style = typeStyles[type] || typeStyles.primary;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      ...sizes[size],
      borderRadius: '999px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      background: style.bg,
      color: style.text,
      border: style.border || 'none',
      transition: 'all 200ms ease'
    }}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
