import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-maheshwari-motors.koyeb.app/api/v1';
const BASE_URL = API_BASE_URL.replace('/api/v1', '');

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

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
      // Only redirect if not already on login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  // Helper to store token/user
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const firmAPI = {
  getAll: () => api.get('/firms'),
  getById: (id) => api.get(`/firms/${id}`),
  create: (data) => api.post('/firms', data),
  update: (id, data) => api.put(`/firms/${id}`, data),
  delete: (id) => api.delete(`/firms/${id}`),
  getDashboard: (id) => api.get(`/firms/${id}/dashboard`),
};

// Maps to Parties (Customers/Suppliers)
export const accountAPI = {
  getAll: (firmId) => api.get(`/firms/${firmId}/parties`),
  getById: (firmId, id) => api.get(`/firms/${firmId}/parties/${id}`),
  create: (firmId, data) => api.post(`/firms/${firmId}/parties`, data),
  update: (firmId, id, data) => api.put(`/firms/${firmId}/parties/${id}`, data),
  delete: (firmId, id) => api.delete(`/firms/${firmId}/parties/${id}`),
  getDue: (firmId) => api.get(`/firms/${firmId}/parties/due`),
  getOverpaid: (firmId) => api.get(`/firms/${firmId}/parties/overpaid`),
};

export const itemAPI = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/items', data, config);
  },
  update: (id, data, config) => {
    const finalConfig = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : config;
    return api.put(`/items/${id}`, data, finalConfig);
  },
  delete: (id) => api.delete(`/items/${id}`),
  checkStock: (itemId, qty) => Promise.resolve({ data: { available: true } }), 
};

export const challanAPI = {
  getAll: (firmId) => api.get(`/firms/${firmId}/challans`),
  getById: (firmId, id) => api.get(`/firms/${firmId}/challans/${id}`),
  create: (firmId, data) => api.post(`/firms/${firmId}/challans`, data),
  update: (firmId, id, data) => api.put(`/firms/${firmId}/challans/${id}`, data),
  delete: (firmId, id) => api.delete(`/firms/${firmId}/challans/${id}`),
  // Conversion likely happens via bill creation referencing challans
  convertToBill: (firmId, data) => api.post(`/firms/${firmId}/bills`, data), 
};

export const billAPI = {
  getAll: (firmId) => api.get(`/firms/${firmId}/bills`),
  getById: (firmId, id) => api.get(`/firms/${firmId}/bills/${id}`),
  create: (firmId, data) => api.post(`/firms/${firmId}/bills`, data),
  update: (firmId, id, data) => Promise.reject(new Error("Update bill not fully supported, try delete and create")), // API might not support PUT on bills directly
  delete: (firmId, id) => api.delete(`/firms/${firmId}/bills/${id}`),
  byStatus: (firmId, status) => api.get(`/firms/${firmId}/bills/status/${status}`),
};


export const transactionAPI = {
  // Transactions (Payments)
  getAll: (firmId) => api.get(`/firms/${firmId}/transactions`),
  create: (firmId, data) => api.post(`/firms/${firmId}/transactions/sale`, data), // Default to sale transaction
  createPurchase: (firmId, data) => api.post(`/firms/${firmId}/transactions/purchase`, data),
  summary: (firmId) => api.get(`/firms/${firmId}/transactions/summary`),
  delete: (id) => Promise.reject(new Error("Delete transaction not supported directly")), // Placeholder as no route exists yet
};

export const discountAPI = {
  getAll: () => api.get('/discounts'),
  getById: (id) => api.get(`/discounts/${id}`),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  delete: (id) => api.delete(`/discounts/${id}`),
};

export const reportAPI = {
 // Mapping reports to existing list endpoints with filters
  gst: (firmId, params) => api.get(`/firms/${firmId}/bills`, { params: { ...params, gst: true } }),
  sales: (firmId, params) => api.get(`/firms/${firmId}/bills`, { params }),
  purchase: (firmId, params) => api.get(`/firms/${firmId}/purchases`, { params }),
  stock: (firmId, params) => api.get('/items', { params }), // Stock is global
  ledger: (firmId, partyId) => api.get(`/firms/${firmId}/parties/${partyId}/balance`), // Ledger usually means party balance/history
};

export default api;

// Categories
export const groupAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Mocks for missing endpoints
export const unitAPI = {
  getAll: () => Promise.resolve({ data: { data: [{id: 1, name: 'PCS'}, {id: 2, name: 'KG'}, {id: 3, name: 'LTR'}, {id: 4, name: 'MTR'}, {id: 5, name: 'SET'}] } }),
};

export const hsnAPI = {
  getAll: () => Promise.resolve({ data: { data: [] } }),
};

export const supplierAPI = {
  getAll: () => api.get('/suppliers', { params: { page: 1, limit: 100 } }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const userAPI = {
    getAll: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    delete: (id) => api.delete(`/users/${id}`),
};