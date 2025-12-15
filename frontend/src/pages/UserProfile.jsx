import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserProfile() {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        email: '',
        name: '',
        joinDate: '',
        favoriteAttractions: 0,
        visitedAttractions: 0
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const email = tokenPayload.email || tokenPayload.sub || 'user@example.com';
            const name = email.split('@')[0];
            
            setUserInfo({
                email: email,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                joinDate: new Date().toLocaleDateString('ro-RO'),
                favoriteAttractions: 3, // Mock data
                visitedAttractions: 7   // Mock data
            });
        } catch (error) {
            console.error('Eroare la decodarea token-ului:', error);
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: 'var(--bg)',
            padding: '20px' 
        }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <button 
                        onClick={() => navigate('/map')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--topbar-bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        ← Înapoi la hartă
                    </button>
                    <h1 style={{ margin: 0, color: 'var(--text)' }}>Profilul meu</h1>
                    <div></div> {/* Spacer */}
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px' 
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'var(--avatar-bg)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold'
                    }}>
                        {userInfo.name.charAt(0)}
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
                            {userInfo.name}
                        </h2>
                        <p style={{ margin: '0 0 4px 0', color: 'var(--muted)' }}>
                            📧 {userInfo.email}
                        </p>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px' }}>
                            👤 Membru din {userInfo.joinDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistici */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>
                        {userInfo.favoriteAttractions}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                        Atracții favorite
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>
                        {userInfo.visitedAttractions}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                        Atracții vizitate
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>
                        Explorer
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
                        Nivel utilizator
                    </div>
                </div>
            </div>

            {/* Acțiuni */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#374151' }}>
                    Acțiuni cont
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/map')}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <span>🗺️</span>
                        <span>Vezi harta cu atracții</span>
                    </button>

                    <button
                        onClick={() => alert('Funcționalitate în dezvoltare')}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--topbar-bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <span>⚙️</span>
                        <span>Setări cont</span>
                    </button>

                    <button
                        onClick={() => alert('Funcționalitate în dezvoltare')}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--topbar-bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <span>📊</span>
                        <span>Istoricul călătoriilor</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '20px'
                        }}
                    >
                        <span>🚪</span>
                        <span>Deconectare</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
