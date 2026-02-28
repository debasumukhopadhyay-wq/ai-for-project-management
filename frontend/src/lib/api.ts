import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request interceptor: attach JWT ─────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: handle token refresh ─────────────
api.interceptors.response.use(
  (response) => response.data, // Unwrap { success, data, ... }
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken } = (response.data as any).data;

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// ─── API helper functions ──────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const portfoliosApi = {
  getAll: () => api.get('/portfolios'),
  getOne: (id: string) => api.get(`/portfolios/${id}`),
  getDashboard: () => api.get('/portfolios/dashboard'),
  create: (data: any) => api.post('/portfolios', data),
  update: (id: string, data: any) => api.patch(`/portfolios/${id}`, data),
  delete: (id: string) => api.delete(`/portfolios/${id}`),
};

export const programsApi = {
  getAll: (portfolioId?: string) =>
    api.get('/programs', { params: portfolioId ? { portfolioId } : {} }),
  getOne: (id: string) => api.get(`/programs/${id}`),
  getSummary: (id: string) => api.get(`/programs/${id}/summary`),
  create: (data: any) => api.post('/programs', data),
  update: (id: string, data: any) => api.patch(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
};

export const projectsApi = {
  getAll: (filters?: any) => api.get('/projects', { params: filters }),
  getOne: (id: string) => api.get(`/projects/${id}`),
  getEVM: (id: string) => api.get(`/projects/${id}/evm`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const tasksApi = {
  getByProject: (projectId: string, filters?: any) =>
    api.get(`/projects/${projectId}/tasks`, { params: filters }),
  getKanban: (projectId: string) => api.get(`/projects/${projectId}/tasks/kanban`),
  getWBS: (projectId: string) => api.get(`/projects/${projectId}/tasks/wbs`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: any) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

export const milestonesApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/milestones`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/milestones`, data),
  update: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/milestones/${id}`, data),
};

export const risksApi = {
  getByProject: (projectId: string) => api.get(`/projects/${projectId}/risks`),
  getRiskMatrix: (projectId: string) => api.get(`/projects/${projectId}/risks/matrix`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/risks`, data),
  update: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/risks/${id}`, data),
};

export const financialsApi = {
  getBudgets: (projectId: string) => api.get(`/projects/${projectId}/budgets`),
  createBudget: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/budgets`, data),
  updateBudget: (projectId: string, id: string, data: any) =>
    api.patch(`/projects/${projectId}/budgets/${id}`, data),
};

export const resourcesApi = {
  getAll: () => api.get('/resources'),
  getCapacity: (startDate: string, endDate: string) =>
    api.get('/resources/capacity', { params: { startDate, endDate } }),
  create: (data: any) => api.post('/resources', data),
  update: (id: string, data: any) => api.patch(`/resources/${id}`, data),
};

export const documentsApi = {
  getAll: (filters?: any) => api.get('/documents', { params: filters }),
  getDownloadUrl: (id: string) => api.get(`/documents/${id}/download-url`),
  create: (data: any) => api.post('/documents', data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

export const reportsApi = {
  getExecutiveDashboard: () => api.get('/reports/executive-dashboard'),
};

export const aiApi = {
  query: (query: string) => api.post('/ai/query', { query }),
  generateStatusReport: (projectId: string) => api.post(`/ai/status-report/${projectId}`),
  analyzeRisks: (projectId: string) => api.post(`/ai/risk-analysis/${projectId}`),
  generateExecutiveSummary: (programId: string) => api.post(`/ai/executive-summary/${programId}`),
  summarizeMeetingMinutes: (data: any) => api.post('/ai/meeting-minutes', data),
  generateEmail: (data: any) => api.post('/ai/stakeholder-email', data),
  detectCostAnomalies: (projectId: string) => api.post(`/ai/cost-anomalies/${projectId}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

export const orgApi = {
  getMyOrg: () => api.get('/organizations/me'),
  getStats: () => api.get('/organizations/me/stats'),
};

export default api;
