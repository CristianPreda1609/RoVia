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
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
            setCurrentQuestionIndex(0);
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
        setCurrentQuestionIndex(0);
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Se încarcă...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>{error}</div>;
    if (!attraction) return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Atracția nu a fost găsită</div>;

    const currentQuestion = quizDetails?.questions?.[currentQuestionIndex];
    const isLastQuestion = quizDetails ? currentQuestionIndex === quizDetails.questions.length - 1 : false;
    const isCurrentAnswered = currentQuestion ? Boolean(answers[currentQuestion.id]) : false;
    const basePointsTotal = quizDetails?.questions?.reduce((sum, q) => sum + (q.pointsValue || 0), 0) || 0;
    const difficultyMultiplier = quizDetails?.difficultyLevel || 1;
    const maxPointsForQuiz = quizDetails ? (quizDetails.maxPoints ?? basePointsTotal * difficultyMultiplier) : 0;
    const questionsServed = quizDetails?.attemptQuestions ?? quizDetails?.AttemptQuestions ?? quizDetails?.questions?.length ?? 0;
    const questionPoolSize = quizDetails?.questionPoolSize ?? quizDetails?.QuestionPoolSize ?? quizDetails?.questions?.length ?? 0;
    const currentQuestionTypeLabel = currentQuestion?.questionType === 'true_false' ? 'Adevărat / Fals' : 'Răspuns multiplu';

    const handleNextQuestion = () => {
        if (!isCurrentAnswered || !quizDetails) return;
        setCurrentQuestionIndex(prev => Math.min(prev + 1, quizDetails.questions.length - 1));
    };

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
            <div style={{ display: 'grid', gridTemplateRows: activeQuiz ? '2fr 1fr' : '1fr 1fr', gap: '20px' }}>
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
                                            {quiz.questionPoolSize ? (
                                                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                                                    🎲 Random din {quiz.questionPoolSize} întrebări
                                                </div>
                                            ) : null}
                                            {quiz.maxPoints ? (
                                                <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px', fontWeight: 600 }}>
                                                    🏅 Până la {quiz.maxPoints} puncte
                                                </div>
                                            ) : null}
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

                            {quizDetails && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    marginBottom: '16px',
                                    fontSize: '13px',
                                    color: 'var(--accent)',
                                    fontWeight: 600
                                }}>
                                    <span>🏅 Punctaj maxim: {maxPointsForQuiz}p</span>
                                    <span>🔥 Dificultate x{difficultyMultiplier}</span>
                                    <span>⚖️ Puncte bază: {basePointsTotal}p</span>
                                    <span>🎲 {questionsServed} întrebări random din {questionPoolSize}</span>
                                </div>
                            )}

                            {quizSubmitted && result ? (
                                // Rezultat
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#dcfce7', borderRadius: '12px', border: '1px solid #86efac' }}>
                                    <h3 style={{ color: '#166534', margin: '0 0 12px 0' }}>🎉 Quiz finalizat!</h3>
                                    <p style={{ fontSize: '26px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>
                                        {result.pointsEarned} / {result.maxPoints} puncte
                                    </p>
                                    <p style={{ margin: '0 0 4px 0', color: '#166534', fontWeight: 600 }}>
                                        Răspunsuri corecte: {result.correctAnswers} din {result.totalQuestions}
                                    </p>
                                    <p style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '13px' }}>
                                        Pool: {result.totalQuestions} / {result.questionPoolSize} întrebări servite
                                    </p>
                                    <p style={{ margin: 0, color: '#15803d', fontSize: '13px' }}>
                                        Multiplicator dificultate x{result.difficultyMultiplier} • Puncte de bază: {result.basePoints}
                                    </p>
                                </div>
                            ) : quizDetails && currentQuestion ? (
                                // Întrebare curentă
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--muted)', fontSize: '14px' }}>
                                        <span>
                                            Întrebarea {currentQuestionIndex + 1} / {quizDetails.questions.length}
                                        </span>
                                        {!isLastQuestion && (
                                            <span>
                                                Mai sunt {quizDetails.questions.length - currentQuestionIndex - 1} întrebări
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '16px' }}>
                                            {currentQuestion.text}
                                        </h4>
                                        <p style={{ margin: '0 0 10px 0', color: 'var(--muted)', fontSize: '13px' }}>Tip întrebare: {currentQuestionTypeLabel}</p>
                                        {currentQuestion.questionType === 'true_false' ? (
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {currentQuestion.answers.map(a => {
                                                    const isSelected = answers[currentQuestion.id] === a.id;
                                                    return (
                                                        <button
                                                            key={a.id}
                                                            onClick={() => handleAnswerSelect(currentQuestion.id, a.id)}
                                                            disabled={quizSubmitted}
                                                            style={{
                                                                flex: '1 1 140px',
                                                                padding: '12px',
                                                                borderRadius: '10px',
                                                                border: isSelected ? '2px solid #10b981' : '1px solid var(--border)',
                                                                backgroundColor: isSelected ? '#dcfce7' : 'var(--card-bg)',
                                                                color: 'var(--text)',
                                                                fontWeight: 600,
                                                                cursor: quizSubmitted ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            {a.text}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {currentQuestion.answers.map(a => (
                                                    <label
                                                        key={a.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '10px',
                                                            background: answers[currentQuestion.id] === a.id ? 'rgba(59,130,246,0.08)' : 'transparent',
                                                            border: answers[currentQuestion.id] === a.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                            borderRadius: '6px',
                                                            cursor: quizSubmitted ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`q_${currentQuestion.id}`}
                                                            value={a.id}
                                                            checked={answers[currentQuestion.id] === a.id}
                                                            onChange={() => handleAnswerSelect(currentQuestion.id, a.id)}
                                                            style={{ marginRight: '10px' }}
                                                            disabled={quizSubmitted}
                                                        />
                                                        <span style={{ color: 'var(--text)' }}>{a.text}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {!quizSubmitted && (
                                            <button
                                                onClick={isLastQuestion ? handleSubmitQuiz : handleNextQuestion}
                                                disabled={!isCurrentAnswered}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    background: !isCurrentAnswered ? 'var(--muted)' : isLastQuestion ? '#10b981' : 'var(--accent)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    cursor: !isCurrentAnswered ? 'not-allowed' : 'pointer',
                                                    marginTop: '16px'
                                                }}
                                            >
                                                {isLastQuestion ? '✓ Trimite Răspunsurile' : 'Următoarea întrebare'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: 'var(--muted)' }}>Se încarcă quiz-ul...</p>
                            )}
                        </>
                    )}
                </div>

                {/* Hartă disponibilă și în timpul quiz-ului */}
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
            </div>
        </div>
    );
}

export default AttractionPage;
