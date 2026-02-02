/**
 * Modern Card Component
 * Reusable, professional card with hover effects
 */
import { useState } from 'react';
import { shadows, spacing } from '../constants/layout';

export default function Card({ 
  children, 
  hoverable = true, 
  onClick, 
  style = {},
  className = '' 
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: spacing.lg,
        transition: 'all 200ms ease',
        cursor: hoverable && onClick ? 'pointer' : 'default',
        transform: hoverable && isHovering ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hoverable && isHovering ? shadows.lg : shadows.md,
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
}
