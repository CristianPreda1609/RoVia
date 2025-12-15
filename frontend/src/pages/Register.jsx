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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

        try {
            // Trimitem datele la endpoint-ul de register din backend
            await api.post('/auth/register', formData);
            
            setSuccess('Cont creat cu succes! Te redirecționăm...');
            
            // După 2 secunde mergem la Login
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error(err);
            // Dacă backend-ul returnează eroare (ex: email existent), o afișăm
            if (err.response && err.response.data) {
                // Uneori backend-ul trimite erori sub formă de array sau string
                setError(JSON.stringify(err.response.data)); 
            } else {
                setError('A apărut o eroare la înregistrare.');
            }
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial', background: 'var(--bg)', color: 'var(--text)' }}>
            <h2>Înregistrare Cont Nou</h2>

            {error && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: '#10b981', marginBottom: '10px' }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label style={{ color: 'var(--text)' }}>Nume utilizator:</label>
                    <input 
                        type="text" 
                        name="username"
                        value={formData.username} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                </div>
                <div>
                    <label style={{ color: 'var(--text)' }}>Email:</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                </div>
                <div>
                    <label style={{ color: 'var(--text)' }}>Parolă:</label>
                    <input 
                        type="password" 
                        name="password"
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                    Creează Cont
                </button>
            </form>
            
            <p style={{ marginTop: '20px', color: 'var(--muted)' }}>
                Ai deja cont? <Link to="/login">Autentifică-te aici</Link>
            </p>
        </div>
    );
}

export default Register;