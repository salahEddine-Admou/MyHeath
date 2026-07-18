import api from './api';

export const saveDailyHealth = (payload) => api.post('/suivi/daily', payload);
export const getDailyHistory = (limit = 30) =>
  api.get('/suivi/daily', { params: { limit } });
export const getTodayHealth = () => api.get('/suivi/daily/today');
export const getDiabetesOverview = () => api.get('/suivi/diabetes');
export const updateDiabetesProfile = (payload) =>
  api.put('/suivi/diabetes/profile', payload);
