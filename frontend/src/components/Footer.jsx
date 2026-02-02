/**
 * Modern Footer Component
 * Professional footer with links and copyright
 */
import { spacing } from '../constants/layout';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--topbar-bg)',
      borderTop: '1px solid var(--border)',
      padding: `${spacing.xl} ${spacing.xl}`,
      marginTop: spacing.xxl,
      marginLeft: '80px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.xl,
          marginBottom: spacing.xl
        }}>
          {/* Brand */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text)',
              margin: 0,
              marginBottom: spacing.md
            }}>
              🌍 RoVia
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--muted)',
              lineHeight: '1.6',
              margin: 0
            }}>
              Explorează frumusețea României și descoperă atracții turistice unice în fiecare regiune.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
              marginBottom: spacing.md,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Navigare
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <a href="/map" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                Harta
              </a>
              <a href="/leaderboard" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                Clasament
              </a>
              <a href="/profile" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                Profil
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
              marginBottom: spacing.md,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Sprijin
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <a href="/contact" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                Contact
              </a>
              <a href="#help" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                Ajutor
              </a>
              <a href="#faq" style={{
                fontSize: '13px',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 200ms ease'
              }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}>
                FAQ
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: spacing.lg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: 'var(--muted)',
            margin: 0
          }}>
            © 2025 RoVia. Toate drepturile rezervate.
          </p>
          <div style={{
            display: 'flex',
            gap: spacing.lg,
            fontSize: '18px'
          }}>
            <a href="#" style={{ textDecoration: 'none', transition: 'transform 200ms ease' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              🐦
            </a>
            <a href="#" style={{ textDecoration: 'none', transition: 'transform 200ms ease' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              📱
            </a>
            <a href="#" style={{ textDecoration: 'none', transition: 'transform 200ms ease' }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              ✉️
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
