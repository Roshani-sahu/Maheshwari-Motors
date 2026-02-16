import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-maheshwari-motors.koyeb.app/api/v1';

console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

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
  } else if (!config.url.includes('/auth/login')) {
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
    console.log('🚀 Login attempt:', {
      credentials: { username: credentials.username, password: '***' },
      API_BASE_URL,
      fullURL: `${API_BASE_URL}/auth/login`
    });
    
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login success:', {
        status: response.status,
        hasData: !!response.data,
        hasToken: !!response.data?.data?.token
      });
      return response;
    } catch (error) {
      console.error('❌ Login failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      if (error.response && error.response.status === 401) {
        try {
          console.log('🔄 Retrying login...');
          const retryResponse = await api.post('/auth/login', credentials);
          console.log('✅ Retry success:', retryResponse.status);
          return retryResponse;
        } catch (adminError) {
          console.error('❌ Retry failed:', adminError.response?.data);
          throw adminError;
        }
      }
      throw error;
    }
  },
  
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  // updateProfile: Not supported by backend
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
  // delete: (id) => Promise.resolve({ data: {} }), // Not supported via API
};

export const accountAPI = {
  getAll: (firmId) => api.get(`/parties?firmId=${firmId}`),
  create: (data) => api.post('/parties', data),
  update: (id, data) => api.put(`/parties/${id}`, data),
  // delete: (id) => api.// delete(`/parties/${id}`),
  getDue: (days) => api.get(`/parties/due?days=${days || 30}`),
  getOverpaid: () => api.get('/parties/overpaid'),
  getBalance: (id) => api.get(`/parties/${id}/balance`),
};

export const itemAPI = {
  getAll: (options) => {
    if (typeof options === 'object') {
       return api.get('/items', { params: options });
    }
    return api.get(`/items?firmId=${options}`);
  },
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => {
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
  // delete: (id) => api.// delete(`/items/${id}`),
  getLowStock: () => api.get('/items/low-stock'),
  updateStock: (id, quantity) => api.patch(`/items/${id}/stock`, { quantity }),
  checkStock: (itemId, qty) => Promise.resolve({ data: { available: true } }), 
};

export const challanAPI = {
  getAll: (firmId) => api.get(`/challans?firmId=${firmId}`), 
  getNextNumber: (firmId) => Promise.resolve({ data: { nextNumber: 'Auto' } }), 
  create: (data) => api.post('/challans', data),
  update: (id, data) => api.put(`/challans/${id}`, data),
  // delete: (id) => api.// delete(`/challans/${id}`),
  getUnconverted: (partyId) => api.get(`/challans/party/${partyId}/unconverted`),
};

export const billAPI = {
  getAll: (firmId) => api.get(`/bills?firmId=${firmId}`),
  create: (data) => api.post('/bills', data), // Accepts { party_id, challan_ids, ... }
  // Update not supported
  // delete: (id) => api.// delete(`/bills/${id}`),
  recordPayment: (id, amount) => api.post(`/bills/${id}/payment`, { amount }),
  handleReturn: (id, returnAmount) => api.post(`/bills/${id}/return`, { return_amount: returnAmount }),
};

export const transactionAPI = {
  getAll: (firmId) => api.get(`/transactions?firmId=${firmId}`),
  createSale: (data) => api.post('/transactions/sale', data),
  createPurchase: (data) => api.post('/transactions/purchase', data),
  getSummary: () => api.get('/transactions/summary'),
};

export const paymentAPI = {
  // Alias to ensure backward compatibility if needed, but preferably use transactionAPI
  create: (data) => api.post('/transactions/sale', data), // Assumes sale transaction
  getAll: (firmId) => api.get(`/transactions?firmId=${firmId}`),
};

export const purchaseAPI = {
  getAll: () => api.get('/purchases'),
  create: (data) => api.post('/purchases', data),
  // delete: (id) => api.// delete(`/purchases/${id}`),
  recordPayment: (id, amount) => api.post(`/purchases/${id}/payment`, { amount }),
};

export const reportAPI = {
  getFirmStats: (firmId, period) => api.get(`/dashboard/firm`, { params: { firmId, period } }),
  getDashboard: () => api.get('/dashboard'),
  gst: (firmId, params) => api.get(`/dashboard/firm`, { params }), 
  sales: (firmId, params) => api.get(`/dashboard/firm`, { params }),
  purchase: (firmId, params) => api.get(`/dashboard/firm`, { params }),
  stock: (firmId, params) => api.get(`/items/low-stock`, { params }), 
  getStockAlertItems: () => api.get('/stock-alerts/items'),
  getAlertCount: () => api.get('/stock-alerts/count'),
  getAlerts: () => api.get('/stock-alerts'),
  resolveAlert: (id) => api.patch(`/stock-alerts/${id}/resolve`),
};

export default api;

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }).catch(err => {
    console.error('Category API error:', err.response?.data || err.message);
    return { data: [] };
  }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }).catch(err => {
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
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id, isActive) => api.post(`/admin/users/${id}/${isActive ? "reactivate" : "deactivate"}`),
};

export const brandAPI = {
  getAll: (params) => api.get('/brands', { params }).catch(err => {
    console.error('Brand API error:', err.response?.data || err.message);
    return { data: [] };
  }),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
};

export const discountAPI = {
  getAll: (params) => api.get('/discounts', { params }),
  getByBrand: (brandId) => api.get(`/discounts/brand/${brandId}`),
  upsert: (data) => api.post('/discounts', data),
  delete: (id) => api.delete(`/discounts/${id}`),
};