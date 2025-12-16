import api from './api';

const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  async getAttractions() {
    const { data } = await api.get('/attractions');
    return data;
  },

  async getApplications(status) {
    const { data } = await api.get('/admin/applications', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async decideApplication(id, action, notes = '') {
    const path = action === 'approve' ? 'approve' : 'reject';
    const { data } = await api.post(`/admin/applications/${id}/${path}`, { notes });
    return data;
  },

  async getSuggestions(status) {
    const { data } = await api.get('/admin/suggestions', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async decideSuggestion(id, action, notes = '') {
    const path = action === 'approve' ? 'approve' : 'reject';
    const { data } = await api.post(`/admin/suggestions/${id}/${path}`, { notes });
    return data;
  },

  async getQuizzesForAttraction(attractionId) {
    const { data } = await api.get(`/quiz/attraction/${attractionId}`);
    return data;
  },

  async getQuizDetails(id) {
    const { data } = await api.get(`/quiz/${id}/manage`);
    return data;
  },

  async createAttraction(payload) {
    const { data } = await api.post('/attractions', payload);
    return data;
  },

  async updateAttraction(id, payload) {
    const { data } = await api.put(`/attractions/${id}`, payload);
    return data;
  },

  async deleteAttraction(id) {
    await api.delete(`/attractions/${id}`);
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

export default adminService;
