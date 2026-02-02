/**
 * Modern Section Component
 * Professional page sections with consistent spacing and typography
 */
import { spacing, typography } from '../constants/layout';

export default function Section({ 
  title, 
  subtitle, 
  children, 
  accentColor = 'var(--accent)',
  style = {}
}) {
  return (
    <section style={{
      padding: `${spacing.xl} 0`,
      ...style
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: spacing.xl }}>
          {title && (
            <h2 style={{
              ...typography.h2,
              color: accentColor,
              marginBottom: spacing.md,
              fontSize: '32px'
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              ...typography.body,
              color: 'var(--muted)',
              maxWidth: '520px',
              lineHeight: '1.6'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
