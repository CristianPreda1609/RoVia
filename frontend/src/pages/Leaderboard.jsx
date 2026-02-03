import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const REFRESH_INTERVAL = 15000;

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return 'N/A';
  }
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMonthly, setIsMonthly] = useState(false);
  const [scope, setScope] = useState('global');
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [challengeTab, setChallengeTab] = useState('daily');
  const [challenges, setChallenges] = useState({ Daily: [], Weekly: [] });
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState('');
  const auth = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      if (scope === 'friends' && !auth?.userId) {
        setEntries([]);
        setTotalItems(0);
        setError('Trebuie să fii autentificat pentru clasamentul de prieteni.');
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      const effectiveSort = sortBy === 'monthlyPoints' && !isMonthly ? 'totalPoints' : sortBy;
      const endpoint = scope === 'friends' ? '/profile/leaderboard/friends' : '/profile/leaderboard/paged';
      const { data } = await api.get(endpoint, {
        params: {
          monthly: isMonthly,
          page,
          pageSize,
          sortBy: effectiveSort,
          order: sortOrder
        }
      });

      setEntries(Array.isArray(data?.items) ? data.items : []);
      setTotalItems(typeof data?.total === 'number' ? data.total : 0);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
      if (scope === 'friends' && !auth?.userId) {
        setError('Trebuie să fii autentificat pentru clasamentul de prieteni.');
      } else {
        setError('Nu am putut actualiza leaderboard-ul. Încearcă din nou.');
      }
    } finally {
      setLoading(false);
    }
  }, [auth?.userId, isMonthly, page, pageSize, scope, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeaderboard();
    const intervalId = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);

  const fetchChallenges = useCallback(async () => {
    try {
      const url = auth?.userId ? `/challenges/active?userId=${auth.userId}` : '/challenges/active';
      const { data } = await api.get(url);
      setChallenges({
        Daily: Array.isArray(data?.Daily) ? data.Daily : [],
        Weekly: Array.isArray(data?.Weekly) ? data.Weekly : []
      });
      setChallengesError('');
    } catch (err) {
      console.error('Challenges fetch failed', err);
      setChallengesError('Nu am putut încărca provocările.');
    } finally {
      setChallengesLoading(false);
    }
  }, [auth?.userId]);

  const handleAcceptChallenge = async (challengeId) => {
    if (!auth?.userId) {
      alert('Trebuie să fii autentificat pentru a accepta provocări!');
      return;
    }
    try {
      await api.post(`/challenges/${challengeId}/accept`, auth.userId);
      await fetchChallenges(); // Reîncarcă provocările cu progress actualizat
    } catch (err) {
      console.error('Accept challenge failed', err);
      alert('Nu am putut accepta provocarea. Încearcă din nou.');
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [totalItems, pageSize]);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getMedalColor = (rank) => {
    if (rank === 1) return 'var(--warning)';
    if (rank === 2) return '#9ca3af';
    if (rank === 3) return '#d97706';
    return 'var(--accent)';
  };

  return (
    <div className="page-container" style={{ 
      padding: '40px 20px',
      paddingLeft: 'calc(80px + 20px)',
      minHeight: 'calc(100vh - 56px)', 
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ 
                fontSize: '36px', 
                fontWeight: '800',
                margin: '0 0 12px 0',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🏆 {scope === 'friends' ? 'Clasament Prieteni' : 'Clasament Global'}
              </h1>
              <p style={{
                margin: 0,
                color: 'var(--muted)',
                fontSize: '16px',
                maxWidth: '600px'
              }}>
                Eroii RoVia în timp real. Clasamentul se actualizează automat.
              </p>
            </div>
            
            {/* Tab Selector */}
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--topbar-bg)',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <button
                  onClick={() => { setIsMonthly(false); setSortBy('totalPoints'); setPage(1); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: !isMonthly ? 'var(--accent)' : 'transparent',
                    color: !isMonthly ? 'white' : 'var(--muted)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontSize: '14px'
                  }}
                >
                  🏆 All-time
                </button>
                <button
                  onClick={() => { setIsMonthly(true); setSortBy('monthlyPoints'); setPage(1); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isMonthly ? 'var(--accent)' : 'transparent',
                    color: isMonthly ? 'white' : 'var(--muted)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontSize: '14px'
                  }}
                >
                  📅 Lunar
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--topbar-bg)',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <button
                  onClick={() => { setScope('global'); setPage(1); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: scope === 'global' ? 'var(--accent)' : 'transparent',
                    color: scope === 'global' ? 'white' : 'var(--muted)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontSize: '14px'
                  }}
                >
                  🌍 Global
                </button>
                <button
                  onClick={() => { setScope('friends'); setPage(1); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: scope === 'friends' ? 'var(--accent)' : 'transparent',
                    color: scope === 'friends' ? 'white' : 'var(--muted)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontSize: '14px'
                  }}
                >
                  👥 Prieteni
                </button>
              </div>
            </div>
          </div>

          {lastUpdated && (
            <span style={{ 
              fontSize: '12px', 
              color: 'var(--muted)',
              marginTop: '8px',
              display: 'block'
            }}>
              ⟳ {lastUpdated.toLocaleTimeString('ro-RO')}
            </span>
          )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px 12px'
            }}>
              <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Sortare</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value={isMonthly ? 'monthlyPoints' : 'totalPoints'}>Puncte</option>
                <option value="quizzesCompleted">Quiz-uri finalizate</option>
                <option value="joinedAt">Data înscrierii</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>🎯 Provocări active</div>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  background: 'var(--topbar-bg)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => setChallengeTab('daily')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: challengeTab === 'daily' ? 'var(--accent)' : 'transparent',
                      color: challengeTab === 'daily' ? 'white' : 'var(--muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setChallengeTab('weekly')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: challengeTab === 'weekly' ? 'var(--accent)' : 'transparent',
                      color: challengeTab === 'weekly' ? 'white' : 'var(--muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {challengesLoading ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Se încarcă provocările...</div>
              ) : challengesError ? (
                <div style={{ color: 'var(--error)', fontSize: '13px' }}>{challengesError}</div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {(challengeTab === 'daily' ? challenges.Daily : challenges.Weekly).map((challenge) => {
                    const isAccepted = challenge.IsAccepted || false;
                    const isCompleted = challenge.IsCompleted || false;
                    const progress = challenge.Progress || 0;
                    const target = challenge.Target || 1;
                    const progressPercent = isAccepted ? Math.min((progress / target) * 100, 100) : 0;

                    return (
                      <div key={challenge.Id} style={{
                        borderRadius: '12px',
                        border: `1px solid ${isCompleted ? '#22c55e' : isAccepted ? 'var(--accent)' : 'var(--border)'}`,
                        padding: '10px 12px',
                        background: isCompleted ? 'rgba(34, 197, 94, 0.08)' : isAccepted ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-secondary)',
                        cursor: isAccepted ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isCompleted ? 0.7 : 1
                      }}
                      onClick={() => !isAccepted && handleAcceptChallenge(challenge.Id)}
                      onMouseEnter={(e) => !isAccepted && (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={(e) => !isAccepted && (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        {isAccepted && !isCompleted && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            height: '3px',
                            width: `${progressPercent}%`,
                            background: 'var(--accent)',
                            transition: 'width 0.3s'
                          }} />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {challenge.Title}
                            {isCompleted && <span style={{ fontSize: '16px' }}>✅</span>}
                            {isAccepted && !isCompleted && <span style={{ fontSize: '16px' }}>⏳</span>}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>+{challenge.RewardXp} XP</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          {challenge.Description}
                          {isAccepted && (
                            <span style={{ marginLeft: '8px', fontWeight: 600, color: 'var(--accent)' }}>
                              ({progress}/{target})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(challengeTab === 'daily' ? challenges.Daily : challenges.Weekly).length === 0 && (
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Nu există provocări disponibile.</div>
                  )}
                </div>
              )}
            </div>
          </div>

        {error && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px',
            borderRadius: '12px', 
            border: '1px solid var(--error)',
            background: 'rgba(220, 38, 38, 0.08)',
            color: 'var(--error)',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ 
            padding: '60px 20px',
            textAlign: 'center', 
            borderRadius: '16px', 
            border: '1px solid var(--border)', 
            background: 'var(--card-bg)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⟳</div>
            <p style={{ margin: 0, fontSize: '16px', color: 'var(--muted)' }}>Încărcăm clasamentul...</p>
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            {topThree.length > 0 && (
              <div style={{ marginBottom: '48px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '20px'
                }}>
                  🎖️ Podiumul Campionilor
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px'
                }}>
                  {topThree.map((entry) => {
                    const medalColor = getMedalColor(entry.Rank);
                    const progressPercent = Math.min(100, Math.round((entry.LevelProgress || 0) * 100));
                    
                    return (
                      <div 
                        key={entry.UserId}
                        style={{
                          borderRadius: '16px',
                          border: '2px solid var(--border)',
                          background: `linear-gradient(135deg, var(--card-bg) 0%, var(--topbar-bg) 100%)`,
                          padding: '24px',
                          boxShadow: 'var(--shadow-md)',
                          transition: 'all 200ms ease',
                          cursor: 'pointer'
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
                        <div style={{
                          display: 'inline-block',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'white',
                          background: medalColor,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          marginBottom: '12px'
                        }}>
                          {getMedalEmoji(entry.Rank)} Locul {entry.Rank}
                        </div>

                        <h3 style={{
                          fontSize: '20px',
                          fontWeight: '800',
                          margin: '12px 0 4px 0'
                        }}>
                          {entry.Username}
                        </h3>

                        <p style={{
                          fontSize: '13px',
                          color: 'var(--muted)',
                          margin: '0 0 16px 0'
                        }}>
                          {entry.LevelName} • {entry.QuizzesCompleted} quiz
                        </p>

                        <div style={{
                          fontSize: '28px',
                          fontWeight: '800',
                          color: medalColor,
                          marginBottom: '16px'
                        }}>
                          {(isMonthly ? entry.MonthlyPoints : entry.TotalPoints).toLocaleString('ro-RO')} ⭐
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'var(--bg)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPercent}%`,
                              background: medalColor,
                              transition: 'width 300ms ease',
                              borderRadius: '4px'
                            }}></div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--muted)'
                        }}>
                          {progressPercent}% către nivelul următor
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABLE */}
            <div style={{
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 2fr 150px 150px 180px',
                padding: '18px 24px',
                background: 'var(--topbar-bg)',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span>Rank</span>
                <span>Explorator</span>
                <span>Puncte</span>
                <span>Nivel</span>
                <span>Activitate</span>
              </div>

              <div>
                {[...topThree, ...rest].length === 0 ? (
                  <div style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '16px'
                  }}>
                    🏜️ Nimeni nu a urcat încă. Fii primul!
                  </div>
                ) : (
                  [...topThree, ...rest].map((entry) => {
                    const isCurrentUser = entry.UserId === auth.userId;
                    const progressPercent = Math.min(100, Math.round((entry.LevelProgress || 0) * 100));
                    const medalColor = getMedalColor(entry.Rank);

                    return (
                      <div
                        key={entry.UserId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 2fr 150px 150px 180px',
                          padding: '16px 24px',
                          borderBottom: '1px solid var(--border)',
                          background: isCurrentUser ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                          transition: 'background 200ms ease',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '800',
                          color: entry.Rank <= 3 ? medalColor : 'var(--accent)'
                        }}>
                          {getMedalEmoji(entry.Rank)}
                        </div>

                        <div>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {entry.Username}
                            {isCurrentUser && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '12px',
                                background: 'var(--accent)',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: '700'
                              }}>
                                TU
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--muted)',
                            marginTop: '2px'
                          }}>
                            {entry.QuizzesCompleted} quiz
                          </div>
                        </div>

                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: 'var(--accent)'
                        }}>
                          {(isMonthly ? entry.MonthlyPoints : entry.TotalPoints).toLocaleString('ro-RO')}
                        </div>

                        <div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}>
                            {entry.LevelName}
                          </div>
                          <div style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: 'var(--bg)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${progressPercent}%`,
                              height: '100%',
                              background: 'var(--success)',
                              borderRadius: '2px'
                            }} />
                          </div>
                        </div>

                        <span style={{
                          fontSize: '12px',
                          color: 'var(--muted)'
                        }}>
                          {formatDate(entry.LastActivity)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PAGINATION */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: 'var(--topbar-bg)'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Pagina {page} din {totalPages} • {totalItems} utilizatori
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: page <= 1 ? 'var(--bg)' : 'var(--card-bg)',
                    color: 'var(--text)',
                    fontWeight: '600',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ◀ Anterior
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: page >= totalPages ? 'var(--bg)' : 'var(--card-bg)',
                    color: 'var(--text)',
                    fontWeight: '600',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Următor ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
