import api from './api';

export const getInsights = () => api.get('/health/insights');
export const getSymptomHistory = () => api.get('/health/symptoms');
export const logSymptom = (payload) => api.post('/health/symptoms', payload);
export const updateSymptom = (id, payload) => api.put(`/health/symptoms/${id}`, payload);
export const deleteSymptom = (id) => api.delete(`/health/symptoms/${id}`);
export const getPeriods = () => api.get('/health/periods');
export const getHealthRecord = () => api.get('/health/record');
export const updateHealthRecord = (payload) => api.put('/health/record', payload);
export const getDoctors = () => api.get('/auth/doctors');
export const getUsers = () => api.get('/auth/users');
export const assignDoctor = (doctorId) =>
  api.post('/auth/assign-doctor', { doctorId });
export const getChatPartners = () => api.get('/chat/partners');
export const getConversation = (partnerId) => api.get(`/chat/${partnerId}`);
export const sendChatMessage = (receiverId, content) =>
  api.post('/chat/send', { receiverId, content });
