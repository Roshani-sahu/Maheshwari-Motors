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
  getAll: (firmId) => Promise.resolve({ 
    data: [
      { id: 1, name: "CASH", type: "CASH", balance: 50000 },
      { id: 2, name: "HDFC BANK", type: "BANK", balance: 125000 },
      { id: 3, name: "MARUTI PARTS SUPPLIER", type: "SUPPLIER", balance: -25000 },
      { id: 4, name: "TATA MOTORS DEALER", type: "CUSTOMER", balance: 15000 },
      { id: 5, name: "HERO HONDA PARTS", type: "SUPPLIER", balance: -8500 }
    ]
  }),
  create: (data) => Promise.resolve({ data }),
  update: (id, data) => Promise.resolve({ data }),
  delete: (id) => Promise.resolve({ data: {} }),
};

export const itemAPI = {
  getAll: (firmId) => Promise.resolve({ 
    data: [
      {
        id: 1,
        name: "BRAKE MASTER CYLINDER BOSCH",
        gstCode: "14564",
        nonGstCode: "14564",
        unit: "PCS",
        gstFlag: "GST",
        saleRate: 850.00,
        purchaseRate: 750.00,
        mrp: 950.00,
        stock: 25,
        barcode: "BC14564"
      },
      {
        id: 2,
        name: "CLUTCH RING TYPE PURD",
        gstCode: "1",
        nonGstCode: "1",
        unit: "PCS",
        gstFlag: "GST",
        saleRate: 320.00,
        purchaseRate: 280.00,
        mrp: 380.00,
        stock: 15,
        barcode: "BC001"
      },
      {
        id: 3,
        name: "1 LTR CLOTH & STAR FULL KIT HATHI",
        gstCode: "2",
        nonGstCode: "2",
        unit: "SET",
        gstFlag: "GST",
        saleRate: 450.00,
        purchaseRate: 400.00,
        mrp: 520.00,
        stock: 8,
        barcode: "BC002"
      },
      {
        id: 4,
        name: "1 LTR 10W40 BISCOL",
        gstCode: "11574",
        nonGstCode: "11574",
        unit: "LTR",
        gstFlag: "GST",
        saleRate: 180.00,
        purchaseRate: 160.00,
        mrp: 220.00,
        stock: 50,
        barcode: "BC11574"
      },
      {
        id: 5,
        name: "1 LTR 10W40 HP PURD",
        gstCode: "14920",
        nonGstCode: "14920",
        unit: "LTR",
        gstFlag: "GST",
        saleRate: 195.00,
        purchaseRate: 175.00,
        mrp: 240.00,
        stock: 30,
        barcode: "BC14920"
      }
    ]
  }),
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