import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import api from '../services/api';
import quizService from '../services/quizService';

function AttractionPage() {
    const { id } = useParams();
    const [attraction, setAttraction] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizDetails, setQuizDetails] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const attractionRes = await api.get(`/attractions/${id}`);
                setAttraction(attractionRes.data);

                const quizzesRes = await quizService.getQuizzesByAttraction(id);
                setQuizzes(quizzesRes || []);
            } catch (err) {
                console.error('Error:', err);
                setError('A apărut o eroare.');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    // Timer pentru quiz
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || quizSubmitted) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft, quizSubmitted]);

    const handleStartQuiz = async (quiz) => {
        try {
            const details = await quizService.getQuiz(quiz.id);
            setQuizDetails(details);
            setActiveQuiz(quiz);
            setAnswers({});
            setTimeLeft(quiz.timeLimit);
            setQuizSubmitted(false);
            setResult(null);
        } catch (err) {
            console.error('Eroare la încărcarea quiz-ului:', err);
        }
    };

    const handleAnswerSelect = (questionId, answerId) => {
        setAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const navigate = useNavigate();

    const handleSubmitQuiz = async () => {
        if (quizSubmitted) return;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Trebuie să fii autentificat pentru a trimite quiz-ul.');
            navigate('/login');
            return;
        }

        setQuizSubmitted(true);

        try {
            const response = await quizService.submitQuiz(activeQuiz.id, answers);
            setResult(response);
        } catch (err) {
            console.error('Eroare la trimiterea quiz-ului:', err);

            // Dacă serverul răspunde cu detalii, afișăm mesajul util
            if (err.response) {
                const status = err.response.status;
                const serverMsg = err.response.data && err.response.data.message ? err.response.data.message : null;
                if (status === 401) {
                    alert('Sesiunea a expirat sau token invalid. Te rog autentifică-te din nou.');
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }
                if (serverMsg) {
                    alert(serverMsg);
                } else {
                    alert('A apărut o eroare la trimiterea quiz-ului. Încearcă din nou.');
                }
            } else {
                // Eroare de rețea sau altceva
                alert('Nu s-a putut contacta serverul. Verifică conexiunea și încearcă din nou.');
            }

            // Permitem retry
            setQuizSubmitted(false);
        }
    };

    const handleBackToList = () => {
        setActiveQuiz(null);
        setQuizDetails(null);
        setAnswers({});
        setTimeLeft(null);
        setQuizSubmitted(false);
        setResult(null);
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Se încarcă...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>{error}</div>;
    if (!attraction) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Atracția nu a fost găsită</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 80px)' }}>
            {/* STÂNGA: Detalii Atracție */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
                {/* Imagine atracție */}
                {attraction.imageUrl && (
                    <img
                        src={attraction.imageUrl}
                        alt={attraction.name}
                        style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                )}

                {/* Titlu și informații generale */}
                <h1 style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '28px' }}>
                    {attraction.name}
                </h1>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '14px', color: 'var(--muted)' }}>
                    <span>📍 {attraction.region}</span>
                    <span>⭐ {attraction.rating}/5</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h2 style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '16px', fontWeight: '600' }}>
                        Descriere
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text)', lineHeight: '1.6', fontSize: '14px' }}>
                        {attraction.description}
                    </p>
                </div>
            </div>

            {/* DREAPTA: Quiz sau Hartă */}
            <div style={{ display: 'grid', gridTemplateRows: activeQuiz ? '1fr' : '1fr 1fr', gap: '20px' }}>
                {/* Quiz Section */}
                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowY: 'auto', border: '1px solid var(--border)' }}>
                    {!activeQuiz ? (
                        // Lista de quiz-uri
                        <>
                            <h2 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '18px' }}>
                                🎯 Quiz-uri
                            </h2>
                            {quizzes.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Nu sunt quiz-uri disponibile.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {quizzes.map(quiz => (
                                        <div key={quiz.id} style={{ padding: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                            <strong style={{ color: 'var(--text)' }}>{quiz.title}</strong>
                                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                                                {quiz.questionsCount} întrebări • {Math.floor(quiz.timeLimit / 60)} min
                                            </div>
                                            <button
                                                onClick={() => handleStartQuiz(quiz)}
                                                style={{ marginTop: '8px', padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                                            >
                                                ▶ Start Quiz
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        // Quiz activ
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <button onClick={handleBackToList} style={{ padding: '8px 16px', background: 'var(--muted)', color: 'var(--card-bg)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    ← Înapoi
                                </button>
                                {timeLeft !== null && !quizSubmitted && (
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: timeLeft < 30 ? '#ef4444' : 'var(--accent)' }}>
                                        ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </div>
                                )}
                            </div>

                            <h2 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '18px' }}>
                                {activeQuiz.title}
                            </h2>

                            {quizSubmitted && result ? (
                                // Rezultat
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                                    <h3 style={{ color: '#166534', margin: '0 0 12px 0' }}>🎉 Quiz finalizat!</h3>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: 0 }}>
                                        +{result.pointsEarned} puncte
                                    </p>
                                </div>
                            ) : quizDetails ? (
                                // Întrebări
                                <>
                                    {quizDetails.questions.map((q, idx) => (
                                        <div key={q.id} style={{ marginBottom: '16px', padding: '16px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)' }}>
                                                {idx + 1}. {q.text}
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {q.answers.map(a => (
                                                    <label key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: answers[q.id] === a.id ? 'rgba(59,130,246,0.06)' : 'transparent', border: answers[q.id] === a.id ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            name={`q_${q.id}`}
                                                            value={a.id}
                                                            checked={answers[q.id] === a.id}
                                                            onChange={() => handleAnswerSelect(q.id, a.id)}
                                                            style={{ marginRight: '10px' }}
                                                            disabled={quizSubmitted}
                                                        />
                                                        <span style={{ color: 'var(--text)' }}>{a.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {!quizSubmitted && (
                                        <button
                                            onClick={handleSubmitQuiz}
                                            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}
                                        >
                                            ✓ Trimite Răspunsurile
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p style={{ color: 'var(--muted)' }}>Se încarcă quiz-ul...</p>
                            )}
                        </>
                    )}
                </div>

                {/* Mini-hartă (doar când nu e quiz activ) */}
                {!activeQuiz && (
                    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
                        <h2 style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '16px' }}>
                            📍 Locație
                        </h2>
                        {isLoaded && attraction.latitude && attraction.longitude ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '250px', borderRadius: '8px' }}
                                center={{ lat: attraction.latitude, lng: attraction.longitude }}
                                zoom={13}
                                options={{ disableDefaultUI: true, zoomControl: true }}
                            >
                                <Marker position={{ lat: attraction.latitude, lng: attraction.longitude }} title={attraction.name} />
                            </GoogleMap>
                        ) : (
                            <p style={{ color: 'var(--muted)' }}>Se încarcă harta...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AttractionPage;
