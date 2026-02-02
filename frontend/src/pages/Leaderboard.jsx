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
  const auth = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await api.get(`/profile/leaderboard?take=50&monthly=${isMonthly}`);
      setEntries(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
      setError('Nu am putut actualiza leaderboard-ul. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  }, [isMonthly]);

  useEffect(() => {
    fetchLeaderboard();
    const intervalId = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

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
    <div style={{ 
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
                🏆 Clasament Global
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
            <div style={{
              display: 'flex',
              gap: '8px',
              background: 'var(--topbar-bg)',
              padding: '6px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <button
                onClick={() => setIsMonthly(false)}
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
                onClick={() => setIsMonthly(true)}
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
          </>
        )}
      </div>
    </div>
  );
}
