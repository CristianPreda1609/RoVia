import { useCallback, useEffect, useMemo, useState } from 'react';
import adminService from '../services/adminService';

const STATUS_FILTERS = ['Pending', 'Approved', 'Rejected'];
const STATUS_FROM_ENUM = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected'
};

const toStatusString = (value) => {
  if (typeof value === 'number') {
    return STATUS_FROM_ENUM[value] ?? 'Pending';
  }
  return value || 'Pending';
};

const normalizeSummary = (payload) => ({
  PendingApplications: payload?.PendingApplications ?? payload?.pendingApplications ?? 0,
  ApprovedApplications: payload?.ApprovedApplications ?? payload?.approvedApplications ?? 0,
  RejectedApplications: payload?.RejectedApplications ?? payload?.rejectedApplications ?? 0,
  PendingSuggestions: payload?.PendingSuggestions ?? payload?.pendingSuggestions ?? 0,
  ApprovedSuggestions: payload?.ApprovedSuggestions ?? payload?.approvedSuggestions ?? 0,
  RejectedSuggestions: payload?.RejectedSuggestions ?? payload?.rejectedSuggestions ?? 0,
  ApprovedThisWeek: payload?.ApprovedThisWeek ?? payload?.approvedThisWeek ?? 0,
});

const Card = ({ title, value, accent }) => (
  <div style={{
    borderRadius: 18,
    padding: 20,
    border: '1px solid var(--border)',
    background: 'var(--card-bg)'
  }}>
    <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{title}</p>
    <p style={{ margin: '6px 0 0 0', fontSize: 28, fontWeight: 700, color: accent }}>{value}</p>
  </div>
);

function AdminPanel() {
  const [summary, setSummary] = useState(null);
  const [applicationFilter, setApplicationFilter] = useState('Pending');
  const [applications, setApplications] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState('Pending');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);

  const refreshSummary = useCallback(() => {
    adminService
      .getDashboard()
      .then((data) => setSummary(normalizeSummary(data)))
      .catch(() => setSummary(null));
  }, []);

  const normalizeCollection = (items = []) =>
    items.map((item) => ({
      ...item,
      status: toStatusString(item?.status)
    }));

  const refreshApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const data = await adminService.getApplications();
      setApplications(normalizeCollection(data));
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca aplicațiile.');
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  const refreshSuggestions = useCallback(async (filter) => {
    setLoadingSuggestions(true);
    try {
      const data = await adminService.getSuggestions(filter);
      setSuggestions(normalizeCollection(data));
    } catch (err) {
      console.error(err);
      setError('Nu am putut încărca sugestiile.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    refreshApplications();
  }, [refreshApplications]);

  useEffect(() => {
    refreshSuggestions(suggestionFilter);
  }, [refreshSuggestions, suggestionFilter]);

  const handleDecision = async (type, id, action) => {
    const notes = window.prompt('Note pentru utilizator (opțional)', '') || '';
    try {
      if (type === 'application') {
        await adminService.decideApplication(id, action, notes);
        await refreshApplications();
      } else {
        await adminService.decideSuggestion(id, action, notes);
        await refreshSuggestions(suggestionFilter);
      }
      refreshSummary();
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Acțiunea nu a putut fi finalizată.');
    }
  };

  const visibleApplications = useMemo(() => {
    if (!applicationFilter) return applications;
    return applications.filter((app) => app.status === applicationFilter);
  }, [applications, applicationFilter]);

  return (
    <div style={{ padding: '32px 48px', fontFamily: 'RoviaUI, Inter, system-ui' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Panou administrativ</p>
        <h1 style={{ fontSize: 34, margin: 0, color: 'var(--text)' }}>Control Center</h1>
        <p style={{ maxWidth: 640, color: 'var(--muted)', marginTop: 12 }}>
          Monitorizează aplicațiile promotorilor, aprobă sau respinge propuneri și sincronizează oferta turistică a platformei.
        </p>
      </header>

      {error && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #fecaca',
          background: 'rgba(248,113,113,0.12)',
          color: '#b91c1c'
        }}>
          {error}
        </div>
      )}

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 36
      }}>
        <Card title="Aplicații în așteptare" value={summary?.PendingApplications ?? 0} accent="#facc15" />
        <Card title="Aplicații aprobate" value={summary?.ApprovedApplications ?? 0} accent="#22c55e" />
        <Card title="Aplicații respinse" value={summary?.RejectedApplications ?? 0} accent="#ef4444" />
        <Card title="Sugestii în așteptare" value={summary?.PendingSuggestions ?? 0} accent="#fb7185" />
        <Card title="Aprobate săptămâna aceasta" value={summary?.ApprovedThisWeek ?? 0} accent="#0ea5e9" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32 }}>
        <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Aplicații Promotori</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setApplicationFilter(status)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: applicationFilter === status ? 'var(--accent)' : 'transparent',
                    color: applicationFilter === status ? '#fff' : 'var(--text)',
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
            {loadingApplications && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
            {!loadingApplications && visibleApplications.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nu există aplicații pentru filtrul curent.</p>
            )}
            {!loadingApplications && visibleApplications.map((app) => (
              <div key={app.id} style={{
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 16,
                marginBottom: 12,
                background: 'var(--topbar-bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{app.companyName}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{app.contactEmail}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(app.submittedAt).toLocaleDateString('ro-RO')}</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{app.motivation}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDecision('application', app.id, 'approve')}
                    disabled={app.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: app.status === 'Pending' ? '#22c55e' : '#9ca3af',
                      color: '#fff',
                      cursor: app.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Aprobă
                  </button>
                  <button
                    onClick={() => handleDecision('application', app.id, 'reject')}
                    disabled={app.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: app.status === 'Pending' ? '#ef4444' : '#9ca3af',
                      color: '#fff',
                      cursor: app.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Sugestii atracții</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_FILTERS.map((status) => (
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
            {loadingSuggestions && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
            {!loadingSuggestions && suggestions.length === 0 && (
              <p style={{ color: 'var(--muted)' }}>Nu există sugestii pentru filtrul curent.</p>
            )}
            {!loadingSuggestions && suggestions.map((suggestion) => (
              <div key={suggestion.id} style={{
                borderRadius: 16,
                border: '1px solid var(--border)',
                padding: 16,
                marginBottom: 12,
                background: 'var(--topbar-bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{suggestion.title}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Propus de {suggestion.promoterName || 'anonim'}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(suggestion.submittedAt).toLocaleDateString('ro-RO')}</span>
                </div>
                <p style={{ marginTop: 10, fontSize: 14 }}>{suggestion.details}</p>
                {suggestion.createsNewAttraction ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Atracție nouă: {suggestion.proposedName}</p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Actualizare pentru ID #{suggestion.attractionId}</p>
                )}
                {suggestion.adminResponse && (
                  <p style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>Notă precedentă: {suggestion.adminResponse}</p>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleDecision('suggestion', suggestion.id, 'approve')}
                    disabled={suggestion.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: suggestion.status === 'Pending' ? '#2563eb' : '#9ca3af',
                      color: '#fff',
                      cursor: suggestion.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Aprobare rapidă
                  </button>
                  <button
                    onClick={() => handleDecision('suggestion', suggestion.id, 'reject')}
                    disabled={suggestion.status !== 'Pending'}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: suggestion.status === 'Pending' ? '#ef4444' : '#9ca3af',
                      color: '#fff',
                      cursor: suggestion.status === 'Pending' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Respinge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
