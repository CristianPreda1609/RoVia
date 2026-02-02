import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRankEntry, setUserRankEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const initialTab = useMemo(() => {
    return searchParams.get('tab') === 'account' ? 'account' : 'overview';
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, leaderboardRes, rankRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/profile/leaderboard?take=3'),
        api.get('/profile/leaderboard/me')
      ]);

      setProfile(profileRes.data);
      setFormData(profileRes.data || {});
      setLeaderboard(leaderboardRes.data || []);
      setUserRankEntry(rankRes.data || null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Don't block UI on error, just show empty state
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'account') {
      setSearchParams({ tab: 'account' });
    } else {
      setSearchParams({});
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await api.put('/profile/me', {
        Username: formData.Username,
        Email: formData.Email
      });
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setFormData(res.data || {});
      setIsEditing(false);
    } catch (err) {
      setError('❌ ' + (err.response?.data?.message || 'Eroare la salvare'));
    }
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text)' }}>
      <h2>Se încarcă profilul...</h2>
    </div>
  );

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      color: 'var(--text)',
      paddingLeft: '80px', // Sidebar padding adjustment
      paddingTop: '32px',
      paddingBottom: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ 
              fontSize: 'clamp(24px, 5vw, 36px)', 
              fontWeight: '800', 
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Salut, {profile?.Username || auth.username || 'Exploratorule'}! 👋
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Bine ai venit în panoul tău de control.</p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '12px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => handleTabChange('overview')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: activeTab === 'overview' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeTab === 'overview' ? 'rgba(99, 102, 241, 0.12)' : 'var(--card-bg)',
              color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Rezumat
          </button>
          <button
            onClick={() => handleTabChange('account')}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: activeTab === 'account' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeTab === 'account' ? 'rgba(99, 102, 241, 0.12)' : 'var(--card-bg)',
              color: activeTab === 'account' ? 'var(--accent)' : 'var(--text)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Setări cont
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* STATS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {/* XP Card */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Experiență (XP)</h3>
                </div>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{profile?.TotalPoints || 0}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Continua să explorezi!</p>
              </div>

              {/* Role Card */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Rang</h3>
                </div>
                <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--success)' }}>
                    {profile?.Role || auth.role || 'Călător'}
                </p>
                 <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Status curent</p>
              </div>

              {/* Quizzes Taken */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📚</div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Quiz-uri</h3>
                </div>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{profile?.QuizzesCompleted ?? '-'}</p>
                 <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Teste finalizate</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {/* RECENT QUIZZES */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Ultimele quiz-uri</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(profile?.RecentProgress || []).slice(0, 6).map((item, idx) => (
                    <div key={idx} style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{item.title || 'Quiz'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.name || 'Atracție'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(item.completedAt || Date.now()).toLocaleDateString('ro-RO')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: 'var(--accent)' }}>+{item.pointsEarned || 0} XP</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.correctAnswers || 0}/{item.totalQuestions || 0} corecte</div>
                      </div>
                    </div>
                  ))}
                  {(!profile?.RecentProgress || profile.RecentProgress.length === 0) && (
                    <p style={{ color: 'var(--muted)' }}>Nu există activitate recentă.</p>
                  )}
                </div>
              </div>

              {/* LEADERBOARD MINI */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Top Exploratori</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {leaderboard.map((user, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '800', width: '24px', color: idx < 3 ? 'var(--accent)' : 'var(--muted)' }}>{getRankBadge(idx + 1)}</span>
                        <span style={{ fontWeight: '600' }}>{user.Username}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{user.TotalPoints} XP</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <p style={{ color: 'var(--muted)' }}>Se încarcă clasamentul...</p>}
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(99,102,241,0.08)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Poziția ta globală</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: '700' }}>{userRankEntry?.Username || profile?.Username || 'Tu'}</div>
                    <div style={{ fontWeight: '800', color: 'var(--accent)' }}>#{userRankEntry?.Rank || '-'}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{userRankEntry?.TotalPoints || 0} XP</div>
                </div>
              </div>

            </div>
          </>
        )}

        {activeTab === 'account' && (
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '32px'
          }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Informații Personale</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '8px 16px',
                  background: isEditing ? 'var(--error)' : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? '✗ Anulează' : '✏️ Editează'}
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                Utilizator
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.Username || ''}
                  onChange={(e) => setFormData({ ...formData, Username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '16px' }}>{profile?.Username}</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.Email || ''}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: '16px' }}>{profile?.Email}</p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                Rol
              </label>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'var(--accent)',
                fontWeight: '600'
              }}>
                {profile?.Role || 'Utilizator'}
              </p>
            </div>

            <div style={{
              paddingTop: '20px',
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                  Experiență (XP)
                </label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>
                  {profile?.TotalPoints || 0} ⭐
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                  Quiz-uri Finalizate
                </label>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                  {profile?.QuizzesCompleted || 0}
                </p>
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleSaveProfile}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                💾 Salvează Schimbări
              </button>
            )}
          </div>
        )}


      </div>
    </div>
  );
}