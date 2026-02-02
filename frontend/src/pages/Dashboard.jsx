import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserRole } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, leaderboardRes] = await Promise.all([
        api.get('/profile/me'),
        api.get('/profile/leaderboard?take=5')
      ]);

      setProfile(profileRes.data);
      setLeaderboard(leaderboardRes.data || []);
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
              Salut, {profile?.username || 'Exploratorule'}! 👋
            </h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Bine ai venit în panoul tău de control.</p>
          </div>
          <button 
            onClick={() => navigate('/map')}
            style={{
              padding: '12px 24px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
            🗺️ Explorează Harta
          </button>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: '12px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {/* XP Card */}
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Experiență (XP)</h3>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{profile?.xp || 0}</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Continua să explorezi!</p>
          </div>

          {/* Role Card */}
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Rang</h3>
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--success)' }}>
                {profile?.role || 'Călător'}
            </p>
             <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Status curent</p>
          </div>

          {/* Quizzes Taken */}
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📚</div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Quiz-uri</h3>
            </div>
            {/* If backend doesn't send quizzes count, we might hide this or show placeholder */}
            <p style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>{profile?.quizzesCompleted ?? '-'}</p>
             <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Teste finalizate</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            {/* NEXT STEPS / ACTIONS */}
            <div>
                 <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Ce vrei să faci azi?</h2>
                 <div style={{ display: 'grid', gap: '20px' }}>
                     <div 
                        onClick={() => navigate('/map')}
                        style={{ 
                            background: 'var(--card-bg)', 
                            padding: '24px', 
                            borderRadius: '16px', 
                            border: '1px solid var(--border)', 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                     >
                         <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>🌍 Harta Interactivă</h3>
                         <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>Descoperă atracții turistice noi pe harta României.</p>
                     </div>
                 </div>

                 {/* PROMOTER CTA */}
                 {(getUserRole() !== 'Promoter' && getUserRole() !== 'Administrator') && (
                     <div style={{ marginTop: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--accent)' }}>Deții o afacere locală?</h3>
                                <p style={{ color: 'var(--text)', fontSize: '14px', maxWidth: '400px', margin: 0 }}>Devino Promotor RoVia și promovează-ți atracția turistică direct pe harta noastră.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/promoter')}
                                style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Aplică Acum
                            </button>
                        </div>
                     </div>
                 )}
            </div>

            {/* LEADERBOARD MINI */}
            <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Top Exploratori</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {leaderboard.map((user, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: '800', width: '24px', color: idx < 3 ? 'var(--accent)' : 'var(--muted)' }}>{getRankBadge(idx + 1)}</span>
                                <span style={{ fontWeight: '600' }}>{user.username}</span>
                            </div>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{user.xp || user.totalXp} XP</span>
                        </div>
                    ))}
                    {leaderboard.length === 0 && <p style={{ color: 'var(--muted)' }}>Se încarcă clasamentul...</p>}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}