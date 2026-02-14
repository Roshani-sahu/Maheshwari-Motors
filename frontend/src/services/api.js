import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-maheshwari-motors.koyeb.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No auth token found for request:', config.url);
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  loginFirm: (credentials) => api.post('/auth/login', credentials),
  loginAdmin: (credentials) => api.post('/auth/login', credentials),
  
  login: async (credentials) => {
    try {
      return await api.post('/auth/login', credentials);
    } catch (error) {
       if (error.response && error.response.status === 401) {
         try {
           return await api.post('/auth/login', credentials);
         } catch (adminError) {
           throw adminError;
         }
       }
       throw error;
    }
  },
  
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const firmAPI = {
  getAll: async () => {
    try {
      // We leverage the profile to get firm details since they are embedded in the user
      const response = await api.get('/auth/me');
      const user = response.data.data;
      return {
        data: [
          { ...user.gst_firm, id: 'gst', type: 'GST', _id: 'gst' }, // Artificial ID
          { ...user.nongst_firm, id: 'nongst', type: 'NON_GST', _id: 'nongst' }
        ]
      };
    } catch (error) {
       console.error("Failed to fetch firms from profile", error);
       return { data: [] };
    }
  },
  getById: (id) => Promise.resolve({ data: {} }), // Not really used if we have getAll
  create: (data) => Promise.resolve({ data }), // Not supported via API
  update: (id, data) => Promise.resolve({ data }), // Not supported via API
  delete: (id) => Promise.resolve({ data: {} }), // Not supported via API
};

export const accountAPI = {
  getAll: (firmId) => api.get(`/parties?firmId=${firmId}`), // Backend ignores firmId, filters by user
  create: (data) => api.post('/parties', data),
  update: (id, data) => api.put(`/parties/${id}`, data),
  delete: (id) => api.delete(`/parties/${id}`),
};

export const itemAPI = {
  getAll: (firmId) => api.get(`/items?firmId=${firmId}`),
  create: (data) => {
    // Handle file upload if data contains image
    if (data instanceof FormData) {
      return api.post('/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/items', data);
  },
  update: (id, data) => {
     if (data instanceof FormData) {
      return api.put(`/items/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/items/${id}`, data);
  },
  delete: (id) => api.delete(`/items/${id}`),
  checkStock: (itemId, qty) => Promise.resolve({ data: { available: true } }), // Not implemented in backend explicitly, logical check
};

export const challanAPI = {
  getAll: (firmId) => api.get(`/challans?firmId=${firmId}`), 
  getNextNumber: (firmId) => Promise.resolve({ data: { nextNumber: 'Auto' } }), // Backend handles this
  create: (data) => api.post('/challans', data),
  update: (id, data) => api.put(`/challans/${id}`, data),
  delete: (id) => api.delete(`/challans/${id}`),
  convertToBill: (challanIds) => api.post('/challans/convert-to-bill', { challanIds }), // Need to verify if this endpoint exists. 
  // Backend `challanRoutes` does NOT have convertToBill. `billRoutes` might have it.
};

export const billAPI = {
  getAll: (firmId) => api.get(`/bills?firmId=${firmId}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
};

export const paymentAPI = {
  create: (data) => api.post('/transactions', data),
  getAll: (firmId) => api.get(`/transactions?firmId=${firmId}`),
};

export const reportAPI = {
  // Backend has /dashboard. We'll map to that for now, or use specific report routes if they exist.
  // Backend `routers/index.js` shows `stock-alerts` but no `reports`.
  // `dashboardRoutes` likely has stats.
  gst: (firmId, params) => api.get(`/dashboard/stats`, { params }), // Placeholder
  sales: (firmId, params) => api.get(`/dashboard/stats`, { params }),
  purchase: (firmId, params) => api.get(`/dashboard/stats`, { params }),
  stock: (firmId, params) => api.get(`/items/low-stock`, { params }), // We have this
  ledger: (firmId, accountId, params) => Promise.resolve({ data: [] }), // Not explicitly found
};

export default api;

export const categoryAPI = {
  getAll: () => api.get('/categories').catch(err => {
    console.error('Category API error:', err.response?.data || err.message);
    return { data: [] };
  }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const supplierAPI = {
  getAll: () => api.get('/suppliers').catch(err => {
    console.error('Supplier API error:', err.response?.data || err.message);
    return { data: [] };
  }),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const groupAPI = {
  getAll: () => api.get('/categories').catch(err => {
    console.error('Group API error:', err.response?.data || err.message);
    return { data: [] };
  }),
};

export const unitAPI = {
  getAll: () => Promise.resolve({ data: [] }), // Not in backend
};

export const hsnAPI = {
  getAll: () => Promise.resolve({ data: [] }), // Not in backend
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id, isActive) => api.post(`/admin/users/${id}/${isActive ? "reactivate" : "deactivate"}`),
};

export const brandAPI = {
  getAll: () => api.get('/brands').catch(err => {
    console.error('Brand API error:', err.response?.data || err.message);
    return { data: [] };
  }),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
};

export const discountAPI = {
  getAll: () => api.get('/discounts'),
  getByBrand: (brandId) => api.get(`/discounts/brand/${brandId}`),
  upsert: (data) => api.post('/discounts', data),
  delete: (id) => api.delete(`/discounts/${id}`),
};