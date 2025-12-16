import api from './api';

const promoterService = {
  async submitApplication(payload) {
    const { data } = await api.post('/promoter/applications', payload);
    return data;
  },

  async getApplications() {
    const { data } = await api.get('/promoter/applications');
    return data;
  },

  async getLatestApplication() {
    const { data } = await api.get('/promoter/applications/latest');
    return data;
  },

  async getDashboard() {
    const { data } = await api.get('/promoter/dashboard');
    return data;
  },

  async submitSuggestion(payload) {
    const { data } = await api.post('/promoter/suggestions', payload);
    return data;
  },

  async getSuggestions(status) {
    const { data } = await api.get('/promoter/suggestions', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async getOwnedAttractions() {
    const { data } = await api.get('/promoter/attractions');
    return data;
  },

  async getQuizzesForAttraction(attractionId) {
    const { data } = await api.get(`/quiz/attraction/${attractionId}`);
    return data;
  },

  async getQuizDetails(quizId) {
    const { data } = await api.get(`/quiz/${quizId}/manage`);
    return data;
  },

  async createQuiz(payload) {
    const { data } = await api.post('/quiz', payload);
    return data;
  },

  async updateQuiz(id, payload) {
    const { data } = await api.put(`/quiz/${id}`, payload);
    return data;
  },

  async deleteQuiz(id) {
    await api.delete(`/quiz/${id}`);
  }
};

export default promoterService;
