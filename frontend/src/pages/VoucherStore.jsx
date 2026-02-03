import { useEffect, useState } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function VoucherStore() {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('shop');
  const [purchaseLoading, setPurchaseLoading] = useState(null);
  const [profile, setProfile] = useState(null);
  const auth = useAuth();

  const fetchAvailableVouchers = async () => {
    try {
      const { data } = await api.get('/voucher/available');
      console.log('Vouchers from API:', data);
      setAvailableVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
      setError('Nu am putut încărca voucherele');
    }
  };

  const fetchMyVouchers = async () => {
    if (!auth.userId) return;
    try {
      const { data } = await api.get('/voucher/my-vouchers');
      setMyVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch user vouchers', err);
    }
  };

  const fetchProfile = async () => {
    if (!auth.userId) return;
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  useEffect(() => {
    fetchAvailableVouchers();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (auth.userId) {
      fetchMyVouchers();
      fetchProfile();
    }
  }, [auth.userId]);

  const handlePurchaseVoucher = async (voucherId) => {
    if (!auth.userId) {
      setError('Trebuie să te loghezi pentru a cumpăra vouchere');
      return;
    }

    setPurchaseLoading(voucherId);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post(`/voucher/${voucherId}/purchase`);
      setSuccess(data.message);
      
      await fetchAvailableVouchers();
      await fetchMyVouchers();
      await fetchProfile();
      
      setActiveTab('my-vouchers');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la cumpărare');
      setTimeout(() => setError(''), 4000);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleRedeemVoucher = async (userVoucherId) => {
    setPurchaseLoading(userVoucherId);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post(`/voucher/${userVoucherId}/redeem`);
      setSuccess(data.message);
      
      await fetchMyVouchers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Eroare la redeem');
      setTimeout(() => setError(''), 4000);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const daysRemaining = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="page-container" style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      paddingLeft: 'calc(80px + 20px)',
      paddingTop: '40px',
      paddingBottom: '40px',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            🎁 Magazin Recompense
          </h1>
          <p style={{
            margin: 0,
            color: 'var(--muted)',
            fontSize: '16px',
            maxWidth: '600px'
          }}>
            Transformă-ți punctele în vouchere exclusive pentru cazări, restaurante și tururi ghidate
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '2px solid var(--error)',
            background: 'rgba(220, 38, 38, 0.1)',
            color: 'var(--error)',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '2px solid var(--success)',
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--success)',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        {/* POINTS CARD */}
        {auth.userId && profile && (
          <div style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Punctele Mele</p>
            <h2 style={{ margin: '12px 0 0 0', fontSize: '42px', fontWeight: '800' }}>
              {profile.TotalPoints || profile.totalPoints || 0} ⭐
            </h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              Nivel: {profile.LevelName || profile.levelName || 'Explorator'}
            </p>
          </div>
        )}

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '2px solid var(--border)'
        }}>
          <button
            onClick={() => setActiveTab('shop')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'shop' ? '3px solid var(--accent)' : 'none',
              color: activeTab === 'shop' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontSize: '16px'
            }}
          >
            🛍️ Cumpără Vouchere
          </button>
          <button
            onClick={() => setActiveTab('my-vouchers')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'my-vouchers' ? '3px solid var(--accent)' : 'none',
              color: activeTab === 'my-vouchers' ? 'var(--accent)' : 'var(--muted)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontSize: '16px'
            }}
          >
            💳 Voucherele Mele ({myVouchers.length})
          </button>
        </div>

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div>
            {loading ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ color: 'var(--muted)' }}>Se încarcă voucherele...</p>
              </div>
            ) : availableVouchers.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ color: 'var(--muted)' }}>📭 Niciun voucher disponibil în acest moment</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {availableVouchers.map((voucher) => (
                  <div
                    key={voucher.Id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '2px solid var(--border)',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    {/* Badge */}
                    <span style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: 'var(--accent)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      marginBottom: '12px'
                    }}>
                      {voucher.Category || 'General'}
                    </span>

                    {/* Visual Header */}
                    <div style={{
                      width: '100%',
                      height: '160px',
                      background: voucher.Category === 'Cazare' 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : voucher.Category === 'Restaurant'
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : voucher.Category === 'Tur'
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      marginBottom: '16px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                        pointerEvents: 'none'
                      }} />
                      <span style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {voucher.Category === 'Cazare' 
                          ? '🏨'
                          : voucher.Category === 'Restaurant'
                          ? '🍽️'
                          : voucher.Category === 'Tur'
                          ? '🗺️'
                          : '🎁'}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: '0 0 8px 0'
                    }}>
                      {voucher.Title}
                    </h3>

                    <div style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: 'var(--accent)',
                      marginBottom: '12px'
                    }}>
                      {voucher.DiscountType === 'PERCENTAGE' ? `${voucher.DiscountValue}%` : `€${voucher.DiscountValue}`}
                    </div>

                    <p style={{
                      margin: '0 0 16px 0',
                      color: 'var(--muted)',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {voucher.Description}
                    </p>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: '4px 0' }}>
                        📅 Expiră: {formatDate(voucher.ExpiryDate)} ({daysRemaining(voucher.ExpiryDate)} zile)
                      </p>
                      {voucher.MaxUses && (
                        <p style={{ margin: '4px 0' }}>
                          📊 Uses: {voucher.CurrentUses}/{voucher.MaxUses}
                        </p>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      borderTop: '1px solid var(--border)',
                      paddingTop: '16px'
                    }}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: 'var(--accent)'
                      }}>
                        {voucher.CostPoints} ⭐
                      </span>
                      <button
                        onClick={() => handlePurchaseVoucher(voucher.Id)}
                        disabled={purchaseLoading === voucher.Id}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--accent)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          opacity: purchaseLoading === voucher.Id ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (purchaseLoading !== voucher.Id) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {purchaseLoading === voucher.Id ? '...' : 'Cumpără'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY VOUCHERS TAB */}
        {activeTab === 'my-vouchers' && (
          <div>
            {!auth.userId ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ color: 'var(--muted)' }}>🔐 Trebuie să te loghezi pentru a vedea voucherele</p>
              </div>
            ) : myVouchers.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ color: 'var(--muted)' }}>📭 Nu ai vouchere încă. Mergi la Cumpără Vouchere!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {myVouchers.map((userVoucher) => (
                  <div
                    key={userVoucher.Id}
                    style={{
                      background: userVoucher.IsRedeemed ? 'rgba(107, 114, 128, 0.1)' : 'var(--card-bg)',
                      border: userVoucher.IsRedeemed 
                        ? '2px solid var(--muted)' 
                        : isExpired(userVoucher.Voucher.ExpiryDate)
                        ? '2px solid var(--error)'
                        : '2px solid var(--success)',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: 'var(--shadow-md)',
                      opacity: userVoucher.IsRedeemed ? 0.7 : 1
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: userVoucher.IsRedeemed 
                        ? 'var(--muted)' 
                        : isExpired(userVoucher.Voucher.ExpiryDate)
                        ? 'var(--error)'
                        : 'var(--success)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      marginBottom: '12px'
                    }}>
                      {userVoucher.IsRedeemed ? '✅ Folosit' : isExpired(userVoucher.Voucher.ExpiryDate) ? '❌ Expirat' : '🔔 Activ'}
                    </span>

                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: '0 0 8px 0'
                    }}>
                      {userVoucher.Voucher.Title}
                    </h3>

                    <div style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: 'var(--accent)',
                      marginBottom: '12px'
                    }}>
                      {userVoucher.Voucher.DiscountType === 'PERCENTAGE' ? `${userVoucher.Voucher.DiscountValue}%` : `€${userVoucher.Voucher.DiscountValue}`}
                    </div>

                    <div style={{
                      background: 'var(--bg)',
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--muted)', fontSize: '12px' }}>Cod Redeem:</p>
                      <p style={{ margin: 0, fontWeight: '700', wordBreak: 'break-all' }}>{userVoucher.RedemptionCode}</p>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: '4px 0' }}>🛒 Cumpărat: {formatDate(userVoucher.PurchasedAt)}</p>
                      {userVoucher.IsRedeemed && (
                        <p style={{ margin: '4px 0' }}>✅ Folosit: {formatDate(userVoucher.RedeemedAt)}</p>
                      )}
                      {!userVoucher.IsRedeemed && !isExpired(userVoucher.Voucher.ExpiryDate) && (
                        <p style={{ margin: '4px 0' }}>📅 Expiră: {formatDate(userVoucher.Voucher.ExpiryDate)}</p>
                      )}
                    </div>

                    {!userVoucher.IsRedeemed && !isExpired(userVoucher.Voucher.ExpiryDate) && (
                      <button
                        onClick={() => handleRedeemVoucher(userVoucher.Id)}
                        disabled={purchaseLoading === userVoucher.Id}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--success)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          opacity: purchaseLoading === userVoucher.Id ? 0.6 : 1
                        }}
                      >
                        {purchaseLoading === userVoucher.Id ? '...' : 'Marchează ca Folosit'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
