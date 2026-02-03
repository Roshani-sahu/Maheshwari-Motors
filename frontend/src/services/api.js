import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => {
    // Mock login - accepts any credentials
    return Promise.resolve({
      data: {
        user: { id: 1, name: 'Admin User', email: credentials.email },
        token: 'mock-jwt-token'
      }
    });
  },
  logout: () => Promise.resolve({ data: {} }),
  refreshToken: () => Promise.resolve({ data: {} }),
};

export const firmAPI = {
  getAll: () => Promise.resolve({ 
    data: [
      { id: 1, name: "Maa Auto", type: "NON_GST", address: "Surat, Gujarat", isLastUsed: true },
      { id: 2, name: "Motors GST", type: "GST", address: "Mumbai, Maharashtra", gstin: "27AAAAA0000A1Z5" },
      { id: 3, name: "Surat Branch", type: "BILL_ONLY", address: "Surat, Gujarat" }
    ]
  }),
  getById: (id) => Promise.resolve({ data: {} }),
  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  delete: (id) => Promise.resolve({ data: {} }),
};

export const accountAPI = {
  getAll: (firmId) => Promise.resolve({ data: [] }),
  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  delete: (id) => Promise.resolve({ data: {} }),
};

export const itemAPI = {
  getAll: (firmId) => Promise.resolve({ data: [] }),
  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  delete: (id) => Promise.resolve({ data: {} }),
  checkStock: (itemId, qty) => Promise.resolve({ data: { available: true } }),
};

export const challanAPI = {
  getAll: (firmId) => Promise.resolve({ data: [] }),
  getNextNumber: (firmId) => Promise.resolve({ data: { nextNumber: 'CH001' } }),
  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  delete: (id) => Promise.resolve({ data: {} }),
  convertToBill: (challanIds) => Promise.resolve({ data: {} }),
};

export const billAPI = {
  getAll: (firmId) => api.get(`/bills?firmId=${firmId}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
};

export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  getAll: (firmId) => api.get(`/payments?firmId=${firmId}`),
};

export const reportAPI = {
  gst: (firmId, params) => api.get(`/reports/gst?firmId=${firmId}`, { params }),
  sales: (firmId, params) => api.get(`/reports/sales?firmId=${firmId}`, { params }),
  purchase: (firmId, params) => api.get(`/reports/purchase?firmId=${firmId}`, { params }),
  stock: (firmId, params) => api.get(`/reports/stock?firmId=${firmId}`, { params }),
  ledger: (firmId, accountId, params) => api.get(`/reports/ledger/${accountId}?firmId=${firmId}`, { params }),
};

export default api;

export const groupAPI = {
  getAll: () => Promise.resolve({ data: [] }),
};

export const unitAPI = {
  getAll: () => Promise.resolve({ data: [] }),
};

export const hsnAPI = {
  getAll: () => Promise.resolve({ data: [] }),
};