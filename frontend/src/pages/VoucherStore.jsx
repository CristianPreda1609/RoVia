import { useEffect, useMemo, useState } from 'react';
import profileService from '../services/profileService';
import useAuth from '../hooks/useAuth';
import {
  FOUR_WEEKS_MS,
  getWalletKey,
  getActiveRedemptions,
  persistRedemptions,
  calculateSpentPoints,
  generateVoucherCode
} from '../utils/voucherWallet';

const VOUCHERS = [
  {
    id: 'voucher-5',
    title: 'Escapadă Urbană',
    discount: 5,
    cost: 400,
    icon: '🏙️',
    accent: '#9945ff'
  },
  {
    id: 'voucher-10',
    title: 'Weekend Epic',
    discount: 10,
    cost: 850,
    icon: '🏕️',
    accent: '#ff6b35'
  },
  {
    id: 'voucher-15',
    title: 'Expediție Premium',
    discount: 15,
    cost: 1450,
    icon: '🏔️',
    accent: '#00d9ff'
  }
];

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

export default function VoucherStore() {
  const auth = useAuth();
  const walletKey = getWalletKey(auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const syncWallet = () => setRedemptions(getActiveRedemptions(walletKey));
    syncWallet();
    window.addEventListener('storage', syncWallet);
    return () => window.removeEventListener('storage', syncWallet);
  }, [walletKey]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getMyProfile();
        setProfile({
          totalPoints: data.totalPoints ?? data.TotalPoints ?? 0,
          levelName: data.levelName ?? data.LevelName ?? 'Explorator'
        });
      } catch (err) {
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const spentPoints = useMemo(() => calculateSpentPoints(redemptions), [redemptions]);
  const availablePoints = Math.max(0, (profile?.totalPoints ?? 0) - spentPoints);

  const handleRedeem = (voucher) => {
    if (!profile) return;
    if (availablePoints < voucher.cost) {
      setStatus({ type: 'error', message: 'Puncte insuficiente!' });
      return;
    }

    const code = generateVoucherCode(voucher.discount);
    const payload = {
      ...redemptions,
      [voucher.id]: {
        code,
        label: voucher.title,
        cost: voucher.cost,
        redeemedAt: Date.now(),
        expiresAt: Date.now() + FOUR_WEEKS_MS
      }
    };

    setRedemptions(payload);
    persistRedemptions(walletKey, payload);
    setStatus({ type: 'success', message: `✅ Voucher revendicat! Codul: ${code}` });
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus({ type: 'success', message: '📋 Codul copiat!' });
    } catch {
      setStatus({ type: 'warning', message: 'Nu am reușit să copiez codul.' });
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--muted)'
      }}>
        Se încarcă magazinul...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      paddingLeft: '80px',
      paddingTop: '24px',
      paddingBottom: '40px',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🎁 Magazin Vouchere
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '16px' }}>
            Transformă-ți punctele în vouchere exclusive pentru cazări și experiențe turistice
          </p>
        </div>

        {/* STATUS BANNER */}
        {status && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: `2px solid ${status.type === 'success' ? 'var(--success)' : status.type === 'error' ? 'var(--error)' : 'var(--warning)'}`,
            background: status.type === 'success' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : status.type === 'error' 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(245, 158, 11, 0.1)',
            color: status.type === 'success' 
              ? 'var(--success)' 
              : status.type === 'error' 
              ? 'var(--error)' 
              : 'var(--warning)'
          }}>
            {status.message}
          </div>
        )}

        {/* POINTS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Puncte Disponibile</p>
            <p style={{ margin: '12px 0 0 0', fontSize: '28px', fontWeight: '800' }}>{availablePoints}</p>
          </div>

          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Puncte Rezervate</p>
            <p style={{ margin: '12px 0 0 0', fontSize: '28px', fontWeight: '800', color: 'var(--secondary)' }}>{spentPoints}</p>
          </div>

          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Total Puncte</p>
            <p style={{ margin: '12px 0 0 0', fontSize: '28px', fontWeight: '800', color: 'var(--tertiary)' }}>{profile?.totalPoints ?? 0}</p>
          </div>
        </div>

        {/* VOUCHERS GRID */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>💳 Vouchere Disponibile</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {VOUCHERS.map(voucher => (
              <div
                key={voucher.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '32px' }}>{voucher.icon}</div>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: voucher.accent
                  }}>
                    -{voucher.discount}%
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>
                  {voucher.title}
                </h3>

                <p style={{ margin: '0 0 20px 0', color: 'var(--muted)', fontSize: '14px' }}>
                  Reducere pe cazări și tururi ghidate
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px'
                }}>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: 'var(--accent)'
                  }}>
                    {voucher.cost} ⭐
                  </span>
                  <button
                    onClick={() => handleRedeem(voucher)}
                    disabled={availablePoints < voucher.cost}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: availablePoints >= voucher.cost ? voucher.accent : 'var(--muted)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: availablePoints >= voucher.cost ? 'pointer' : 'not-allowed',
                      opacity: availablePoints >= voucher.cost ? 1 : 0.5,
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      if (availablePoints >= voucher.cost) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {availablePoints >= voucher.cost ? 'Revendică' : 'Insuficient'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE VOUCHERS */}
        {Object.keys(redemptions).length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>✅ Voucherele Mele Active</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {Object.entries(redemptions).map(([voucherId, redemption]) => {
                const voucher = VOUCHERS.find(v => v.id === voucherId);
                if (!voucher) return null;

                return (
                  <div
                    key={voucherId}
                    style={{
                      background: 'var(--card-bg)',
                      border: `2px solid ${voucher.accent}`,
                      borderRadius: '12px',
                      padding: '20px'
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Voucher Activ</p>
                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '18px',
                        fontWeight: '800',
                        letterSpacing: '2px',
                        color: voucher.accent
                      }}>
                        {redemption.code}
                      </p>
                    </div>

                    <p style={{ margin: '12px 0', fontSize: '13px', color: 'var(--muted)' }}>
                      {voucher.title} • -{voucher.discount}%
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--muted)'
                      }}>
                        Expiră: {formatDate(redemption.expiresAt)}
                      </p>
                      <button
                        onClick={() => handleCopyCode(redemption.code)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: voucher.accent,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Copiază
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
