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
  const [quizAttractions, setQuizAttractions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
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
    imageUrl: '',
    type: 0,
    rating: 5
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
    region: 'Muntenia',
    description: '',
    latitude: '',
    longitude: '',
    imageUrl: ''
  });

  // Quiz Management
  const createEmptyAnswer = () => ({ text: '', isCorrect: false, order: 0 });
  const createEmptyQuestion = () => ({ text: '', pointsValue: 10, order: 0, answers: [createEmptyAnswer(), createEmptyAnswer()] });
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizForm, setQuizForm] = useState({
    attractionId: 0,
    title: '',
    description: '',
    difficultyLevel: 1,
    timeLimit: 60,
    questions: [createEmptyQuestion()]
  });

  const permissions = stats?.permissions || stats?.Permissions;

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
      const [statsRes, attrRes, suggRes, quizRes] = await Promise.allSettled([
        api.get('/promoter/dashboard'),
        api.get('/promoter/attractions'),
        api.get('/promoter/suggestions'),
        api.get('/quiz/mine')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (attrRes.status === 'fulfilled') setAttractions(attrRes.value.data || []);
      if (suggRes.status === 'fulfilled') setSuggestions(suggRes.value.data || []);
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value.data || []);

      const permissions = statsRes.status === 'fulfilled'
        ? (statsRes.value.data.permissions || statsRes.value.data.Permissions)
        : null;

      if (permissions?.canCreateGlobalQuizzes) {
        const allRes = await api.get('/attractions');
        const allData = Array.isArray(allRes.data) ? allRes.data : [];
        const normalized = allData.map(item => ({
          id: item.id ?? item.Id,
          name: item.name ?? item.Name
        }));
        setQuizAttractions(normalized);
      } else {
        setQuizAttractions([]);
      }

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const source = permissions?.canCreateGlobalQuizzes ? quizAttractions : attractions;
    if (!quizForm.attractionId && source.length > 0) {
      setQuizForm(prev => ({ ...prev, attractionId: source[0].id }));
    }
  }, [attractions, quizAttractions, quizForm.attractionId, permissions?.canCreateGlobalQuizzes]);

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
      setFormData({ name: '', type: 'Naturală', region: 'Muntenia', description: '', latitude: '', longitude: '', imageUrl: '' });
      fetchPromoterData();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: '❌ Eroare la trimiterea propunerii: ' + (err.response?.data?.message || err.message) });
    }
  };

  const handleEditAttraction = async (attraction) => {
    setEditingId(attraction.id);
    try {
      const res = await api.get(`/attractions/${attraction.id}`);
      const data = res.data || {};
      setEditFormData({
        name: data.name || '',
        description: data.description || '',
        region: data.region || '',
        latitude: data.latitude ?? '',
        longitude: data.longitude ?? '',
        imageUrl: data.imageUrl || '',
        type: Number.isFinite(data.type) ? data.type : 0,
        rating: data.rating ?? 5
      });
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Nu am putut încărca atracția pentru editare.' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        Name: editFormData.name,
        Description: editFormData.description,
        Region: editFormData.region,
        Type: Number(editFormData.type) || 0,
        Latitude: parseFloat(editFormData.latitude) || 0,
        Longitude: parseFloat(editFormData.longitude) || 0,
        ImageUrl: editFormData.imageUrl || '',
        Rating: Number(editFormData.rating) || 5
      };

      await api.put(`/promoter/attractions/${editingId}`, payload);
      setStatus({ type: 'success', message: '✅ Atracție actualizată!' });
      setEditingId(null);
      fetchPromoterData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare: ' + (err.response?.data?.message || err.message) });
    }
  };

  const updateQuestion = (index, patch) => {
    setQuizForm(prev => {
      const questions = prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
      return { ...prev, questions };
    });
  };

  const updateAnswer = (qIndex, aIndex, patch) => {
    setQuizForm(prev => {
      const questions = prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const answers = q.answers.map((a, j) => (j === aIndex ? { ...a, ...patch } : a));
        return { ...q, answers };
      });
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setQuizForm(prev => ({ ...prev, questions: [...prev.questions, createEmptyQuestion()] }));
  };

  const removeQuestion = (index) => {
    setQuizForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  const addAnswer = (qIndex) => {
    setQuizForm(prev => {
      const questions = prev.questions.map((q, i) => i === qIndex ? { ...q, answers: [...q.answers, createEmptyAnswer()] } : q);
      return { ...prev, questions };
    });
  };

  const removeAnswer = (qIndex, aIndex) => {
    setQuizForm(prev => {
      const questions = prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, answers: q.answers.filter((_, j) => j !== aIndex) };
      });
      return { ...prev, questions };
    });
  };

  const validateQuizForm = () => {
    if (!quizForm.title.trim() || !quizForm.description.trim()) {
      return 'Completează titlul și descrierea.';
    }
    if (!quizForm.questions.length) {
      return 'Adaugă cel puțin o întrebare.';
    }
    for (const [qIndex, q] of quizForm.questions.entries()) {
      if (!q.text.trim()) return `Întrebarea ${qIndex + 1} nu are text.`;
      if (!q.answers || q.answers.length < 2) return `Întrebarea ${qIndex + 1} trebuie să aibă cel puțin 2 răspunsuri.`;
      if (!q.answers.some(a => a.isCorrect)) return `Întrebarea ${qIndex + 1} trebuie să aibă un răspuns corect.`;
      if (q.answers.some(a => !a.text.trim())) return `Completează toate răspunsurile pentru întrebarea ${qIndex + 1}.`;
    }
    return null;
  };

  const handleSaveQuiz = async () => {
    const validationError = validateQuizForm();
    if (validationError) {
      setStatus({ type: 'error', message: `❌ ${validationError}` });
      return;
    }

    try {
      const availableAttractions = permissions?.canCreateGlobalQuizzes && quizAttractions.length
        ? quizAttractions
        : attractions;
      const safeAttractionId = Number(quizForm.attractionId) || availableAttractions[0]?.id || 0;

      const payload = {
        AttractionId: safeAttractionId,
        Title: quizForm.title,
        Description: quizForm.description,
        DifficultyLevel: Number(quizForm.difficultyLevel) || 1,
        TimeLimit: Number(quizForm.timeLimit) || 60,
        Questions: quizForm.questions.map((q, idx) => ({
          Text: q.text,
          PointsValue: Number(q.pointsValue) || 10,
          Order: q.order || idx + 1,
          Answers: q.answers.map((a, aIdx) => ({
            Text: a.text,
            IsCorrect: Boolean(a.isCorrect),
            Order: a.order || aIdx + 1
          }))
        }))
      };

      const method = editingQuizId ? 'put' : 'post';
      const url = editingQuizId ? `/quiz/${editingQuizId}` : '/quiz';
      await api[method](url, payload);
      setStatus({ type: 'success', message: `✅ Quiz ${editingQuizId ? 'actualizat' : 'creat'}!` });
      setEditingQuizId(null);
      const defaultSource = permissions?.canCreateGlobalQuizzes ? quizAttractions : attractions;
      setQuizForm({
        attractionId: defaultSource[0]?.id || 0,
        title: '',
        description: '',
        difficultyLevel: 1,
        timeLimit: 60,
        questions: [createEmptyQuestion()]
      });
      fetchPromoterData();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const modelErrors = err.response?.data?.errors;
      const flattenedErrors = modelErrors
        ? Object.values(modelErrors).flat().join(' ')
        : '';
      setStatus({ type: 'error', message: '❌ ' + (apiMessage || flattenedErrors || 'Eroare') });
    }
  };

  const handleEditQuiz = async (quiz) => {
    try {
      const res = await api.get(`/quiz/${quiz.id}/manage`);
      const data = res.data || {};
      setEditingQuizId(quiz.id);
      setQuizForm({
        attractionId: data.attractionId || quiz.attractionId || 0,
        title: data.title || quiz.title || '',
        description: data.description || quiz.description || '',
        difficultyLevel: data.difficultyLevel || quiz.difficultyLevel || 1,
        timeLimit: data.timeLimit || quiz.timeLimit || 60,
        questions: (data.questions && data.questions.length ? data.questions : [createEmptyQuestion()]).map(q => ({
          text: q.text,
          pointsValue: q.pointsValue,
          order: q.order,
          answers: (q.answers && q.answers.length ? q.answers : [createEmptyAnswer(), createEmptyAnswer()]).map(a => ({
            text: a.text,
            isCorrect: a.isCorrect,
            order: a.order
          }))
        }))
      });
      setActiveTab('quizzes');
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Nu am putut încărca quiz-ul.' });
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest quiz?')) return;
    try {
      await api.delete(`/quiz/${id}`);
      setStatus({ type: 'success', message: '✅ Quiz șters!' });
      fetchPromoterData();
    } catch (err) {
      setStatus({ type: 'error', message: '❌ Eroare la ștergere.' });
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
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Imagine (URL)</label>
                <input type="text" placeholder="https://..." value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
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
    <div className="page-container" style={{
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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
            {permissions && (
              <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>Prioritate recomandări</h3>
                <p style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {permissions.priorityRank ? `#${permissions.priorityRank}` : '—'}
                  {permissions.totalPromoters ? ` / ${permissions.totalPromoters}` : ''}
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Nivel: {permissions.priorityTier || 'Standard'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STATUS */}
        {status && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${status.type === 'success' ? 'var(--success)' : 'var(--error)'}`, background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {status.message}
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', marginBottom: '32px', flexWrap: 'wrap' }}>
          {['dashboard', 'attractions', 'add-new', 'quizzes', 'history'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setEditingId(null); }} style={{ padding: '12px 20px', background: activeTab === tab ? 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--muted)', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 200ms ease' }}>
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'attractions' ? '🎯 Atracțiile Mele' : tab === 'add-new' ? '➕ Adaugă Atracție' : tab === 'quizzes' ? '📝 Quiz-uri' : '📜 Istoric'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, marginBottom: '12px' }}>Permisiuni gamification</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
                Deblochezi opțiuni pe măsură ce adaugi atracții și quiz-uri.
              </p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Quiz-uri globale</span>
                  <strong style={{ color: permissions?.canCreateGlobalQuizzes ? 'var(--success)' : 'var(--muted)' }}>
                    {permissions?.canCreateGlobalQuizzes ? 'Activă' : 'Blocată'}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Atracții fără aprobare</span>
                  <strong style={{ color: permissions?.canAutoApproveAttractions ? 'var(--success)' : 'var(--muted)' }}>
                    {permissions?.canAutoApproveAttractions ? 'Activă' : 'Blocată'}
                  </strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Atracții adăugate: {permissions?.attractionsCreated ?? 0}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, marginBottom: '12px' }}>Prioritate afișare</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>
                Scor activitate: {permissions?.activityScore ?? 0}
              </p>
              <p style={{ color: 'var(--muted)' }}>
                Poziție: {permissions?.priorityRank ? `#${permissions.priorityRank}` : '—'}
                {permissions?.totalPromoters ? ` / ${permissions.totalPromoters}` : ''}
              </p>
            </div>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Regiune</label>
                          <select value={editFormData.region} onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }}>
                            {['Muntenia', 'Moldova', 'Transilvania', 'Dobrogea', 'Banat', 'Maramureș'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Tip</label>
                          <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }}>
                            <option value="0">Naturală</option>
                            <option value="1">Culturală</option>
                            <option value="2">Divertisment</option>
                            <option value="3">Istorică</option>
                            <option value="4">Religioasă</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Latitudine</label>
                          <input type="number" value={editFormData.latitude} onChange={(e) => setEditFormData({...editFormData, latitude: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Longitudine</label>
                          <input type="number" value={editFormData.longitude} onChange={(e) => setEditFormData({...editFormData, longitude: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Imagine (URL)</label>
                        <input type="text" value={editFormData.imageUrl} onChange={(e) => setEditFormData({...editFormData, imageUrl: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
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
                        <button onClick={() => navigate(`/attractions/${attr.id}`)} style={{ flex: 1, padding: '8px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>📊 Detalii</button>
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
                  {['Muntenia', 'Moldova', 'Transilvania', 'Dobrogea', 'Banat', 'Maramureș'].map(r => <option key={r} value={r}>{r}</option>)}
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600' }}>Imagine (URL)</label>
              <input type="text" placeholder="https://..." value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '4px' }} />
            </div>
            <button onClick={handleAddAttraction} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>Trimite Propunerea</button>
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
                    {(permissions?.canCreateGlobalQuizzes ? quizAttractions : attractions).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
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

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Întrebări</label>
                    <button onClick={addQuestion} style={{ padding: '6px 10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>+ Întrebare</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {quizForm.questions.map((q, qIndex) => (
                      <div key={qIndex} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input type="text" placeholder={`Întrebarea ${qIndex + 1}`} value={q.text} onChange={(e) => updateQuestion(qIndex, { text: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                          <input type="number" placeholder="Puncte" value={q.pointsValue} onChange={(e) => updateQuestion(qIndex, { pointsValue: parseInt(e.target.value) || 10 })} style={{ width: '90px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                          <button onClick={() => removeQuestion(qIndex)} style={{ padding: '0 10px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.answers.map((a, aIndex) => (
                            <div key={aIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="text" placeholder={`Răspuns ${aIndex + 1}`} value={a.text} onChange={(e) => updateAnswer(qIndex, aIndex, { text: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                <input type="checkbox" checked={a.isCorrect} onChange={(e) => updateAnswer(qIndex, aIndex, { isCorrect: e.target.checked })} />
                                Corect
                              </label>
                              <button onClick={() => removeAnswer(qIndex, aIndex)} style={{ padding: '0 10px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✗</button>
                            </div>
                          ))}
                          <button onClick={() => addAnswer(qIndex)} style={{ alignSelf: 'flex-start', padding: '6px 10px', background: 'var(--card-bg)', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: 'var(--muted)' }}>+ Răspuns</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveQuiz} style={{ flex: 1, padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>💾 Salvează</button>
                  {editingQuizId && (
                    <button onClick={() => { const defaultSource = permissions?.canCreateGlobalQuizzes ? quizAttractions : attractions; setEditingQuizId(null); setQuizForm({ attractionId: defaultSource[0]?.id || 0, title: '', description: '', difficultyLevel: 1, timeLimit: 60, questions: [createEmptyQuestion()] }); }} style={{ flex: 1, padding: '10px', background: 'var(--muted)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>✗ Anulează</button>
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
                        <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '12px' }}>Atracție: {quiz.attractionName || (permissions?.canCreateGlobalQuizzes ? quizAttractions : attractions).find(a => a.id === quiz.attractionId)?.name || 'Necunoscută'}</p>
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
