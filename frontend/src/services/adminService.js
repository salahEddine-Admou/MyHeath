import api from './api';

export const getAdminOverview = () => api.get('/admin/overview');

export const getAdminUsers = (all = true) =>
  api.get('/admin/users', { params: { all: all ? '1' : '0' } });
export const createAdminUser = (payload) => api.post('/admin/users', payload);
export const updateAdminUser = (id, payload) => api.put(`/admin/users/${id}`, payload);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

export const getAdminPlans = () => api.get('/admin/plans');
export const createAdminPlan = (payload) => api.post('/admin/plans', payload);
export const updateAdminPlan = (id, payload) => api.put(`/admin/plans/${id}`, payload);
export const deleteAdminPlan = (id) => api.delete(`/admin/plans/${id}`);

export const getAdminSubscriptions = () => api.get('/admin/subscriptions');
export const assignAdminSubscription = (payload) => api.post('/admin/subscriptions', payload);
export const updateAdminSubscription = (id, payload) =>
  api.put(`/admin/subscriptions/${id}`, payload);
export const cancelAdminSubscription = (id, notes) =>
  api.post(`/admin/subscriptions/${id}/cancel`, { notes });
