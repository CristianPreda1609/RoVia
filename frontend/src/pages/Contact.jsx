import React, { useState, useEffect } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Numele este obligatoriu.';
    if (!form.email.trim()) e.email = 'Email-ul este obligatoriu.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email invalid.';
    if (!form.subject.trim()) e.subject = 'Subiectul este obligatoriu.';
    if (!form.message.trim() || form.message.trim().length < 10) e.message = 'Mesajul trebuie să aibă minim 10 caractere.';
    return e;
  };

  const handleChange = (k) => (ev) => {
    setForm(prev => ({ ...prev, [k]: ev.target.value }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setStatus(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      // Try to send to backend; if not available, simulate success
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        // fallback: show friendly message rather than throwing
        setStatus({ type: 'warning', message: 'Mesajul nu a fost trimis (server răspuns incorect). Poți scrie la contact@rovia.ro' });
      } else {
        setStatus({ type: 'success', message: 'Mesaj trimis cu succes. Îți vom răspunde curând.' });
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      setStatus({ type: 'warning', message: 'Nu s-a putut trimite mesajul. Verifică conexiunea sau scrie la contact@rovia.ro' });
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, prefill email from JWT and make it read-only
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = token.split('.')[1];
      if (!payload) return;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = base64 + (pad ? '='.repeat(4 - pad) : '');
      const json = JSON.parse(decodeURIComponent(escape(window.atob(padded))));
      const accountEmail = json?.email ?? json?.unique_name ?? json?.name ?? json?.sub ?? null;
      if (accountEmail) {
        setForm(f => ({ ...f, email: accountEmail }));
        setIsAuthed(true);
      }
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Contact</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 18 }}>Ai întrebări, sugestii sau ai găsit o problemă? Completează formularul de mai jos și îți răspundem în cel mai scurt timp.</p>

      {status && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: status.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.08)', border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.22)' : 'rgba(245,158,11,0.12)'}` }}>
          <div style={{ color: 'var(--text)' }}>{status.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Nume</div>
            <input value={form.name} onChange={handleChange('name')} disabled={loading} placeholder="Numele tău" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            {errors.name && <div style={{ color: '#ef4444', marginTop: 6 }}>{errors.name}</div>}
          </label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Email</div>
            <input value={form.email} onChange={handleChange('email')} readOnly={isAuthed} disabled={loading} placeholder="adresa@exemplu.com" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            {errors.email && <div style={{ color: '#ef4444', marginTop: 6 }}>{errors.email}</div>}
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Subiect</div>
            <input value={form.subject} onChange={handleChange('subject')} disabled={loading} placeholder="Subiectul mesajului" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            {errors.subject && <div style={{ color: '#ef4444', marginTop: 6 }}>{errors.subject}</div>}
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Mesaj</div>
            <textarea value={form.message} onChange={handleChange('message')} disabled={loading} placeholder="Descrie pe scurt problema sau întrebarea ta" rows={7} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} />
            {errors.message && <div style={{ color: '#ef4444', marginTop: 6 }}>{errors.message}</div>}
          </label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Se trimite...' : 'Trimite mesaj'}
          </button>

          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            Sau scrie direct la: <a href="mailto:contact@rovia.ro" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>contact@rovia.ro</a>
          </div>
        </div>
      </form>
    </div>
  );
}
