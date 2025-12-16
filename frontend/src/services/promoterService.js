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
  }
};

export default promoterService;
