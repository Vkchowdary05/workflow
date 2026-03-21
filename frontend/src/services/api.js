import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const workflowAPI = {
  create: (data) => api.post('/workflows', data),
  list: () => api.get('/workflows'),
  getById: (id) => api.get(`/workflows/${id}`),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
  execute: (id) => api.post(`/workflows/${id}/execute`),
  listExecutions: (id) => api.get(`/workflows/${id}/executions`),
  getExecution: (workflowId, executionId) => api.get(`/workflows/${workflowId}/executions/${executionId}`),
};

export const contactsAPI = {
  create: (data) => api.post('/contacts', data),
  list: () => api.get('/contacts'),
  getById: (id) => api.get(`/contacts/${id}`),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  addTags: (id, tags) => api.post(`/contacts/${id}/tags`, { tags }),
};

export const opportunitiesAPI = {
  create: (data) => api.post('/opportunities', data),
  list: () => api.get('/opportunities'),
  getById: (id) => api.get(`/opportunities/${id}`),
  move: (id, stage) => api.put(`/opportunities/${id}/move`, { stage }),
};

export default api;
