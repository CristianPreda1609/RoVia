import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRankEntry, setUserRankEntry] = useState(null);
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendsStatus, setFriendsStatus] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const initialTab = useMemo(() => {
    return searchParams.get('tab') === 'account' ? 'account' : 'overview';
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    fetchDashboardData();
    fetchFriends();
    fetchFriendRequests();
    fetchInviteCode();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, leaderboardRes, rankRes, badgeRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/profile/leaderboard?take=3'),
        api.get('/profile/leaderboard/me'),
        api.get('/profile/me/badge-progress').catch(() => ({ data: null }))
      ]);

      setProfile(profileRes.data);
      setFormData(profileRes.data || {});
      setLeaderboard(leaderboardRes.data || []);
      setUserRankEntry(rankRes.data || null);
      setBadgeProgress(badgeRes?.data || null);
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

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data || []);
    } catch (err) {
      setFriendsStatus({ type: 'error', message: 'Nu am putut încărca lista de prieteni.' });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setFriendRequests(res.data || []);
    } catch (err) {
      setFriendsStatus({ type: 'error', message: 'Nu am putut încărca cererile de prietenie.' });
    }
  };

  const handleSearchFriends = async () => {
    if (!friendQuery.trim()) {
      setFriendSearchResults([]);
      return;
    }

    try {
      const res = await api.get('/friends/search', { params: { query: friendQuery.trim() } });
      setFriendSearchResults(res.data || []);
    } catch (err) {
      setFriendsStatus({ type: 'error', message: 'Căutarea a eșuat.' });
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setFriendsStatus({ type: 'success', message: 'Cerere de prietenie trimisă.' });
      setFriendSearchResults([]);
      setFriendQuery('');
      fetchFriendRequests();
    } catch (err) {
      setFriendsStatus({ type: 'error', message: err.response?.data?.message || 'Nu am putut trimite cererea.' });
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      setFriendsStatus({ type: 'success', message: 'Cerere acceptată.' });
      fetchFriendRequests();
      fetchFriends();
    } catch (err) {
      setFriendsStatus({ type: 'error', message: 'Nu am putut accepta cererea.' });
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      await api.post(`/friends/reject/${requestId}`);
      setFriendsStatus({ type: 'success', message: 'Cerere respinsă.' });
      fetchFriendRequests();
    } catch (err) {
      setFriendsStatus({ type: 'error', message: 'Nu am putut respinge cererea.' });
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      setFriendsStatus({ type: 'success', message: 'Prieten eliminat.' });
      fetchFriends();
    } catch (err) {
      setFriendsStatus({ type: 'error', message: err.response?.data?.message || 'Nu am putut elimina prietenul.' });
    }
  };

  const fetchInviteCode = async () => {
    try {
      const res = await api.get('/profile/me/invite-code');
      setInviteCode(res.data.inviteCode || '');
    } catch (err) {
      console.error('Failed to fetch invite code:', err);
    }
  };

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/register?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(true);
    
    // Track invite challenge
    try {
      await api.post('/challenges/track-invite');
      console.log('✓ Challenge tracked');
    } catch (err) {
      console.error('Error tracking invite challenge:', err);
    }
    
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text)' }}>
      <h2>Se încarcă profilul...</h2>
    </div>
  );

  const badgeList = badgeProgress?.Badges || [];
  const unlockedBadges = badgeList.filter(badge => badge.IsUnlocked);
  const roleName = (profile?.Role || auth.role || '').toString().toLowerCase();
  const showActivityPoints = roleName === 'promoter' || roleName === 'administrator';

  return (
    <div className="page-container" style={{
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

              {showActivityPoints && (
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏛️</div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Puncte activitate</h3>
                  </div>
                  <p style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{profile?.ActivityPoints ?? 0}</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Contribuții turistice</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
              {/* RECENT QUIZZES */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', alignSelf: 'start' }}>
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
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', alignSelf: 'start' }}>
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

              {/* BADGES */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', alignSelf: 'start' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Insigne</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>{badgeProgress?.UnlockedCount ?? unlockedBadges.length ?? (profile?.badges || profile?.Badges || []).length}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '13px' }}>insigne deblocate</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {(unlockedBadges.length ? unlockedBadges : (profile?.badges || profile?.Badges || [])).slice(0, 6).map((badge, idx) => (
                    <div
                      key={badge.id || badge.Id || idx}
                      title={`${badge.name || badge.Name}${badge.description || badge.Description ? ` — ${badge.description || badge.Description}` : ''}`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}
                    >
                      {badge.iconUrl || badge.IconUrl || '🏅'}
                    </div>
                  ))}
                  {(unlockedBadges.length === 0 && (profile?.badges || profile?.Badges || []).length === 0) && (
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Încă nu ai insigne.</div>
                  )}
                </div>

                <button
                  onClick={() => setShowAllBadges(prev => !prev)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: 'var(--accent)',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {showAllBadges ? 'Ascunde toate insignele' : 'Vezi toate insignele'}
                </button>

                {showAllBadges && (
                  <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
                    {badgeList.map((badge) => (
                      <div key={badge.Id} style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: badge.IsUnlocked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '20px' }}>{badge.IconUrl}</div>
                            <div>
                              <div style={{ fontWeight: '700' }}>{badge.Name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{badge.Description}</div>
                            </div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: badge.IsUnlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                            color: badge.IsUnlocked ? 'var(--success)' : 'var(--accent)',
                            fontWeight: '700'
                          }}>
                            {badge.IsUnlocked ? 'Deblocat' : 'În progres'}
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                          Necesare: {badge.RequiredProgress} {badge.ProgressLabel || ''} · Ai: {badge.CurrentProgress}
                        </div>
                        {!badge.IsUnlocked && badge.RemainingToUnlock > 0 && (
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--muted)' }}>
                            Îți mai lipsesc: {badge.RemainingToUnlock} {badge.ProgressLabel || ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NEWS & RECOMMENDATIONS CTA */}
              <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Noutăți & recomandări</h2>
                <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
                  Vezi cele mai noi atracții și recomandări turistice.
                </div>
                <button
                  onClick={() => navigate('/recommendations')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Deschide recomandările
                </button>
              </div>

            </div>
          </>
        )}

        {activeTab === 'account' && (
          <>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '20px'
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
            {/* INVITE FRIENDS SECTION */}
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>🎁 Invită prieteni</h2>
              
              <p style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '14px' }}>
                Trimite linkul tău de invitație prietenilor. Când se înregistrează, primești puncte la provocările "Invită prieteni"!
              </p>

              {inviteCode && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/register?invite=${inviteCode}`}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={copyInviteLink}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background: copiedInvite ? 'var(--success)' : 'var(--accent)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copiedInvite ? '✓ Copiat!' : '📋 Copiază'}
                  </button>
                </div>
              )}
            </div>
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>🤝 Prieteni</h2>

              {friendsStatus && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: friendsStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: friendsStatus.type === 'success' ? 'var(--success)' : 'var(--error)'
                }}>
                  {friendsStatus.message}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: 'var(--muted)' }}>
                  Caută utilizatori
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                    placeholder="Nume utilizator sau email..."
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  />
                  <button
                    onClick={handleSearchFriends}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Caută
                  </button>
                </div>
              </div>

              {friendSearchResults.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
                  {friendSearchResults.map(user => (
                    <div key={user.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>{user.username}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.totalPoints || 0} XP</div>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(user.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--secondary)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        + Adaugă
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Cererile primite</h3>
                {friendRequests.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Nu ai cereri noi.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {friendRequests.map(req => (
                      <div key={req.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{req.requester?.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{req.requester?.totalPoints || 0} XP</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptFriendRequest(req.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--success)',
                              color: 'white',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Acceptă
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(req.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--error)',
                              color: 'white',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Respinge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Lista de prieteni</h3>
                {friends.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Nu ai prieteni încă.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {friends.map(friend => (
                      <div key={friend.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '700' }}>{friend.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{friend.totalPoints || 0} XP</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>ID #{friend.id}</span>
                          <button
                            onClick={() => handleUnfriend(friend.id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--error)',
                              color: 'white',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Unfriend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}


      </div>
    </div>
  );
}