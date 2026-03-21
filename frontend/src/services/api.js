import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const api  = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

export const workflowAPI = {
  create:          (d)         => api.post('/workflows', d),
  import:          (d)         => api.post('/workflows/import', d),
  list:            ()          => api.get('/workflows'),
  getById:         (id)        => api.get(`/workflows/${id}`),
  update:          (id, d)     => api.put(`/workflows/${id}`, d),
  delete:          (id)        => api.delete(`/workflows/${id}`),
  activate:        (id)        => api.post(`/workflows/${id}/activate`),
  deactivate:      (id)        => api.post(`/workflows/${id}/deactivate`),
  execute:         (id)        => api.post(`/workflows/${id}/execute`),
  listExecutions:  (id)        => api.get(`/workflows/${id}/executions`),
  getExecution:    (wid, eid)  => api.get(`/workflows/${wid}/executions/${eid}`),
};

export const contactsAPI = {
  create:   (d)          => api.post('/contacts', d),
  bulk:     (contacts)   => api.post('/contacts/bulk', { contacts }),
  list:     (params={})  => api.get('/contacts', { params }),
  getById:  (id)         => api.get(`/contacts/${id}`),
  update:   (id, d)      => api.put(`/contacts/${id}`, d),
  delete:   (id)         => api.delete(`/contacts/${id}`),
  addTags:  (id, tags)   => api.post(`/contacts/${id}/tags`, { tags }),
};

export const opportunitiesAPI = {
  create:    (d)          => api.post('/opportunities', d),
  list:      ()           => api.get('/opportunities'),
  getById:   (id)         => api.get(`/opportunities/${id}`),
  update:    (id, d)      => api.put(`/opportunities/${id}`, d),
  move:      (id, stage)  => api.put(`/opportunities/${id}/move`, { stage }),
  delete:    (id)         => api.delete(`/opportunities/${id}`),
  pipelines: ()           => api.get('/opportunities/pipelines'),
};

export const messagesAPI = {
  sendSms:      (d) => api.post('/messages/sms',      d),
  sendEmail:    (d) => api.post('/messages/email',    d),
  sendWhatsapp: (d) => api.post('/messages/whatsapp', d),
  get:          (id)=> api.get(`/messages/${id}`),
};

export const registryAPI = {
  triggers: () => api.get('/registries/triggers'),
  actions:  () => api.get('/registries/actions'),
};

export default api;
