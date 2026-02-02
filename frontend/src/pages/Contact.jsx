import React, { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        setStatus({ type: 'warning', message: '⚠️ Mesajul nu a fost trimis. Scrie la contact@rovia.ro' });
      } else {
        setStatus({ type: 'success', message: '✅ Mesaj trimis cu succes! Îți vom răspunde curând.' });
        setForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      setStatus({ type: 'warning', message: '📧 Nu s-a putut trimite. Scrie la contact@rovia.ro' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--bg)',
      paddingLeft: '80px',
      paddingTop: '24px',
      paddingBottom: '40px',
      color: 'var(--text)'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📬 Contactează-ne
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '16px' }}>
            Avem întrebări? Noi suntem aici pentru a te ajuta. Trimite-ne un mesaj și îți vom răspunde în curând.
          </p>
        </div>

        {/* STATUS MESSAGE */}
        {status && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: `2px solid ${status.type === 'success' ? 'var(--success)' : 'var(--warning)'}`,
            background: status.type === 'success' 
              ? 'rgba(16, 185, 129, 0.1)' 
              : 'rgba(245, 158, 11, 0.1)',
            color: status.type === 'success' 
              ? 'var(--success)' 
              : 'var(--warning)'
          }}>
            {status.message}
          </div>
        )}

        {/* CONTACT FORM */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* NAME FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text)'
            }}>
              Nume Complet
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Popescu Ion"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: errors.name ? '2px solid var(--error)' : '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 200ms ease'
              }}
              onFocus={(e) => {
                if (!errors.name) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.name ? 'var(--error)' : 'var(--border)';
              }}
            />
            {errors.name && <p style={{ color: 'var(--error)', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.name}</p>}
          </div>

          {/* EMAIL FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text)'
            }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="ion@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: errors.email ? '2px solid var(--error)' : '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 200ms ease'
              }}
              onFocus={(e) => {
                if (!errors.email) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? 'var(--error)' : 'var(--border)';
              }}
            />
            {errors.email && <p style={{ color: 'var(--error)', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.email}</p>}
          </div>

          {/* SUBJECT FIELD */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text)'
            }}>
              Subiect
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={handleChange('subject')}
              placeholder="Cum funcționează punctele?"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: errors.subject ? '2px solid var(--error)' : '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 200ms ease'
              }}
              onFocus={(e) => {
                if (!errors.subject) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.subject ? 'var(--error)' : 'var(--border)';
              }}
            />
            {errors.subject && <p style={{ color: 'var(--error)', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.subject}</p>}
          </div>

          {/* MESSAGE FIELD */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: 'var(--text)'
            }}>
              Mesaj
            </label>
            <textarea
              value={form.message}
              onChange={handleChange('message')}
              placeholder="Spune-ne ce putem face mai bine..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: errors.message ? '2px solid var(--error)' : '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 200ms ease',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                if (!errors.message) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.message ? 'var(--error)' : 'var(--border)';
              }}
            />
            {errors.message && <p style={{ color: 'var(--error)', fontSize: '12px', margin: '6px 0 0 0' }}>{errors.message}</p>}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? '📤 Se trimite...' : '📮 Trimite Mesaj'}
          </button>
        </form>

        {/* INFO BOX */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            📧 Sau scrie direct: <strong>contact@rovia.ro</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
