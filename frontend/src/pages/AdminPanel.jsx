import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserRole } from '../utils/auth';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applications, setApplications] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  // Add/Edit Attraction Form
  const [editingAttractionId, setEditingAttractionId] = useState(null);
  const [attractionForm, setAttractionForm] = useState({
    name: '',
    description: '',
    region: 'București',
    type: 0,
    latitude: 0,
    longitude: 0,
    imageUrl: '',
    rating: 0
  });

  // Quiz Management
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizForm, setQuizForm] = useState({
    attractionId: 1,
    title: '',
    description: '',
    difficultyLevel: 1,
    timeLimit: 60,
    questions: []
  });

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Administrator') {
      navigate('/dashboard');
    }
    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [appRes, suggRes, statsRes, attrRes, quizRes] = await Promise.allSettled([
        api.get('/admin/applications'),
        api.get('/admin/suggestions'),
        api.get('/admin/dashboard'),
        api.get('/attractions?take=1000'), // Get all attractions
        api.get('/quiz/all') // Get all quizzes
      ]);

      if (appRes.status === 'fulfilled') setApplications(appRes.value.data || []);
      if (suggRes.status === 'fulfilled') setSuggestions(suggRes.value.data || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (attrRes.status === 'fulfilled') setAttractions(attrRes.value.data || []);
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value.data || []);

    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApp = async (appId) => {
    try {
      await api.post(`/admin/applications/${appId}/approve`, { Notes: 'Aprobat de admin' });
      setStatus({ type: 'success', message: '✅ Aplicație aprobată!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ ' + (err.response?.data?.message || 'Eroare') });
    }
  };

  const handleRejectApp = async (appId) => {
    try {
      await api.post(`/admin/applications/${appId}/reject`, { Notes: 'Respins de admin' });
      setStatus({ type: 'success', message: '✅ Aplicație respinsă!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare' });
    }
  };

  const handleApproveSuggestion = async (suggId) => {
    try {
      await api.post(`/admin/suggestions/${suggId}/approve`, { Notes: 'Aprobat de admin' });
      setStatus({ type: 'success', message: '✅ Sugestie aprobată!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare' });
    }
  };

  const handleRejectSuggestion = async (suggId) => {
    try {
      await api.post(`/admin/suggestions/${suggId}/reject`, { Notes: 'Respins de admin' });
      setStatus({ type: 'success', message: '✅ Sugestie respinsă!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare' });
    }
  };

  const handleSaveAttraction = async () => {
    try {
      if (editingAttractionId) {
        // Update
        await api.put(`/attractions/${editingAttractionId}`, attractionForm);
        setStatus({ type: 'success', message: '✅ Atracție actualizată!' });
      } else {
        // Create
        await api.post('/attractions', attractionForm);
        setStatus({ type: 'success', message: '✅ Atracție creată!' });
      }
      setEditingAttractionId(null);
      setAttractionForm({ name: '', description: '', region: 'București', type: 0, latitude: 0, longitude: 0, imageUrl: '', rating: 0 });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ ' + (err.response?.data?.message || 'Eroare') });
    }
  };

  const handleDeleteAttraction = async (id) => {
    if (!window.confirm('Ești sigur?')) return;
    try {
      await api.delete(`/attractions/${id}`);
      setStatus({ type: 'success', message: '✅ Atracție ștearsă!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare' });
    }
  };

  const handleEditAttraction = (attr) => {
    setEditingAttractionId(attr.id);
    setAttractionForm({
      name: attr.name,
      description: attr.description,
      region: attr.region,
      type: attr.type || 0,
      latitude: attr.latitude || 0,
      longitude: attr.longitude || 0,
      imageUrl: attr.imageUrl || '',
      rating: attr.rating || 0
    });
    setActiveTab('attractions');
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim() || !quizForm.description.trim()) {
      setStatus({ type: 'error', message: '❌ Completează titlul și descrierea' });
      return;
    }
    try {
      const method = editingQuizId ? 'PUT' : 'POST';
      const url = editingQuizId ? `/quiz/${editingQuizId}` : '/quiz';
      await api[method.toLowerCase()](url, quizForm);
      setStatus({ type: 'success', message: `✅ Quiz ${editingQuizId ? 'actualizat' : 'creat'}!` });
      setEditingQuizId(null);
      setQuizForm({ attractionId: 1, title: '', description: '', difficultyLevel: 1, timeLimit: 60, questions: [] });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ ' + (err.response?.data?.message || 'Eroare') });
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest quiz?')) return;
    try {
      await api.delete(`/quiz/${id}`);
      setStatus({ type: 'success', message: '✅ Quiz șters!' });
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare' });
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuizId(quiz.id);
    setQuizForm({
      attractionId: quiz.attractionId || 1,
      title: quiz.title,
      description: quiz.description,
      difficultyLevel: quiz.difficultyLevel || 1,
      timeLimit: quiz.timeLimit || 60,
      questions: quiz.questions || []
    });
    setActiveTab('quizzes');
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text)' }}>Se încarcă...</div>;

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      paddingLeft: '80px',
      paddingTop: '32px',
      paddingBottom: '40px',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 12px 0', background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🛡️ Panou Administrator</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Controlul complet al platformei</p>
        </div>

        {/* STATUS */}
        {status && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${status.type === 'success' ? 'var(--success)' : 'var(--error)'}`, background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {status.message}
          </div>
        )}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Aplicații Pendente', value: applications.filter(a => a.status === 0).length, color: 'var(--warning)' },
            { label: 'Sugestii Pendente', value: suggestions.filter(s => s.status === 0).length, color: 'var(--warning)' },
            { label: 'Total Atracții', value: attractions.length, color: 'var(--accent)' },
            { label: 'Total Utilizatori', value: stats?.totalUsers || 0, color: 'var(--success)' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px' }}>{stat.label}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', marginBottom: '24px', flexWrap: 'wrap' }}>
          {['dashboard', 'applications', 'suggestions', 'attractions', 'quizzes'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setEditingAttractionId(null); }} style={{ padding: '12px 20px', background: activeTab === tab ? 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--muted)', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 200ms ease' }}>
              {tab === 'dashboard' ? '📊 Overview' : tab === 'applications' ? '📋 Aplicații' : tab === 'suggestions' ? '💡 Sugestii' : tab === 'attractions' ? '🎯 Atracții' : '📝 Quiz-uri'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === 'dashboard' && (
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, marginBottom: '16px' }}>Pregled Sistem</h2>
            <p style={{ color: 'var(--muted)' }}>Selectează o secțiune din meniu pentru a gestiona conținutul platformei.</p>
          </div>
        )}

        {activeTab === 'applications' && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Aplicații Promotor</h2>
            {applications.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Nicio aplicație pentru review.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {applications.map(app => (
                  <div key={app.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', background: app.status === 0 ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(0, 111, 238, 0.05))' : app.status === 1 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(0, 111, 238, 0.05))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(0, 111, 238, 0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600' }}>{app.companyName || 'Companie'}</p>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '12px' }}>{app.contactEmail}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Motivație: {app.motivation}</p>
                    </div>
                    {app.status === 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveApp(app.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--success)', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✓ Aprob</button>
                        <button onClick={() => handleRejectApp(app.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--error)', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✗ Refuz</button>
                      </div>
                    )}
                    {app.status === 1 && <span style={{ fontSize: '18px' }}>✅</span>}
                    {app.status === 2 && <span style={{ fontSize: '18px' }}>❌</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Sugestii Atracții</h2>
            {suggestions.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Nicio sugestie pentru review.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map(sugg => (
                  <div key={sugg.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600' }}>{sugg.title}</p>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '12px' }}>{sugg.details}</p>
                      {sugg.createsNewAttraction && <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' }}>Atracție Nouă</span>}
                    </div>
                    {sugg.status === 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveSuggestion(sugg.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--success)', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✓ Aprob</button>
                        <button onClick={() => handleRejectSuggestion(sugg.id)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--error)', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✗ Refuz</button>
                      </div>
                    )}
                    {sugg.status === 1 && <span style={{ fontSize: '18px' }}>✅</span>}
                    {sugg.status === 2 && <span style={{ fontSize: '18px' }}>❌</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attractions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* ADD/EDIT FORM */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
              <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '18px' }}>{editingAttractionId ? '✏️ Editează' : '➕ Adaugă'} Atracție</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Nume</label>
                  <input type="text" value={attractionForm.name} onChange={(e) => setAttractionForm({...attractionForm, name: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Descriere</label>
                  <textarea rows="3" value={attractionForm.description} onChange={(e) => setAttractionForm({...attractionForm, description: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Regiune</label>
                  <select value={attractionForm.region} onChange={(e) => setAttractionForm({...attractionForm, region: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                    {['București', 'Muntenia', 'Moldova', 'Transilvania', 'Dobrogea', 'Oltenia', 'Banat', 'Maramureș'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Tip</label>
                  <select value={attractionForm.type} onChange={(e) => setAttractionForm({...attractionForm, type: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                    <option value="0">Naturală</option>
                    <option value="1">Culturală</option>
                    <option value="2">Divertisment</option>
                    <option value="3">Istorică</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Lat</label>
                    <input type="number" value={attractionForm.latitude} onChange={(e) => setAttractionForm({...attractionForm, latitude: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Long</label>
                    <input type="number" value={attractionForm.longitude} onChange={(e) => setAttractionForm({...attractionForm, longitude: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveAttraction} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>💾 Salvează</button>
                  {editingAttractionId && (
                    <button onClick={() => setEditingAttractionId(null)} style={{ flex: 1, padding: '10px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✗ Anulează</button>
                  )}
                </div>
              </div>
            </div>

            {/* ATTRACTIONS LIST */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '18px' }}>Atracții ({attractions.length})</h2>
              {attractions.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>Nicio atracție.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {attractions.map(attr => (
                    <div key={attr.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{attr.name}</p>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '12px' }}>{attr.region}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditAttraction(attr)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => handleDeleteAttraction(attr.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--error)', color: 'white', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* QUIZ FORM */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
              <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '18px' }}>{editingQuizId ? '✏️ Editează' : '➕ Adaugă'} Quiz</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Atracție</label>
                  <select value={quizForm.attractionId} onChange={(e) => setQuizForm({...quizForm, attractionId: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                    {attractions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Titlu</label>
                  <input type="text" value={quizForm.title} onChange={(e) => setQuizForm({...quizForm, title: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Descriere</label>
                  <textarea rows="3" value={quizForm.description} onChange={(e) => setQuizForm({...quizForm, description: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Dificultate</label>
                    <select value={quizForm.difficultyLevel} onChange={(e) => setQuizForm({...quizForm, difficultyLevel: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                      <option value="1">Ușor</option>
                      <option value="2">Mediu</option>
                      <option value="3">Greu</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Timp Limită (s)</label>
                    <input type="number" value={quizForm.timeLimit} onChange={(e) => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value) || 60})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveQuiz} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>💾 Salvează</button>
                  {editingQuizId && (
                    <button onClick={() => { setEditingQuizId(null); setQuizForm({ attractionId: 1, title: '', description: '', difficultyLevel: 1, timeLimit: 60, questions: [] }); }} style={{ flex: 1, padding: '10px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✗ Anulează</button>
                  )}
                </div>
              </div>
            </div>

            {/* QUIZZES LIST */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: 0, marginBottom: '16px', fontSize: '18px' }}>Quiz-uri ({quizzes.length})</h2>
              {quizzes.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>Niciun quiz.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
                  {quizzes.map(quiz => (
                    <div key={quiz.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{quiz.title}</p>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '12px' }}>Atracție: {attractions.find(a => a.id === quiz.attractionId)?.name || 'Necunoscută'}</p>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--muted)', fontSize: '11px' }}>Dificultate: {['Ușor', 'Mediu', 'Greu'][quiz.difficultyLevel - 1] || 'Ușor'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditQuiz(quiz)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => handleDeleteQuiz(quiz.id)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--error)', color: 'white', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
