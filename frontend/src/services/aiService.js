import api from './api';

export const aiChat = (message, history = []) =>
  api.post('/ai/chat', { message, history });

export const aiExplainInsights = () => api.post('/ai/explain-insights');

export const aiParseSymptoms = (text) => api.post('/ai/parse-symptoms', { text });

export const aiDoctorBrief = () => api.post('/ai/doctor-brief');

export const aiWellnessPlan = () => api.post('/ai/wellness-plan');

export const aiAskDoctor = (concern) =>
  api.post('/ai/ask-doctor', { concern });
