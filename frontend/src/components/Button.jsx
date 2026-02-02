/**
 * Modern Button Component
 * Professional buttons with multiple variants
 */

export default function Button({
  children,
  type = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  icon = null,
  loading = false,
  style = {}
}) {
  const typeStyles = {
    primary: {
      bg: 'var(--accent)',
      text: 'white',
      hover: 'var(--accent-hover)',
      border: 'none'
    },
    secondary: {
      bg: 'var(--card-bg)',
      text: 'var(--text)',
      hover: 'var(--bg)',
      border: '1px solid var(--border)'
    },
    ghost: {
      bg: 'transparent',
      text: 'var(--text)',
      hover: 'rgba(59, 130, 246, 0.1)',
      border: 'none'
    },
    danger: {
      bg: 'var(--error)',
      text: 'white',
      hover: '#dc2626',
      border: 'none'
    },
    success: {
      bg: 'var(--success)',
      text: 'white',
      hover: '#059669',
      border: 'none'
    }
  };

  const sizes = {
    sm: { padding: '8px 12px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '12px 28px', fontSize: '16px' }
  };

  const theme = typeStyles[type] || typeStyles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = theme.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = theme.bg;
      }}
      style={{
        ...sizes[size],
        background: theme.bg,
        color: theme.text,
        border: theme.border,
        borderRadius: '8px',
        fontWeight: '500',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 200ms ease',
        opacity: disabled || loading ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'inherit',
        ...style
      }}
    >
      {loading && (
        <span style={{
          display: 'inline-block',
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}
