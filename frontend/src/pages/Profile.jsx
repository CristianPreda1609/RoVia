import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
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
