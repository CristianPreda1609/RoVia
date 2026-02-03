import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Recommendations() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      try {
        const res = await api.get('/attractions/recommendations?take=12');
        if (!isMounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="page-container" style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      color: 'var(--text)',
      paddingLeft: '80px',
      paddingTop: '32px',
      paddingBottom: '40px'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 8px 0' }}>Noutăți & recomandări</h1>
            <p style={{ color: 'var(--muted)', margin: 0 }}>Atracții proaspete și recomandări personalizate.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              color: 'var(--text)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Înapoi la dashboard
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Se încarcă recomandările...</div>
        ) : items.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>Nu există recomandări momentan.</div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {items.map((item) => (
              <div
                key={item.id || item.Id}
                onClick={() => navigate(`/attractions/${item.id || item.Id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr',
                  gap: '16px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--card-bg)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.2)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.imageUrl || item.ImageUrl ? (
                    <img
                      src={item.imageUrl || item.ImageUrl}
                      alt={item.name || item.Name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '28px' }}>📍</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{item.name || item.Name}</div>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: item.isPromoterHighlight || item.IsPromoterHighlight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                      color: item.isPromoterHighlight || item.IsPromoterHighlight ? 'var(--success)' : 'var(--accent)',
                      fontWeight: '600'
                    }}>
                      {item.highlightLabel || item.HighlightLabel || 'Recomandare'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {(item.region || item.Region || 'România')} • {(item.typeName || item.TypeName || 'Atracție')}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{(item.description || item.Description || '').slice(0, 140)}{(item.description || item.Description || '').length > 140 ? '...' : ''}</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>⭐ {item.rating || item.Rating || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
