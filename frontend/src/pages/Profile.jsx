import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendsStatus, setFriendsStatus] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchBadgeProgress();
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Nu s-a putut încărca profilul.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeProgress = async () => {
    try {
      console.log('🎖️ Fetching badge progress...');
      const res = await api.get('/profile/me/badge-progress');
      console.log('Badge progress data:', res.data);
      setBadgeProgress(res.data);
    } catch (err) {
      console.error('❌ Error fetching badge progress:', err.response?.data || err.message);
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
      setFormData(res.data);
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

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text)' }}>
      <h2>Se încarcă profilul...</h2>
    </div>
  );

  return (
    <div className="page-container" style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      color: 'var(--text)',
      paddingLeft: '80px',
      paddingTop: '32px',
      paddingBottom: '40px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            👤 Profil Utilizator
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Gestionează-ți informațiile personale</p>
        </div>

        {/* FRIENDS */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px'
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

          {/* SEARCH */}
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

          {/* REQUESTS */}
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

          {/* FRIENDS LIST */}
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
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>ID #{friend.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* PROFILE CARD */}
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

          {/* USERNAME */}
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

          {/* EMAIL */}
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

          {/* ROLE (read-only) */}
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

          {/* STATS */}
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

        {/* BADGE PROGRESS SECTION */}
        {badgeProgress && (
          <div style={{
            marginBottom: '32px',
            marginTop: '32px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '800',
              marginBottom: '16px',
              color: 'var(--text)'
            }}>
              🎖️ Badge-uri ({badgeProgress.UnlockedCount}/{badgeProgress.TotalBadges})
            </h2>
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {badgeProgress.Badges.map(badge => (
                <div key={badge.Id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: badge.IsUnlocked ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(56, 142, 60, 0.1))' : 'var(--card-bg)',
                  opacity: badge.IsUnlocked ? 1 : 0.7,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: '32px',
                        opacity: badge.IsUnlocked ? 1 : 0.5
                      }}>
                        {badge.IconUrl}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '16px',
                          color: badge.IsUnlocked ? 'var(--success)' : 'var(--text)'
                        }}>
                          {badge.Name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--muted)',
                          marginTop: '4px'
                        }}>
                          {badge.Description}
                        </div>
                      </div>
                    </div>
                    {badge.IsUnlocked && (
                      <div style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: 'var(--success)'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      fontWeight: '600'
                    }}>
                      {badge.CurrentProgress} / {badge.RequiredProgress} {badge.ProgressLabel}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: badge.IsUnlocked ? 'var(--success)' : 'var(--accent)'
                    }}>
                      {badge.Percentage.toFixed(0)}%
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: 'var(--border)',
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${badge.Percentage}%`,
                      background: badge.IsUnlocked 
                        ? 'linear-gradient(90deg, var(--success), #81c784)' 
                        : 'linear-gradient(90deg, var(--accent), var(--secondary))',
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }}></div>
                  </div>

                  {!badge.IsUnlocked && badge.RemainingToUnlock > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      marginTop: '8px'
                    }}>
                      📌 Lipsă: {badge.RemainingToUnlock} {badge.ProgressLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: 'grid', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 16px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Înapoi la Dashboard
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            style={{
              padding: '12px 16px',
              background: 'var(--error)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🚪 Deconectare
          </button>
        </div>
      </div>
    </div>
  );
}
