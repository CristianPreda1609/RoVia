import api from './api';

const adminService = {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard');
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
  }
};

export default adminService;
