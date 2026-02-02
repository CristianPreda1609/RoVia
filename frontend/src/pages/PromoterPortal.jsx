import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserRole } from '../utils/auth';

export default function PromoterPortal() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  
  // Promoter State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    region: '',
    latitude: '',
    longitude: '',
    imageUrl: ''
  });

  // Application State
  const [appStatus, setAppStatus] = useState(null);
  const [appForm, setAppForm] = useState({
    companyName: '',
    companyWebsite: '',
    contactEmail: '',
    motivation: ''
  });

  // New Attraction Form
  const [formData, setFormData] = useState({
    name: '',
    type: 'Naturală',
    region: 'București',
    description: '',
    latitude: '',
    longitude: '',
    imageUrl: ''
  });

  useEffect(() => {
    const userRole = getUserRole();
    setRole(userRole);
    
    if (userRole === 'Promoter' || userRole === 'Administrator') {
      fetchPromoterData();
    } else {
      checkApplicationStatus();
    }
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const res = await api.get('/promoter/applications/latest');
      if (!res.data) {
        setAppStatus('none');
      } else {
        const s = res.data.status;
        setAppStatus(s === 0 ? 'pending' : s === 1 ? 'approved' : 'rejected');
      }
    } catch (e) {
      setAppStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoterData = async () => {
    try {
      setLoading(true);
      const [statsRes, attrRes, suggRes] = await Promise.allSettled([
        api.get('/promoter/dashboard'),
        api.get('/promoter/attractions'),
        api.get('/promoter/suggestions')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (attrRes.status === 'fulfilled') setAttractions(attrRes.value.data || []);
      if (suggRes.status === 'fulfilled') setSuggestions(suggRes.value.data || []);

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      await api.post('/promoter/applications', appForm);
      setAppStatus('pending');
      setStatus({ type: 'success', message: '✅ Aplicația a fost trimisă cu succes!' });
    } catch (e) {
      setStatus({ type: 'error', message: '❌ ' + (e.response?.data?.message || 'Eroare la trimitere.') });
    }
  };

  const handleAddAttraction = async () => {
    setStatus(null);
    if (!formData.name || !formData.description) {
      setStatus({ type: 'error', message: 'Numele și descrierea sunt obligatorii!' });
      return;
    }

    const payload = {
      CreatesNewAttraction: true,
      Title: `New Attraction: ${formData.name}`,
      Details: "Propunere creată din portalul promotorului.",
      ProposedName: formData.name,
      ProposedDescription: formData.description,
      ProposedRegion: formData.region,
      ProposedType: 0,
      ProposedLatitude: parseFloat(formData.latitude) || 0,
      ProposedLongitude: parseFloat(formData.longitude) || 0,
      ProposedImageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"
    };

    const typeMap = { 'Naturală': 0, 'Culturală': 1, 'Divertisment': 2, 'Istorică': 3 };
    if (typeMap[formData.type] !== undefined) payload.ProposedType = typeMap[formData.type];

    try {
      await api.post('/promoter/suggestions', payload);
      setStatus({ type: 'success', message: '✅ Propunere de atracție trimisă spre aprobare!' });
      setFormData({ name: '', type: 'Naturală', region: 'București', description: '', latitude: '', longitude: '', imageUrl: '' });
      fetchPromoterData();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '❌ Eroare la trimiterea propunerii: ' + (err.response?.data?.message || err.message) });
    }
  };

  const handleEditAttraction = (attraction) => {
    setEditingId(attraction.id);
    setEditFormData({
      name: attraction.name,
      description: attraction.description,
      region: attraction.region,
      latitude: attraction.latitude || '',
      longitude: attraction.longitude || '',
      imageUrl: attraction.imageUrl || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      // Backend doesn't have PUT /promoter/attractions yet
      // So we submit as a suggestion instead (modification proposal)
      const payload = {
        CreatesNewAttraction: false,
        Title: `Edit Attraction: ${editFormData.name}`,
        Details: `Modificări la atracția ${editingId}`,
        ProposedName: editFormData.name,
        ProposedDescription: editFormData.description,
        ProposedRegion: editFormData.region,
        ProposedType: 0,
        ProposedLatitude: parseFloat(editFormData.latitude) || 0,
        ProposedLongitude: parseFloat(editFormData.longitude) || 0,
        ProposedImageUrl: editFormData.imageUrl || ''
      };

      await api.post('/promoter/suggestions', payload);
      setStatus({ type: 'success', message: '✅ Modificări trimise spre aprobare!' });
      setEditingId(null);
      fetchPromoterData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare: ' + (err.response?.data?.message || err.message) });
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>Se încarcă datele...</div>;

  // APPLICATION MODE (Non-Promoters)
  if (role !== 'Promoter' && role !== 'Administrator') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--bg)',
        paddingLeft: '80px',
        paddingTop: '32px',
        color: 'var(--text)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px', width: '100%', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>🚀 Devino Promotor RoVia!</h1>
            <p style={{ color: 'var(--muted)' }}>Contribuie la promovarea turismului românesc și câștigă privilegii speciale.</p>
          </div>

          {appStatus === 'pending' && (
            <div style={{ padding: '32px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--warning)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h2>Aplicație în Așteptare</h2>
              <p style={{ color: 'var(--muted)' }}>Cererea ta este analizată de un administrator. Vei primi un răspuns în curând.</p>
            </div>
          )}

          {appStatus === 'rejected' && (
            <div style={{ padding: '32px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--error)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
              <h2>Aplicație Respinsă</h2>
              <p style={{ color: 'var(--muted)' }}>Din păcate, cererea ta a fost respinsă. Poți depune o nouă cerere după o perioadă.</p>
              <button onClick={() => setAppStatus('none')} style={{ marginTop: '16px', padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Încearcă din nou</button>
            </div>
          )}

          {appStatus === 'approved' && (
            <div style={{ padding: '32px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--success)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2>Felicitări! Ești Promotor!</h2>
              <p style={{ color: 'var(--muted)' }}>Reloghează-te pentru a accesa dashboard-ul de promotor.</p>
            </div>
          )}

          {appStatus === 'none' && (
            <div style={{ background: 'var(--card-bg)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Numele Companiei / Organizației</label>
                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={appForm.companyName} onChange={e => setAppForm({...appForm, companyName: e.target.value})} placeholder="Ex: Asociația Turistică X" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Website (Opțional)</label>
                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={appForm.companyWebsite} onChange={e => setAppForm({...appForm, companyWebsite: e.target.value})} placeholder="https://..." />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email de Contact</label>
                <input type="email" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={appForm.contactEmail} onChange={e => setAppForm({...appForm, contactEmail: e.target.value})} placeholder="contact@exemplu.ro" />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>De ce vrei să devii promotor?</label>
                <textarea rows="4" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} value={appForm.motivation} onChange={e => setAppForm({...appForm, motivation: e.target.value})} placeholder="Descrie motivația ta..." />
              </div>
              <button onClick={handleSubmitApplication} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--secondary))', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Trimite Aplicația</button>
            </div>
          )}

          {status && (
            <div style={{ marginTop: '20px', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${status.type === 'success' ? 'var(--success)' : 'var(--error)'}`, background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // FULL PROMOTER PORTAL
  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      paddingLeft: '80px',
      paddingTop: '32px',
      paddingBottom: '40px',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 12px 0', background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🚀 Portal Promotor</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Gestionează atracțiile și propunerile tale</p>
        </div>

        {/* STATS */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Atracții Aprobate</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>{stats.approvedAttractions || 0}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Propuneri Pendente</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pendingSuggestions || 0}</p>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Propuneri Aprobate</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: 'var(--accent)' }}>{stats.approvedSuggestions || 0}</p>
            </div>
          </div>
        )}

        {/* STATUS */}
        {status && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${status.type === 'success' ? 'var(--success)' : 'var(--error)'}`, background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {status.message}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          {['dashboard', 'attractions', 'add-new', 'history'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} style={{ padding: '12px 20px', background: activeTab === tab ? 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--muted)', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 200ms ease' }}>
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'attractions' ? '🎯 Atracțiile Mele' : tab === 'add-new' ? '➕ Adaugă Atracție' : '📜 Istoric'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === 'dashboard' && (
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, marginBottom: '20px' }}>Pregled Portal</h2>
            <p style={{ color: 'var(--muted)' }}>Alege o secțiune din meniu pentru a gestiona atracțiile tale.</p>
          </div>
        )}

        {activeTab === 'attractions' && (
          <div>
            {attractions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', background: 'var(--card-bg)', borderRadius: '12px' }}>
                Nu ai nicio atracție publicată încă.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {attractions.map(attr => (
                  editingId === attr.id ? (
                    // EDIT FORM
                    <div key={attr.id} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '2px solid var(--accent)' }}>
                      <h3 style={{ margin: '0 0 16px 0' }}>Editare Atracție</h3>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Nume</label>
                        <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Descriere</label>
                        <textarea rows="3" value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handleSaveEdit} style={{ flex: 1, padding: '8px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>💾 Salvează</button>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✗ Anulează</button>
                      </div>
                    </div>
                  ) : (
                    // DISPLAY CARD
                    <div key={attr.id} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{attr.name}</h3>
                      <p style={{ margin: '0 0 16px 0', color: 'var(--muted)' }}>{attr.region}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditAttraction(attr)} style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✏️ Editează</button>
                        <button style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>📊 Detalii</button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add-new' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--card-bg)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Propune o nouă atracție</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Nume Atracție</label>
                <input type="text" placeholder="Ex: Castelul Peleș" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Tip</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }}>
                  {['Naturală', 'Culturală', 'Divertisment', 'Istorică'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Regiune</label>
                <select value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }}>
                  {['București', 'Muntenia', 'Moldova', 'Transilvania', 'Dobrogea', 'Oltenia', 'Banat', 'Maramureș'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Latitudine</label>
                <input type="number" placeholder="44.4268" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Longitudine</label>
                <input type="number" placeholder="26.1025" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600' }}>Descriere</label>
              <textarea rows="4" placeholder="Descrie atracția în detaliu..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px', resize: 'vertical' }} />
            </div>
            <button onClick={handleAddAttraction} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>Trimite Propunerea</button>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--muted)' }}>Data</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--muted)' }}>Titlu</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--muted)' }}>Tip</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(sugg => (
                  <tr key={sugg.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>{new Date(sugg.submittedAt || Date.now()).toLocaleDateString('ro-RO')}</td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{sugg.title || 'Fără titlu'}</td>
                    <td style={{ padding: '16px' }}>{sugg.createsNewAttraction ? 'Atracție Nouă' : 'Modificare'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: sugg.status === 1 ? 'rgba(16, 185, 129, 0.2)' : sugg.status === 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: sugg.status === 1 ? 'var(--success)' : sugg.status === 2 ? 'var(--error)' : 'var(--warning)' }}>
                        {sugg.status === 0 ? 'Pending' : sugg.status === 1 ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
