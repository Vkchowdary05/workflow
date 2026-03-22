import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const api  = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

export const workflowAPI = {
  create:          (d)         => api.post('/api/workflows', d),
  import:          (d)         => api.post('/api/workflows/import', d),
  list:            ()          => api.get('/api/workflows'),
  getById:         (id)        => api.get(`/api/workflows/${id}`),
  update:          (id, d)     => api.put(`/api/workflows/${id}`, d),
  delete:          (id)        => api.delete(`/api/workflows/${id}`),
  activate:        (id)        => api.post(`/api/workflows/${id}/activate`),
  deactivate:      (id)        => api.post(`/api/workflows/${id}/deactivate`),
  duplicate:       (id)        => api.post(`/api/workflows/${id}/duplicate`),
  export:          (id)        => api.get(`/api/workflows/${id}/export`),
  validate:        (id)        => api.post(`/api/workflows/${id}/validate`),
  execute:         (id)        => api.post(`/api/workflows/${id}/execute`),
  listExecutions:  (id)        => api.get(`/api/workflows/${id}/executions`),
  getExecution:    (wid, eid)  => api.get(`/api/workflows/${wid}/executions/${eid}`),
};

export const analyticsAPI = {
  getSummary:      (period='week') => api.get('/api/analytics/summary', { params: { period } }),
  getWorkflowStats:(id, period)    => api.get(`/api/analytics/workflows/${id}`, { params: { period } }),
  recordEvent:     (d)             => api.post('/api/analytics/events', d),
};

export const templatesAPI = {
  list:            ()          => api.get('/api/templates'),
  clone:           (id, body={})=> api.post(`/api/templates/${id}/clone`, body),
};

export const contactsAPI = {
  create:   (d)          => api.post('/api/contacts', d),
  bulk:     (contacts)   => api.post('/api/contacts/bulk', { contacts }),
  list:     (params={})  => api.get('/api/contacts', { params }),
  search:   (q, tags)    => api.get('/api/contacts/search/', { params: { q, tags } }),
  getById:  (id)         => api.get(`/api/contacts/${id}`),
  update:   (id, d)      => api.put(`/api/contacts/${id}`, d),
  delete:   (id)         => api.delete(`/api/contacts/${id}`),
  addTags:  (id, tags)   => api.post(`/api/contacts/${id}/tags`, { tags }),
};

export const opportunitiesAPI = {
  create:    (d)          => api.post('/api/opportunities', d),
  list:      ()           => api.get('/api/opportunities'),
  getById:   (id)         => api.get(`/api/opportunities/${id}`),
  update:    (id, d)      => api.put(`/api/opportunities/${id}`, d),
  move:      (id, stage)  => api.put(`/api/opportunities/${id}/move`, { stage }),
  delete:    (id)         => api.delete(`/api/opportunities/${id}`),
  pipelines: ()           => api.get('/api/opportunities/pipelines'),
  stages:    ()           => api.get('/api/opportunities/stages'),
};

export const messagesAPI = {
  sendSms:      (d) => api.post('/api/messages/sms',      d),
  sendEmail:    (d) => api.post('/api/messages/email',    d),
  sendWhatsapp: (d) => api.post('/api/messages/whatsapp', d),
  get:          (id)=> api.get(`/api/messages/${id}`),
  list:         ()  => api.get(`/api/messages`),
  templates:    (ch)=> api.get(`/api/messages/templates`, { params: { channel: ch } }),
};

export const registryAPI = {
  triggers: () => api.get('/api/registry/triggers'),
  actions:  () => api.get('/api/registry/actions'),
  testTrigger: (t) => api.post(`/api/registry/triggers/${t}/test`),
  testAction:  (a) => api.post(`/api/registry/actions/${a}/test`),
};

export default api;
