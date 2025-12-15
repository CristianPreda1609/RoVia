import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validare parolă
        if (formData.password !== confirmPassword) {
            setError('Parolele nu se potrivesc!');
            return;
        }

        if (formData.password.length < 6) {
            setError('Parola trebuie să aibă minim 6 caractere!');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', formData);
            
            setSuccess('Cont creat cu succes! Te redirecționăm la login...');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error(err);
            if (err.response && err.response.data) {
                setError(err.response.data.message || 'Email-ul este deja folosit!');
            } else {
                setError('A apărut o eroare la înregistrare.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'RoviaUI, Inter, system-ui'
        }}>
            {/* Background decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-80px',
                right: '-80px',
                width: '400px',
                height: '400px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                filter: 'blur(60px)'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-100px',
                left: '-100px',
                width: '350px',
                height: '350px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                filter: 'blur(50px)'
            }}></div>

            {/* Main container */}
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 1px rgba(59, 130, 246, 0.5)',
                maxWidth: '420px',
                width: '100%',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '16px',
                        display: 'inline-block'
                    }}>
                        🎯
                    </div>
                    <h1 style={{
                        margin: '0 0 8px 0',
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'var(--text)',
                        letterSpacing: '-0.5px'
                    }}>
                        Creează cont nou
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--muted)',
                        fontWeight: '500'
                    }}>
                        Alătură-te comunității RoVia
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #fecaca',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#dc2626',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #a7f3d0',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#059669',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>✓</span>
                        {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Username field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Nume utilizator
                        </label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                            placeholder="John_Doe"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--topbar-bg)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 200ms ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Email field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Email
                        </label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            placeholder="exemplu@email.com"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--topbar-bg)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 200ms ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Password field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Parolă
                        </label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--topbar-bg)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 200ms ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Confirm Password field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Confirmă parola
                        </label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'var(--topbar-bg)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 200ms ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--accent)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Submit button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            padding: '14px 20px',
                            background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '15px',
                            marginTop: '8px',
                            transition: 'all 200ms ease',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                                Se creează...
                            </>
                        ) : (
                            <>
                                Creează cont
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '24px 0',
                    color: 'var(--muted)'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>SAU</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                {/* Login link */}
                <p style={{
                    margin: 0,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '14px'
                }}>
                    Ai deja cont?{' '}
                    <Link 
                        to="/login" 
                        style={{
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 200ms ease',
                            borderBottom: '2px solid transparent',
                            paddingBottom: '2px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderBottomColor = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderBottomColor = 'transparent';
                        }}
                    >
                        Autentifică-te acum
                    </Link>
                </p>

                {/* Footer info */}
                <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--muted)'
                }}>
                    🔒 Datele tale sunt protejate și criptate
                </div>
            </div>

            {/* Spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default Register;