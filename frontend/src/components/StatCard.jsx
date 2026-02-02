/**
 * Modern Stat Card Component
 * Display key metrics with icons and values
 */
import { useState } from 'react';
import { spacing, typography, shadows } from '../constants/layout';

export default function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle,
  color = 'var(--accent)',
  trend
}) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      transition: 'all 200ms ease',
      boxShadow: shadows.sm,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: shadows.lg
      }
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}20`,
          color: color,
          fontSize: '24px'
        }}>
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: trend > 0 ? 'var(--success)' : 'var(--error)',
            background: trend > 0 ? 'var(--success-light)' : 'var(--error-light)',
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div>
        <p style={{
          ...typography.small,
          color: 'var(--muted)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '11px'
        }}>
          {label}
        </p>
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text)',
          marginTop: spacing.sm
        }}>
          {value}
        </div>
        {subtitle && (
          <p style={{
            fontSize: '12px',
            color: 'var(--muted)',
            margin: `${spacing.sm} 0 0 0`
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
