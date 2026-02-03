import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import { spacing } from '../constants/layout';

function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => {
        const code = searchParams.get('invite');
        if (code) {
            setInviteCode(code);
        }
    }, [searchParams]);

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
            const payload = {
                Username: formData.username,
                Email: formData.email,
                Password: formData.password
            };

            if (inviteCode) {
                payload.InviteCode = inviteCode;
            }

            await api.post('/auth/register', payload);
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
            background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.lg,
            fontFamily: 'Inter, system-ui, -apple-system',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: '-200px',
                right: '-200px',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'float 20s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-200px',
                left: '-200px',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'float 25s ease-in-out infinite reverse'
            }} />

            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '48px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                maxWidth: '440px',
                width: '100%',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        fontSize: '56px',
                        marginBottom: '16px',
                        display: 'inline-block',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        ✨
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: '700',
                        color: 'var(--text)',
                        letterSpacing: '-0.6px',
                        marginBottom: '8px'
                    }}>
                        Creează cont
                    </h1>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--muted)',
                        fontWeight: '400',
                        letterSpacing: '0.3px'
                    }}>
                        Alătură-te comunității RoVia
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--error-light)',
                        border: '1px solid var(--error)',
                        borderRadius: '12px',
                        padding: `${spacing.md} ${spacing.lg}`,
                        marginBottom: spacing.lg,
                        color: 'var(--error)',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'slideDown 300ms ease-out'
                    }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div style={{
                        background: 'var(--success-light)',
                        border: '1px solid var(--success)',
                        borderRadius: '12px',
                        padding: `${spacing.md} ${spacing.lg}`,
                        marginBottom: spacing.lg,
                        color: 'var(--success)',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'slideDown 300ms ease-out'
                    }}>
                        <span style={{ fontSize: '18px' }}>✓</span>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: spacing.sm,
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
                            placeholder="Ion_Popescu"
                            required
                            style={{
                                width: '100%',
                                padding: `${spacing.md} ${spacing.lg}`,
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
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

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: spacing.sm,
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
                            placeholder="ion@example.com"
                            required
                            style={{
                                width: '100%',
                                padding: `${spacing.md} ${spacing.lg}`,
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
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

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: spacing.sm,
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
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: `${spacing.md} ${spacing.lg}`,
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
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

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text)',
                            marginBottom: spacing.sm,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Confirmă parola
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: `${spacing.md} ${spacing.lg}`,
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
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

                    <Button
                        type="primary"
                        size="lg"
                        loading={loading}
                        style={{
                            width: '100%',
                            marginTop: spacing.md,
                            fontSize: '15px',
                            fontWeight: '600',
                            letterSpacing: '0.3px'
                        }}
                    >
                        {loading ? 'Se încarcă...' : 'Creează cont'}
                    </Button>
                </form>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.lg,
                    margin: `${spacing.xl} 0`,
                    opacity: 0.5
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '500' }}>SAU</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                <p style={{
                    textAlign: 'center',
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--muted)'
                }}>
                    Ai deja cont?{' '}
                    <Link
                        to="/login"
                        style={{
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'all 200ms ease'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Autentifică-te
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;