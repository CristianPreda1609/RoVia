import { useCallback, useEffect, useMemo, useState } from 'react';
import promoterService from '../services/promoterService';
import useAuth from '../hooks/useAuth';

const typeOptions = [
  { value: '1', label: 'Naturală' },
  { value: '2', label: 'Culturală' },
  { value: '3', label: 'Istorică' },
  { value: '4', label: 'Distracție' },
  { value: '5', label: 'Religioasă' }
];

const suggestionStatuses = ['Pending', 'Approved', 'Rejected'];

const difficultyOptions = [
  { value: 1, label: 'Ușor' },
  { value: 2, label: 'Mediu' },
  { value: 3, label: 'Dificil' }
];

const createBlankAnswer = (isCorrect = false) => ({
  text: '',
  isCorrect
});

const createBlankQuestion = () => ({
  text: '',
  pointsValue: 10,
  answers: [createBlankAnswer(true), createBlankAnswer(false)]
});

const createQuizInitialState = (attractionId = '') => ({
  attractionId,
  title: '',
  description: '',
  difficultyLevel: 1,
  timeLimit: 120,
  questions: [createBlankQuestion()]
});

const StatusPill = ({ status }) => {
  const palette = {
    Pending: { bg: 'rgba(250, 204, 21, 0.15)', color: '#b45309' },
    Approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#047857' },
    Rejected: { bg: 'rgba(248, 113, 113, 0.15)', color: '#b91c1c' }
  };
  const { bg, color } = palette[status] || palette.Pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: bg,
      color
    }}>
      ● {status}
    </span>
  );
};

