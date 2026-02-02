import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import quizService from '../services/quizService';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);

  const attractionName = location.state?.attractionName || 'Atracție';

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await quizService.getQuiz(quizId);
        setQuiz(data);
        setTimeLeft(data.timeLimit);
        setCurrentQuestionIndex(0);
      } catch (error) {
        console.error('Eroare:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return prev;
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleAnswerSelect = (questionId, answerId) => {
    if (result) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);
    try {
      const submission = await quizService.submitQuiz(quizId, answers);
      setResult(submission);
      setTimeLeft(null);
    } catch (error) {
      console.error('Eroare la trimiterea quiz-ului:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--muted)' }}>
        Se încarcă quiz-ul...
      </div>
    );
  }

  if (!quiz) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--error)' }}>
        Quiz-ul nu a fost găsit
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isCurrentAnswered = Boolean(answers[currentQuestion?.id]);
  const basePoints = quiz.questions?.reduce((sum, q) => sum + (q.pointsValue || 0), 0) || 0;
  const difficultyMultiplier = quiz.difficultyLevel || 1;
  const maxPoints = quiz.maxPoints ?? basePoints * difficultyMultiplier;
  const questionPoolSize = quiz.questionPoolSize ?? quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const quizCompleted = Boolean(result);
  const secondsLeft = typeof timeLeft === 'number' ? Math.max(0, timeLeft) : 0;
  const questionTypeLabel = currentQuestion?.questionType === 'true_false' ? 'Adevărat / Fals' : 'Răspuns multiplu';

  const renderAnswerOptions = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.questionType === 'true_false') {
      return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {currentQuestion.answers.map(answer => {
            const isSelected = answers[currentQuestion.id] === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                disabled={quizCompleted}
                style={{
                  flex: '1 1 140px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--success)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--success-light)' : 'var(--card-bg)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  cursor: quizCompleted ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {answer.text}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentQuestion.answers.map(answer => (
          <label
            key={answer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: answers[currentQuestion.id] === answer.id ? 'var(--accent-light)' : 'var(--card-bg)',
              borderRadius: '8px',
              border: answers[currentQuestion.id] === answer.id ? '2px solid var(--accent)' : '1px solid var(--border)',
              cursor: quizCompleted ? 'not-allowed' : 'pointer',
              opacity: quizCompleted ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            <input
              type="radio"
              name={`question_${currentQuestion.id}`}
              value={answer.id}
              checked={answers[currentQuestion.id] === answer.id}
              onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
              style={{ marginRight: '12px', cursor: quizCompleted ? 'not-allowed' : 'pointer' }}
              disabled={quizCompleted}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{answer.text}</span>
          </label>
        ))}
      </div>
    );
  };

  const handleNextQuestion = () => {
    if (!isCurrentAnswered || quizCompleted) return;
    setCurrentQuestionIndex(prev => Math.min(prev + 1, quiz.questions.length - 1));
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'auto' }}>
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} userName="User" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ paddingTop: '80px', paddingLeft: sidebarOpen ? '250px' : '0', transition: 'padding-left 0.3s' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          
          {/* Header */}
          <div style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h1 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              📍 {attractionName}
            </h1>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '24px' }}>
              {quiz.title}
            </h2>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)'
            }}>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                {quiz.questions.length} întrebări
              </p>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: secondsLeft < 30 ? 'var(--error)' : 'var(--accent)'
              }}>
                ⏱️ {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Punctaj maxim</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{maxPoints}p</p>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Multiplicator</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>x{difficultyMultiplier}</p>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Întrebări răspunse</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{answeredCount}/{quiz.questions.length}</p>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--border)'
              }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>Pool întrebări</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{questionPoolSize} totale • {quiz.questions.length} random</p>
              </div>
            </div>
            <p style={{ margin: '12px 0 0 0', color: 'var(--muted)', fontSize: '13px' }}>
              🎲 Primești {quiz.questions.length} întrebări random dintr-un pool de {questionPoolSize} la fiecare încercare.
            </p>
          </div>

          {/* Rezultate */}
          {quizCompleted && result && (
            <div style={{
              backgroundColor: 'var(--success-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              border: '1px solid var(--success)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--success)' }}>🎉 Ai terminat quiz-ul!</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
                {result.pointsEarned} / {result.maxPoints} puncte
              </p>
              <p style={{ margin: '0 0 4px 0', color: 'var(--success)' }}>
                Răspunsuri corecte: {result.correctAnswers} din {result.totalQuestions}
              </p>
              <p style={{ margin: '0 0 4px 0', color: 'var(--success)', fontSize: '13px' }}>
                Pool: {result.totalQuestions} / {result.questionPoolSize} întrebări servite
              </p>
              <p style={{ margin: 0, color: 'var(--success)', fontSize: '13px' }}>
                Bază: {result.basePoints}p • Multiplicator dificultate x{result.difficultyMultiplier}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                <button
                  onClick={() => navigate('/profile', { state: { pointsEarned: result.pointsEarned } })}
                  style={{
                    flex: '1 1 180px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Vezi progresul meu
                </button>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    flex: '1 1 180px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--success)',
                    border: '1px solid var(--success)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Înapoi
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          {!quizCompleted && currentQuestion && (
            <div
              style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--muted)' }}>
                <span>
                  Întrebarea {currentQuestionIndex + 1} / {quiz.questions.length}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: secondsLeft < 30 ? 'var(--error)' : 'var(--accent)'
                  }}
                >
                  ⏱️ {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text)', fontSize: '16px' }}>{currentQuestion.text}</p>
                <p style={{ margin: '0 0 10px 0', color: 'var(--muted)', fontSize: '13px' }}>Tip întrebare: {questionTypeLabel}</p>
                {renderAnswerOptions()}
              </div>
              <button
                onClick={isLastQuestion ? handleSubmit : handleNextQuestion}
                disabled={!isCurrentAnswered || isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: isSubmitting ? 'var(--muted)' : isLastQuestion ? 'var(--success)' : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: !isCurrentAnswered || isSubmitting ? 'not-allowed' : 'pointer',
                  marginTop: '20px'
                }}
              >
                {isSubmitting
                  ? 'Se trimite...'
                  : isLastQuestion
                    ? '✓ Finalizează Quiz'
                    : 'Următoarea întrebare'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
