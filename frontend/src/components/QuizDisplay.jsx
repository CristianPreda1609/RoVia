function QuizDisplay({ quiz, onStartQuiz }) {
    if (!quiz) return null;

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>
                {quiz.title}
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                {quiz.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                <span>⏱️ {Math.floor(quiz.timeLimit / 60)} min</span>
                <span>🎲 {quiz.questionsCount} întrebări random{quiz.questionPoolSize ? ` din ${quiz.questionPoolSize}` : ''}</span>
                {quiz.maxPoints ? (
                    <span>🏅 până la {quiz.maxPoints}p</span>
                ) : null}
            </div>
            <button
                onClick={onStartQuiz}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                }}
            >
                Pornește Quiz
            </button>
        </div>
    );
}

export default QuizDisplay;
