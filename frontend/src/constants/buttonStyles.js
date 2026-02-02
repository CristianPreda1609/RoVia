/**
 * Utility styles for common button types
 * Ensures consistency across the application
 */

export const buttonStyles = {
  primary: {
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    '&:hover': {
      background: 'var(--accent-hover)',
    },
    '&:disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    }
  },

  secondary: {
    background: 'var(--card-bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    '&:hover': {
      background: 'var(--bg)',
      borderColor: 'var(--accent)',
    }
  },

  ghost: {
    background: 'transparent',
    color: 'var(--text)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    '&:hover': {
      background: 'rgba(59, 130, 246, 0.1)',
    }
  },

  danger: {
    background: 'var(--error)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    '&:hover': {
      background: '#dc2626',
    }
  },

  success: {
    background: 'var(--success)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    '&:hover': {
      background: '#059669',
    }
  }
};

/**
 * Get button style by type and state
 */
export const getButtonStyle = (type = 'primary', isHovering = false, isDisabled = false) => {
  const style = buttonStyles[type] || buttonStyles.primary;
  
  if (isDisabled) {
    return {
      ...style,
      opacity: 0.5,
      cursor: 'not-allowed'
    };
  }

  if (isHovering && style['&:hover']) {
    return {
      ...style,
      ...style['&:hover']
    };
  }

  return style;
};

/**
 * Card hover effect helper
 */
export const getCardStyle = (isHovering = false) => {
  return {
    transition: 'all 200ms ease',
    transform: isHovering ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isHovering ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
  };
};

/**
 * Badge styles
 */
export const badgeStyles = {
  primary: {
    background: 'var(--accent)',
    color: 'white'
  },
  success: {
    background: 'var(--success)',
    color: 'white'
  },
  warning: {
    background: 'var(--warning)',
    color: 'white'
  },
  error: {
    background: 'var(--error)',
    color: 'white'
  },
  neutral: {
    background: 'var(--card-bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)'
  }
};
