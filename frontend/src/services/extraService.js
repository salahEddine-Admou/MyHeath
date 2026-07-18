import api from './api';

export const getAppointments = () => api.get('/appointments');
export const createAppointment = (payload) => api.post('/appointments', payload);
export const updateAppointmentStatus = (id, payload) =>
  api.patch(`/appointments/${id}/status`, payload);

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');

export const getMedicationReminders = () => api.get('/medications');
export const createMedicationReminder = (payload) => api.post('/medications', payload);
export const updateMedicationReminder = (id, payload) => api.put(`/medications/${id}`, payload);
export const deleteMedicationReminder = (id) => api.delete(`/medications/${id}`);

export const getAdminAudit = (limit = 50) => api.get('/admin/audit', { params: { limit } });
