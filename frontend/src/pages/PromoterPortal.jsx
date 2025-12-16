import { useEffect, useMemo, useState } from 'react';
import promoterService from '../services/promoterService';
import useAuth from '../hooks/useAuth';

const typeOptions = [
  { value: '1', label: 'Naturală' },
  { value: '2', label: 'Culturală' },
  { value: '3', label: 'Istorică' },
  { value: '4', label: 'Distracție' },
  { value: '5', label: 'Religioasă' }
];

const suggestionStatuses = ['Pending', 'Approved', 'Rejected'];

const StatusPill = ({ status }) => {
  const palette = {
    Pending: { bg: 'rgba(250, 204, 21, 0.15)', color: '#b45309' },
    Approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#047857' },
    Rejected: { bg: 'rgba(248, 113, 113, 0.15)', color: '#b91c1c' }
  };
  const { bg, color } = palette[status] || palette.Pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: bg,
      color
    }}>
      ● {status}
    </span>
  );
};

function PromoterPortal() {
  const { role, username } = useAuth();
  const isPromoter = role === 'Promoter' || role === 'Administrator';

  const [latestApplication, setLatestApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState('Pending');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [applicationForm, setApplicationForm] = useState({
    companyName: '',
    companyWebsite: '',
    contactEmail: '',
    motivation: ''
  });

  const [suggestionForm, setSuggestionForm] = useState({
    attractionId: '',
    createsNewAttraction: true,
    title: '',
    details: '',
    proposedName: '',
    proposedDescription: '',
    proposedRegion: '',
    proposedType: typeOptions[0].value,
    proposedLatitude: '',
    proposedLongitude: '',
    proposedImageUrl: ''
  });

  const pageTitle = useMemo(() => {
    if (isPromoter) return 'Studio-ul Promotorilor';
    if (latestApplication?.status === 'Pending') return 'Cererea ta este în analiză';
    return 'Devino promotor RoVia';
  }, [isPromoter, latestApplication]);

  useEffect(() => {
    if (!isPromoter) {
      promoterService.getLatestApplication()
        .then(setLatestApplication)
        .catch(() => setLatestApplication(null));
    }
  }, [isPromoter]);

  useEffect(() => {
    if (!isPromoter) return;

    const loadDashboard = async () => {
      try {
        const data = await promoterService.getDashboard();
        setDashboardStats(data);
      } catch (error) {
        console.error('Eroare dashboard:', error);
      }
    };

    loadDashboard();
  }, [isPromoter]);

  useEffect(() => {
    if (!isPromoter) return;

    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const data = await promoterService.getSuggestions(suggestionFilter);
        setSuggestions(data);
      } catch (error) {
        console.error('Eroare sugestii:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
  }, [isPromoter, suggestionFilter]);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplicationLoading(true);
    setFeedback(null);

    try {
      const payload = { ...applicationForm };
      const response = await promoterService.submitApplication(payload);
      setLatestApplication(response);
      setFeedback({ type: 'success', text: 'Cererea a fost trimisă către administratori.' });
      setApplicationForm({ companyName: '', companyWebsite: '', contactEmail: '', motivation: '' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut trimite cererea.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setApplicationLoading(false);
    }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const payload = {
        ...suggestionForm,
        attractionId: suggestionForm.attractionId ? Number(suggestionForm.attractionId) : null,
        proposedLatitude: suggestionForm.proposedLatitude ? Number(suggestionForm.proposedLatitude) : null,
        proposedLongitude: suggestionForm.proposedLongitude ? Number(suggestionForm.proposedLongitude) : null,
        proposedType: suggestionForm.proposedType ? Number(suggestionForm.proposedType) : null
      };

      await promoterService.submitSuggestion(payload);
      setSuggestionForm((prev) => ({
        ...prev,
        title: '',
        details: '',
        proposedName: '',
        proposedDescription: '',
        proposedRegion: '',
        proposedType: typeOptions[0].value,
        proposedLatitude: '',
        proposedLongitude: '',
        proposedImageUrl: ''
      }));
      setFeedback({ type: 'success', text: 'Sugestia a fost trimisă. Vei primi un răspuns după evaluare.' });
      setSuggestionFilter('Pending');
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut trimite sugestia.';
      setFeedback({ type: 'error', text: message });
    }
  };

  const summaryCards = [
    {
      title: 'Sugestii în așteptare',
      value: dashboardStats?.PendingSuggestions ?? 0,
      accent: '#facc15'
    },
    {
      title: 'Aprobate până acum',
      value: dashboardStats?.ApprovedSuggestions ?? 0,
      accent: '#22c55e'
    },
    {
      title: 'Ultima acțiune',
      value: dashboardStats?.LatestApplication?.status || '—',
      accent: '#3b82f6'
    }
  ];

  return (
    <div style={{ padding: '32px 48px', fontFamily: 'RoviaUI, Inter, system-ui' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Program Promoter</p>
        <h1 style={{ fontSize: 34, margin: 0, color: 'var(--text)' }}>{pageTitle}</h1>
        <p style={{ maxWidth: 640, color: 'var(--muted)', marginTop: 12 }}>
          {isPromoter
            ? 'Gestionează atracțiile propuse, urmărește statusul campaniilor tale și construiește experiențe memorabile pentru vizitatori.'
            : 'Completează formularul de mai jos pentru a primi acces la instrumentele de promovare și la statisticile avansate despre atracții.'}
        </p>
      </header>

      {feedback && (
        <div style={{
          marginBottom: 24,
          padding: '14px 18px',
          borderRadius: 16,
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
          color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
          fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      {!isPromoter && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          marginBottom: 48
        }}>
          <div style={{ borderRadius: 24, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Formular de înscriere</h2>
            <form onSubmit={handleApplicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['companyName', 'companyWebsite', 'contactEmail'].map((field) => (
                <div key={field}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{
                    field === 'companyName' ? 'Nume companie' : field === 'companyWebsite' ? 'Website' : 'Email de contact'
                  }</label>
                  <input
                    type={field === 'contactEmail' ? 'email' : 'text'}
                    value={applicationForm[field]}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Motivație</label>
                <textarea
                  value={applicationForm.motivation}
                  onChange={(e) => setApplicationForm((prev) => ({ ...prev, motivation: e.target.value }))}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--topbar-bg)',
                    color: 'var(--text)'
                  }}
                  placeholder="Spune-ne cum vrei să promovezi destinațiile locale."
                />
              </div>
              <button
                type="submit"
                disabled={applicationLoading}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: applicationLoading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff'
                }}
              >
                {applicationLoading ? 'Se trimite...' : 'Trimite cererea'}
              </button>
            </form>
          </div>

          <div style={{ borderRadius: 24, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Status aplicație</h2>
            {latestApplication ? (
              <div>
                <p style={{ color: 'var(--muted)' }}>Ultima actualizare: {new Date(latestApplication.submittedAt).toLocaleDateString('ro-RO')}</p>
                <StatusPill status={latestApplication.status} />
                {latestApplication.adminNotes && (
                  <p style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--topbar-bg)', border: '1px dashed var(--border)' }}>
                    {latestApplication.adminNotes}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Încă nu ai trimis o aplicație. Completează formularul alăturat.</p>
            )}
          </div>
        </section>
      )}

      {isPromoter && (
        <section>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
            marginBottom: 32
          }}>
            {summaryCards.map((card) => (
              <div key={card.title} style={{
                borderRadius: 18,
                padding: 20,
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{card.title}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 30, fontWeight: 700, color: card.accent }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 430px) minmax(320px, 1fr)',
            gap: 32,
            alignItems: 'flex-start'
          }}>
            <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Sugerează o atracție</h2>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{username}</span>
              </div>
              <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={suggestionForm.createsNewAttraction}
                    onChange={(e) => setSuggestionForm((prev) => ({ ...prev, createsNewAttraction: e.target.checked }))}
                  />
                  Propun atracție nouă
                </label>

                {!suggestionForm.createsNewAttraction && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>ID atracție existentă</label>
                    <input
                      type="number"
                      value={suggestionForm.attractionId}
                      onChange={(e) => setSuggestionForm((prev) => ({ ...prev, attractionId: e.target.value }))}
                      style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      placeholder="Ex: 12"
                      required={!suggestionForm.createsNewAttraction}
                    />
                  </div>
                )}

                {['title', 'details', 'proposedName', 'proposedDescription', 'proposedRegion', 'proposedImageUrl'].map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{
                      field === 'title'
                        ? 'Titlu campanie'
                        : field === 'details'
                          ? 'Detalii'
                          : field === 'proposedName'
                            ? 'Nume propus'
                            : field === 'proposedDescription'
                              ? 'Descriere propusă'
                              : field === 'proposedRegion'
                                ? 'Regiune'
                                : 'Imagine (URL)'
                    }</label>
                    {field === 'details' || field === 'proposedDescription' ? (
                      <textarea
                        value={suggestionForm[field]}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        rows={field === 'details' ? 2 : 3}
                        required
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={suggestionForm[field]}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        required
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      />
                    )}
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Latitudine</label>
                    <input type="number" step="0.000001" value={suggestionForm.proposedLatitude} onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedLatitude: e.target.value }))} required={suggestionForm.createsNewAttraction} style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Longitudine</label>
                    <input type="number" step="0.000001" value={suggestionForm.proposedLongitude} onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedLongitude: e.target.value }))} required={suggestionForm.createsNewAttraction} style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Tip atracție</label>
                  <select
                    value={suggestionForm.proposedType}
                    onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedType: e.target.value }))}
                    required={suggestionForm.createsNewAttraction}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)'
                    }}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  color: '#fff'
                }}>
                  Trimite sugestia
                </button>
              </form>
            </div>

            <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Sugestiile mele</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {suggestionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSuggestionFilter(status)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: suggestionFilter === status ? 'var(--accent)' : 'transparent',
                        color: suggestionFilter === status ? '#fff' : 'var(--text)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                {suggestionsLoading && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
                {!suggestionsLoading && suggestions.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>Nu există sugestii pentru filtrul curent.</p>
                )}
                {!suggestionsLoading && suggestions.map((item) => (
                  <div key={item.id} style={{
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    padding: 16,
                    marginBottom: 12,
                    background: 'var(--topbar-bg)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>{item.title}</h3>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{new Date(item.submittedAt).toLocaleDateString('ro-RO')}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <p style={{ marginTop: 12, color: 'var(--text)', fontSize: 14 }}>{item.details}</p>
                    {item.adminResponse && (
                      <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>Feedback admin: {item.adminResponse}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default PromoterPortal;
