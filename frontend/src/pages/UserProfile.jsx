import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import useAuth from '../hooks/useAuth';
import { getWalletKey, getActiveRedemptions, calculateSpentPoints } from '../utils/voucherWallet';

function UserProfile() {
    const navigate = useNavigate();
    const auth = useAuth();
    const walletKey = getWalletKey(auth);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voucherRedemptions, setVoucherRedemptions] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await profileService.getMyProfile();
                if (!data) {
                    setError('Profilul nu a putut fi încărcat.');
                    return;
                }

                const rawNextBadge = data.nextBadge ?? data.NextBadge ?? null;

                const normalized = {
                    name: data.username ?? data.Username ?? 'Explorator',
                    email: data.email ?? data.Email ?? 'utilizator@rovia.app',
                    totalPoints: data.totalPoints ?? data.TotalPoints ?? 0,
                    level: data.level ?? data.Level ?? 1,
                    levelName: data.levelName ?? data.LevelName ?? 'Explorer',
                    levelProgress: data.levelProgress ?? data.LevelProgress ?? 0,
                    pointsToNextLevel: data.pointsToNextLevel ?? data.PointsToNextLevel ?? 0,
                    quizzesCompleted: data.quizzesCompleted ?? data.QuizzesCompleted ?? 0,
                    badges: (data.badges ?? data.Badges ?? []).map(b => ({
                        id: b.id ?? b.Id,
                        name: b.name ?? b.Name,
                        description: b.description ?? b.Description,
                        icon: b.iconUrl ?? b.IconUrl ?? '🏅',
                        unlockedAt: b.unlockedAt ?? b.UnlockedAt
                    })),
                    recentProgress: (data.recentProgress ?? data.RecentProgress ?? []).map(item => ({
                        title: item.title ?? item.Title,
                        attraction: item.name ?? item.Name,
                        points: item.pointsEarned ?? item.PointsEarned ?? 0,
                        correctAnswers: item.correctAnswers ?? item.CorrectAnswers ?? 0,
                        totalQuestions: item.totalQuestions ?? item.TotalQuestions ?? 0,
                        completedAt: item.completedAt ?? item.CompletedAt
                    })),
                    nextBadge: rawNextBadge
                        ? {
                                name: rawNextBadge.name ?? rawNextBadge.Name,
                                description: rawNextBadge.description ?? rawNextBadge.Description,
                                icon: rawNextBadge.iconUrl ?? rawNextBadge.IconUrl ?? '🏅',
                                pointsRemaining: rawNextBadge.pointsRemaining ?? rawNextBadge.PointsRemaining ?? 0
                            }
                        : null
                };

                setProfile(normalized);
            } catch (err) {
                console.error('Eroare profil:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                setError('Nu am putut obține detaliile contului.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    useEffect(() => {
        const syncWallet = () => setVoucherRedemptions(getActiveRedemptions(walletKey));
        syncWallet();
        window.addEventListener('storage', syncWallet);
        return () => window.removeEventListener('storage', syncWallet);
    }, [walletKey]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
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
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⟳</div>
                    <p>Se încarcă profilul...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                minHeight: 'calc(100vh - 56px)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--bg)',
                color: 'var(--error)'
            }}>
                ⚠️ {error}
            </div>
        );
    }

    if (!profile) return null;

    const voucherSpentPoints = calculateSpentPoints(voucherRedemptions);
    const availablePoints = Math.max(0, (profile.totalPoints ?? 0) - voucherSpentPoints);
    const initials = profile.name?.charAt(0)?.toUpperCase() ?? '?';
    const progressPercent = Math.round((profile.levelProgress || 0) * 100);

    return (
        <div style={{
            minHeight: 'calc(100vh - 56px)',
            backgroundColor: 'var(--bg)',
            paddingLeft: '80px',
            paddingTop: '24px',
            paddingBottom: '40px',
            color: 'var(--text)'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* HEADER */}
                <div style={{
                    background: `linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)`,
                    borderRadius: '16px',
                    padding: '40px',
                    marginBottom: '32px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        fontWeight: '800',
                        border: '3px solid rgba(255, 255, 255, 0.3)'
                    }}>
                        {initials}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' }}>
                            {profile.name}
                        </h1>
                        <p style={{ margin: '0 0 16px 0', opacity: 0.95 }}>
                            📧 {profile.email} • {profile.levelName} #{profile.level}
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            fontSize: '14px'
                        }}>
                            <span>⭐ {profile.totalPoints} puncte</span>
                            <span>❓ {profile.quizzesCompleted} quiz-uri</span>
                            <span>🏅 {profile.badges.length} insigne</span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                marginBottom: '8px',
                                display: 'block',
                                width: '100%'
                            }}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                width: '100%'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* STATS GRID */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Puncte Disponibile</p>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>{availablePoints}</p>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎁</div>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Puncte Rezervate</p>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--secondary)' }}>{voucherSpentPoints}</p>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Nivelul</p>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--tertiary)' }}>{profile.levelName}</p>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏅</div>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', marginBottom: '8px' }}>Insigne</p>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--warning)' }}>{profile.badges.length}</p>
                    </div>
                </div>

                {/* PROGRESS SECTION */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
                            Progres Nivel
                        </h2>
                        <div style={{
                            width: '100%',
                            height: '12px',
                            background: 'var(--bg)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, var(--accent), var(--secondary))`,
                                transition: 'width 300ms ease',
                                borderRadius: '6px'
                            }}></div>
                        </div>
                        <p style={{
                            margin: 0,
                            color: 'var(--muted)',
                            fontSize: '13px'
                        }}>
                            {progressPercent}% complet • {profile.pointsToNextLevel} puncte până la nivelul următor
                        </p>
                    </div>

                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
                            Următoarea Insignă
                        </h2>
                        {profile.nextBadge ? (
                            <div>
                                <p style={{ margin: 0, fontSize: '32px', marginBottom: '8px' }}>
                                    {profile.nextBadge.icon}
                                </p>
                                <p style={{ margin: 0, fontWeight: '600', marginBottom: '4px' }}>
                                    {profile.nextBadge.name}
                                </p>
                                <p style={{
                                    margin: 0,
                                    color: 'var(--muted)',
                                    fontSize: '12px',
                                    marginBottom: '8px'
                                }}>
                                    {profile.nextBadge.description}
                                </p>
                                <p style={{
                                    margin: 0,
                                    color: 'var(--success)',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}>
                                    +{Math.max(0, profile.nextBadge.pointsRemaining)}p
                                </p>
                            </div>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--muted)' }}>
                                Ai obținut toate insignele! 🎉
                            </p>
                        )}
                    </div>
                </div>

                {/* RECENT PROGRESS */}
                {profile.recentProgress.length > 0 && (
                    <div style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>
                            Progres Recent
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {profile.recentProgress.slice(0, 5).map((item, idx) => (
                                <div key={idx} style={{
                                    padding: '12px',
                                    background: 'var(--bg)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600' }}>{item.title}</p>
                                        <p style={{
                                            margin: '4px 0 0 0',
                                            color: 'var(--muted)',
                                            fontSize: '12px'
                                        }}>
                                            {item.correctAnswers}/{item.totalQuestions} corecte
                                        </p>
                                    </div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        color: 'var(--success)'
                                    }}>
                                        +{item.points}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