function PromoterPortal() {
  const { role, username } = useAuth();
  const isPromoter = role === 'Promoter' || role === 'Administrator';

  const [latestApplication, setLatestApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionFilter, setSuggestionFilter] = useState('Pending');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [applicationForm, setApplicationForm] = useState({
    companyName: '',
    companyWebsite: '',
    contactEmail: '',
    motivation: ''
  });

  const [suggestionForm, setSuggestionForm] = useState({
    attractionId: '',
    createsNewAttraction: true,
    title: '',
    details: '',
    proposedName: '',
    proposedDescription: '',
    proposedRegion: '',
    proposedType: typeOptions[0].value,
    proposedLatitude: '',
    proposedLongitude: '',
    proposedImageUrl: ''
  });

  const [ownedAttractions, setOwnedAttractions] = useState([]);
  const [ownedAttractionsLoading, setOwnedAttractionsLoading] = useState(false);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizForm, setQuizForm] = useState(createQuizInitialState());
  const [quizSaving, setQuizSaving] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizFormLoading, setQuizFormLoading] = useState(false);

  const pageTitle = useMemo(() => {
    if (isPromoter) return 'Studio-ul Promotorilor';
    if (latestApplication?.status === 'Pending') return 'Cererea ta este în analiză';
    return 'Devino promotor RoVia';
  }, [isPromoter, latestApplication]);

  const currentAttraction = useMemo(() => (
    ownedAttractions.find((item) => String(item.id) === String(selectedAttractionId))
  ), [ownedAttractions, selectedAttractionId]);

  useEffect(() => {
    if (!isPromoter) {
      promoterService.getLatestApplication()
        .then(setLatestApplication)
        .catch(() => setLatestApplication(null));
    }
  }, [isPromoter]);

  useEffect(() => {
    if (!isPromoter) return;

    const loadDashboard = async () => {
      try {
        const data = await promoterService.getDashboard();
        setDashboardStats(data);
      } catch (error) {
        console.error('Eroare dashboard:', error);
      }
    };

    loadDashboard();
  }, [isPromoter]);

  useEffect(() => {
    if (!isPromoter) return;

    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const data = await promoterService.getSuggestions(suggestionFilter);
        setSuggestions(data);
      } catch (error) {
        console.error('Eroare sugestii:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
  }, [isPromoter, suggestionFilter]);

  const loadOwnedAttractions = useCallback(async () => {
    if (!isPromoter) return;
    setOwnedAttractionsLoading(true);
    try {
      const data = await promoterService.getOwnedAttractions();
      setOwnedAttractions(data);
      if (data.length > 0) {
        const firstId = String(data[0].id);
        setSelectedAttractionId((prev) => prev || firstId);
        setQuizForm((prev) => ({ ...prev, attractionId: prev.attractionId || firstId }));
      } else {
        setSelectedAttractionId('');
        setQuizForm(createQuizInitialState());
      }
    } catch (error) {
      console.error('Eroare atracții:', error);
    } finally {
      setOwnedAttractionsLoading(false);
    }
  }, [isPromoter]);

  useEffect(() => {
    loadOwnedAttractions();
  }, [loadOwnedAttractions]);

  const refreshQuizzes = useCallback(async (attractionId) => {
    if (!attractionId) {
      setQuizzes([]);
      setQuizzesLoading(false);
      return;
    }
    setQuizzesLoading(true);
    try {
      const data = await promoterService.getQuizzesForAttraction(attractionId);
      setQuizzes(data);
    } catch (error) {
      console.error('Eroare quiz-uri:', error);
    } finally {
      setQuizzesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPromoter || !selectedAttractionId) {
      setQuizzes([]);
      return;
    }
    refreshQuizzes(selectedAttractionId);
  }, [isPromoter, selectedAttractionId, refreshQuizzes]);

  const handleSelectAttraction = (value) => {
    setSelectedAttractionId(value);
    setQuizForm((prev) => ({ ...prev, attractionId: value }));
    if (editingQuizId && value !== quizForm.attractionId) {
      setEditingQuizId(null);
    }
  };

  const handleQuizFieldChange = (field, value) => {
    setQuizForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) =>
        idx === questionIndex ? { ...question, [field]: value } : question
      )
    }));
  };

  const handleAnswerChange = (questionIndex, answerIndex, field, value) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, aIdx) =>
            aIdx === answerIndex ? { ...answer, [field]: value } : answer
          )
        };
      })
    }));
  };

  const handleMarkAnswerCorrect = (questionIndex, answerIndex) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        return {
          ...question,
          answers: question.answers.map((answer, aIdx) => ({
            ...answer,
            isCorrect: aIdx === answerIndex
          }))
        };
      })
    }));
  };

  const handleAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createBlankQuestion()]
    }));
  };

  const handleRemoveQuestion = (index) => {
    setQuizForm((prev) => {
      if (prev.questions.length === 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, idx) => idx !== index)
      };
    });
  };

  const handleAddAnswer = (questionIndex) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        if (question.answers.length >= 6) return question;
        return {
          ...question,
          answers: [...question.answers, createBlankAnswer(false)]
        };
      })
    }));
  };

  const handleRemoveAnswer = (questionIndex, answerIndex) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((question, idx) => {
        if (idx !== questionIndex) return question;
        if (question.answers.length <= 2) return question;
        return {
          ...question,
          answers: question.answers.filter((_, aIdx) => aIdx !== answerIndex)
        };
      })
    }));
  };

  const resetQuizForm = (attractionId) => {
    setEditingQuizId(null);
    setQuizForm(createQuizInitialState(attractionId || selectedAttractionId));
  };

  const handleQuizSubmit = async (event) => {
    event.preventDefault();
    if (!quizForm.attractionId) {
      setFeedback({ type: 'error', text: 'Selectează o atracție înainte de a crea un quiz.' });
      return;
    }

    const hasInvalidQuestion = quizForm.questions.some(
      (question) => !question.answers.some((answer) => answer.isCorrect)
    );
    if (hasInvalidQuestion) {
      setFeedback({ type: 'error', text: 'Fiecare întrebare are nevoie de un răspuns corect.' });
      return;
    }

    const payload = {
      attractionId: Number(quizForm.attractionId),
      title: quizForm.title,
      description: quizForm.description,
      difficultyLevel: Number(quizForm.difficultyLevel),
      timeLimit: Number(quizForm.timeLimit),
      questions: quizForm.questions.map((question, qIdx) => ({
        text: question.text,
        pointsValue: Number(question.pointsValue),
        order: qIdx + 1,
        answers: question.answers.map((answer, aIdx) => ({
          text: answer.text,
          isCorrect: answer.isCorrect,
          order: aIdx + 1
        }))
      }))
    };

    setFeedback(null);
    setQuizSaving(true);
    try {
      if (editingQuizId) {
        await promoterService.updateQuiz(editingQuizId, payload);
        setFeedback({ type: 'success', text: 'Modificările quiz-ului au fost salvate.' });
      } else {
        await promoterService.createQuiz(payload);
        setFeedback({ type: 'success', text: 'Quiz-ul a fost publicat.' });
      }
      resetQuizForm(quizForm.attractionId);
      await refreshQuizzes(quizForm.attractionId);
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut salva quiz-ul.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setQuizSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Confimi ștergerea acestui quiz?')) return;
    try {
      await promoterService.deleteQuiz(quizId);
      setFeedback({ type: 'success', text: 'Quiz-ul a fost șters.' });
      await refreshQuizzes(selectedAttractionId);
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut șterge quiz-ul.';
      setFeedback({ type: 'error', text: message });
    }
  };

  const handleEditQuiz = async (quizId) => {
    setQuizFormLoading(true);
    setFeedback(null);
    try {
      const quizDetails = await promoterService.getQuizDetails(quizId);
      if (!quizDetails) {
        setFeedback({ type: 'error', text: 'Nu am găsit detaliile quiz-ului selectat.' });
        return;
      }

      const ensureAnswers = (answersList) => {
        let normalized = (answersList || [])
          .slice()
          .sort((a, b) => (a?.order || 0) - (b?.order || 0))
          .map((answer) => ({
            text: answer?.text || '',
            isCorrect: Boolean(answer?.isCorrect)
          }));
        while (normalized.length < 2) {
          normalized = [...normalized, createBlankAnswer(false)];
        }
        if (!normalized.some((answer) => answer.isCorrect)) {
          normalized = normalized.map((answer, idx) => ({ ...answer, isCorrect: idx === 0 }));
        }
        return normalized;
      };

      const questions = (quizDetails.questions || [])
        .slice()
        .sort((a, b) => (a?.order || 0) - (b?.order || 0))
        .map((question) => ({
          text: question?.text || '',
          pointsValue: question?.pointsValue || 10,
          answers: ensureAnswers(question?.answers)
        }));

      const formQuestions = questions.length > 0 ? questions : [createBlankQuestion()];
      const attractionId = String(quizDetails.attractionId);

      setEditingQuizId(quizId);
      setSelectedAttractionId(attractionId);
      setQuizForm({
        attractionId,
        title: quizDetails.title || '',
        description: quizDetails.description || '',
        difficultyLevel: Number(quizDetails.difficultyLevel) || 1,
        timeLimit: Number(quizDetails.timeLimit) || 120,
        questions: formQuestions
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut încărca quiz-ul pentru editare.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setQuizFormLoading(false);
    }
  };

  const handleCancelQuizEdit = () => {
    resetQuizForm();
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setApplicationLoading(true);
    setFeedback(null);

    try {
      const payload = { ...applicationForm };
      const response = await promoterService.submitApplication(payload);
      setLatestApplication(response);
      setFeedback({ type: 'success', text: 'Cererea a fost trimisă către administratori.' });
      setApplicationForm({ companyName: '', companyWebsite: '', contactEmail: '', motivation: '' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut trimite cererea.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setApplicationLoading(false);
    }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const payload = {
        ...suggestionForm,
        attractionId: suggestionForm.attractionId ? Number(suggestionForm.attractionId) : null,
        proposedLatitude: suggestionForm.proposedLatitude ? Number(suggestionForm.proposedLatitude) : null,
        proposedLongitude: suggestionForm.proposedLongitude ? Number(suggestionForm.proposedLongitude) : null,
        proposedType: suggestionForm.proposedType ? Number(suggestionForm.proposedType) : null
      };

      await promoterService.submitSuggestion(payload);
      setSuggestionForm((prev) => ({
        ...prev,
        title: '',
        details: '',
        proposedName: '',
        proposedDescription: '',
        proposedRegion: '',
        proposedType: typeOptions[0].value,
        proposedLatitude: '',
        proposedLongitude: '',
        proposedImageUrl: ''
      }));
      setFeedback({ type: 'success', text: 'Sugestia a fost trimisă. Vei primi un răspuns după evaluare.' });
      setSuggestionFilter('Pending');
    } catch (error) {
      const message = error?.response?.data?.message || 'Nu am putut trimite sugestia.';
      setFeedback({ type: 'error', text: message });
    }
  };

  const summaryCards = [
    {
      title: 'Sugestii în așteptare',
      value: dashboardStats?.PendingSuggestions ?? 0,
      accent: '#facc15'
    },
    {
      title: 'Aprobate până acum',
      value: dashboardStats?.ApprovedSuggestions ?? 0,
      accent: '#22c55e'
    },
    {
      title: 'Ultima acțiune',
      value: dashboardStats?.LatestApplication?.status || '—',
      accent: '#3b82f6'
    }
  ];

  return (
    <div style={{ padding: '32px 48px', fontFamily: 'RoviaUI, Inter, system-ui' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Program Promoter</p>
        <h1 style={{ fontSize: 34, margin: 0, color: 'var(--text)' }}>{pageTitle}</h1>
        <p style={{ maxWidth: 640, color: 'var(--muted)', marginTop: 12 }}>
          {isPromoter
            ? 'Gestionează atracțiile propuse, urmărește statusul campaniilor tale și construiește experiențe memorabile pentru vizitatori.'
            : 'Completează formularul de mai jos pentru a primi acces la instrumentele de promovare și la statisticile avansate despre atracții.'}
        </p>
      </header>

      {feedback && (
        <div style={{
          marginBottom: 24,
          padding: '14px 18px',
          borderRadius: 16,
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          background: feedback.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
          color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
          fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      {!isPromoter && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          marginBottom: 48
        }}>
          <div style={{ borderRadius: 24, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Formular de înscriere</h2>
            <form onSubmit={handleApplicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['companyName', 'companyWebsite', 'contactEmail'].map((field) => (
                <div key={field}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{
                    field === 'companyName' ? 'Nume companie' : field === 'companyWebsite' ? 'Website' : 'Email de contact'
                  }</label>
                  <input
                    type={field === 'contactEmail' ? 'email' : 'text'}
                    value={applicationForm[field]}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)'
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Motivație</label>
                <textarea
                  value={applicationForm.motivation}
                  onChange={(e) => setApplicationForm((prev) => ({ ...prev, motivation: e.target.value }))}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--topbar-bg)',
                    color: 'var(--text)'
                  }}
                  placeholder="Spune-ne cum vrei să promovezi destinațiile locale."
                />
              </div>
              <button
                type="submit"
                disabled={applicationLoading}
                style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: applicationLoading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff'
                }}
              >
                {applicationLoading ? 'Se trimite...' : 'Trimite cererea'}
              </button>
            </form>
          </div>

          <div style={{ borderRadius: 24, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Status aplicație</h2>
            {latestApplication ? (
              <div>
                <p style={{ color: 'var(--muted)' }}>Ultima actualizare: {new Date(latestApplication.submittedAt).toLocaleDateString('ro-RO')}</p>
                <StatusPill status={latestApplication.status} />
                {latestApplication.adminNotes && (
                  <p style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--topbar-bg)', border: '1px dashed var(--border)' }}>
                    {latestApplication.adminNotes}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Încă nu ai trimis o aplicație. Completează formularul alăturat.</p>
            )}
          </div>
        </section>
      )}

      {isPromoter && (
        <section>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 18,
            marginBottom: 32
          }}>
            {summaryCards.map((card) => (
              <div key={card.title} style={{
                borderRadius: 18,
                padding: 20,
                border: '1px solid var(--border)',
                background: 'var(--card-bg)'
              }}>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{card.title}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 30, fontWeight: 700, color: card.accent }}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 430px) minmax(320px, 1fr)',
            gap: 32,
            alignItems: 'flex-start'
          }}>
            <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Sugerează o atracție</h2>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{username}</span>
              </div>
              <form onSubmit={handleSuggestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={suggestionForm.createsNewAttraction}
                    onChange={(e) => setSuggestionForm((prev) => ({ ...prev, createsNewAttraction: e.target.checked }))}
                  />
                  Propun atracție nouă
                </label>

                {!suggestionForm.createsNewAttraction && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>ID atracție existentă</label>
                    <input
                      type="number"
                      value={suggestionForm.attractionId}
                      onChange={(e) => setSuggestionForm((prev) => ({ ...prev, attractionId: e.target.value }))}
                      style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      placeholder="Ex: 12"
                      required={!suggestionForm.createsNewAttraction}
                    />
                  </div>
                )}

                {['title', 'details', 'proposedName', 'proposedDescription', 'proposedRegion', 'proposedImageUrl'].map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{
                      field === 'title'
                        ? 'Titlu campanie'
                        : field === 'details'
                          ? 'Detalii'
                          : field === 'proposedName'
                            ? 'Nume propus'
                            : field === 'proposedDescription'
                              ? 'Descriere propusă'
                              : field === 'proposedRegion'
                                ? 'Regiune'
                                : 'Imagine (URL)'
                    }</label>
                    {field === 'details' || field === 'proposedDescription' ? (
                      <textarea
                        value={suggestionForm[field]}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        rows={field === 'details' ? 2 : 3}
                        required
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={suggestionForm[field]}
                        onChange={(e) => setSuggestionForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        required
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                      />
                    )}
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Latitudine</label>
                    <input type="number" step="0.000001" value={suggestionForm.proposedLatitude} onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedLatitude: e.target.value }))} required={suggestionForm.createsNewAttraction} style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Longitudine</label>
                    <input type="number" step="0.000001" value={suggestionForm.proposedLongitude} onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedLongitude: e.target.value }))} required={suggestionForm.createsNewAttraction} style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Tip atracție</label>
                  <select
                    value={suggestionForm.proposedType}
                    onChange={(e) => setSuggestionForm((prev) => ({ ...prev, proposedType: e.target.value }))}
                    required={suggestionForm.createsNewAttraction}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)'
                    }}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" style={{
                  border: 'none',
                  borderRadius: 14,
                  padding: '12px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  color: '#fff'
                }}>
                  Trimite sugestia
                </button>
              </form>
            </div>

            <div style={{ borderRadius: 24, padding: 24, border: '1px solid var(--border)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Sugestiile mele</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {suggestionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSuggestionFilter(status)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--border)',
                        background: suggestionFilter === status ? 'var(--accent)' : 'transparent',
                        color: suggestionFilter === status ? '#fff' : 'var(--text)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                {suggestionsLoading && <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>}
                {!suggestionsLoading && suggestions.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>Nu există sugestii pentru filtrul curent.</p>
                )}
                {!suggestionsLoading && suggestions.map((item) => (
                  <div key={item.id} style={{
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    padding: 16,
                    marginBottom: 12,
                    background: 'var(--topbar-bg)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>{item.title}</h3>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{new Date(item.submittedAt).toLocaleDateString('ro-RO')}</p>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <p style={{ marginTop: 12, color: 'var(--text)', fontSize: 14 }}>{item.details}</p>
                    {item.adminResponse && (
                      <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>Feedback admin: {item.adminResponse}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 48, borderRadius: 28, padding: 28, border: '1px solid var(--border)', background: 'var(--card-bg)', boxShadow: '0 18px 40px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 }}>Builder Quiz</p>
                <h2 style={{ margin: '6px 0 10px 0', fontSize: 24 }}>Experiențe interactive pentru vizitatori</h2>
                <p style={{ margin: 0, color: 'var(--muted)', maxWidth: 520 }}>
                  Selectează o atracție și construiește provocări personalizate. Quiz-urile aprobate îți cresc vizibilitatea și oferă puncte bonus turiștilor.
                </p>
              </div>
              <div style={{ minWidth: 260 }}>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>Atracție gestionată</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <select
                    value={selectedAttractionId}
                    onChange={(e) => handleSelectAttraction(e.target.value)}
                    disabled={ownedAttractionsLoading || ownedAttractions.length === 0}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)'
                    }}
                  >
                    {ownedAttractions.length === 0 && <option value="">Nu ai încă atracții aprobate</option>}
                    {ownedAttractions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name || `Atracție #${item.id}`}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadOwnedAttractions}
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--topbar-bg)',
                      color: 'var(--text)',
                      borderRadius: 12,
                      padding: '0 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reîncarcă
                  </button>
                </div>
                {currentAttraction && (
                  <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
                    {currentAttraction.region || currentAttraction.location || 'Fără regiune'} · {currentAttraction.typeLabel || '—'}
                  </p>
                )}
              </div>
            </div>

            {ownedAttractionsLoading && ownedAttractions.length === 0 ? (
              <p style={{ marginTop: 18, color: 'var(--muted)' }}>Se încarcă lista atracțiilor tale...</p>
            ) : ownedAttractions.length === 0 ? (
              <div style={{ marginTop: 24, padding: 24, border: '1px dashed var(--border)', borderRadius: 20, background: 'rgba(15,118,110,0.05)' }}>
                <p style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>Nu ai atracții aprobate încă.</p>
                <p style={{ margin: '6px 0 0 0', fontSize: 14, color: 'var(--muted)' }}>Trimite propuneri noi sau așteaptă aprobarea echipei RoVia pentru a debloca constructorul de quiz-uri.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(320px, 1fr)', gap: 28, marginTop: 32 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 22, padding: 20, background: 'var(--topbar-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Quiz-uri existente</p>
                      <h3 style={{ margin: '4px 0 0 0' }}>{quizzes.length || 0} publicate</h3>
                    </div>
                    {quizzesLoading && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Actualizăm...</span>}
                  </div>

                  {quizzesLoading && quizzes.length === 0 && (
                    <p style={{ color: 'var(--muted)' }}>Se încarcă...</p>
                  )}

                  {!quizzesLoading && quizzes.length === 0 && (
                    <p style={{ color: 'var(--muted)' }}>Nu ai creat încă un quiz pentru această atracție.</p>
                  )}

                  {!quizzesLoading && quizzes.map((quiz) => {
                    const questionTotal = quiz.questions?.length ?? quiz.questionCount ?? 0;
                    const difficultyLabel = difficultyOptions.find((opt) => Number(opt.value) === Number(quiz.difficultyLevel))?.label || '—';
                    return (
                      <div key={quiz.id} style={{ borderRadius: 18, border: '1px solid var(--border)', padding: 14, marginTop: 12, background: 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <h4 style={{ margin: 0 }}>{quiz.title}</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--muted)' }}>{quiz.description || 'Fără descriere'}</p>
                          </div>
                          <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 999, fontSize: 12, background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontWeight: 600 }}>{difficultyLabel}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>
                          <span>{questionTotal} întrebări</span>
                          <span>•</span>
                          <span>{quiz.timeLimit || 0} sec</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                          <button
                            type="button"
                            onClick={() => handleEditQuiz(quiz.id)}
                            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: '8px 0', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Editează
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            style={{ flex: 1, border: 'none', borderRadius: 12, padding: '8px 0', background: 'rgba(239,68,68,0.15)', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderRadius: 24, border: '1px solid var(--border)', padding: 24, background: 'var(--topbar-bg)', position: 'relative' }}>
                  {quizFormLoading && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 24, backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                      Se încarcă detaliile quiz-ului...
                    </div>
                  )}
                  <form onSubmit={handleQuizSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{editingQuizId ? 'Editează quiz-ul' : 'Construiește un quiz nou'}</h3>
                      <p style={{ margin: '6px 0 0 0', color: 'var(--muted)', fontSize: 13 }}>
                        {editingQuizId ? 'Actualizează întrebările existente și publică din nou.' : 'Adaugă minim două întrebări pentru a face quiz-ul valid.'}
                      </p>
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Titlu</label>
                      <input
                        type="text"
                        value={quizForm.title}
                        onChange={(e) => handleQuizFieldChange('title', e.target.value)}
                        required
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Descriere</label>
                      <textarea
                        value={quizForm.description}
                        onChange={(e) => handleQuizFieldChange('description', e.target.value)}
                        rows={2}
                        style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Dificultate</label>
                        <select
                          value={quizForm.difficultyLevel}
                          onChange={(e) => handleQuizFieldChange('difficultyLevel', Number(e.target.value))}
                          style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                        >
                          {difficultyOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Limită timp (secunde)</label>
                        <input
                          type="number"
                          min={30}
                          max={600}
                          value={quizForm.timeLimit}
                          onChange={(e) => handleQuizFieldChange('timeLimit', Number(e.target.value))}
                          style={{ width: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                        />
                      </div>
                    </div>

                    {quizForm.questions.map((question, qIdx) => (
                      <div key={`question-${qIdx}`} style={{ border: '1px solid var(--border)', borderRadius: 18, padding: 16, background: 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <h4 style={{ margin: 0 }}>Întrebarea #{qIdx + 1}</h4>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="number"
                              min={5}
                              max={50}
                              value={question.pointsValue}
                              onChange={(e) => handleQuestionChange(qIdx, 'pointsValue', Number(e.target.value))}
                              style={{ width: 72, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              disabled={quizForm.questions.length === 1}
                              style={{ border: 'none', background: 'rgba(248,113,113,0.12)', color: '#b91c1c', borderRadius: 10, padding: '6px 10px', fontWeight: 600, cursor: quizForm.questions.length === 1 ? 'not-allowed' : 'pointer' }}
                            >
                              Elimină
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={question.text}
                          onChange={(e) => handleQuestionChange(qIdx, 'text', e.target.value)}
                          rows={2}
                          style={{ width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                          placeholder="Introduce întrebarea aici"
                        />

                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {question.answers.map((answer, aIdx) => (
                            <div key={`answer-${qIdx}-${aIdx}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <input
                                type="text"
                                value={answer.text}
                                onChange={(e) => handleAnswerChange(qIdx, aIdx, 'text', e.target.value)}
                                placeholder={`Răspuns #${aIdx + 1}`}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--topbar-bg)', color: 'var(--text)' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleMarkAnswerCorrect(qIdx, aIdx)}
                                style={{
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: 999,
                                  background: answer.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.3)',
                                  color: answer.isCorrect ? '#15803d' : '#475569',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {answer.isCorrect ? 'Corectă' : 'Marchează' }
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAnswer(qIdx, aIdx)}
                                disabled={question.answers.length <= 2}
                                style={{
                                  border: 'none',
                                  padding: '8px 10px',
                                  borderRadius: 10,
                                  background: 'transparent',
                                  color: question.answers.length <= 2 ? '#94a3b8' : '#b91c1c',
                                  fontWeight: 600,
                                  cursor: question.answers.length <= 2 ? 'not-allowed' : 'pointer'
                                }}
                              >
                                −
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddAnswer(qIdx)}
                            style={{ alignSelf: 'flex-start', border: '1px dashed var(--border)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}
                          >
                            + Răspuns
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      style={{ border: '1px dashed var(--border)', borderRadius: 16, padding: '10px 14px', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + Adaugă o întrebare
                    </button>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {editingQuizId && (
                        <button
                          type="button"
                          onClick={handleCancelQuizEdit}
                          style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '10px 18px', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Renunță la editare
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={quizSaving || quizFormLoading}
                        style={{
                          border: 'none',
                          borderRadius: 14,
                          padding: '12px 18px',
                          fontWeight: 600,
                          fontSize: 15,
                          cursor: quizSaving ? 'wait' : 'pointer',
                          background: 'linear-gradient(135deg, #16a34a, #22d3ee)',
                          color: '#fff',
                          minWidth: 200
                        }}
                      >
                        {quizSaving ? 'Se salvează...' : editingQuizId ? 'Salvează quiz-ul' : 'Publică quiz-ul'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default PromoterPortal;
