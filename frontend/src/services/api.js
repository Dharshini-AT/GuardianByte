import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout')
};

// Policy API
export const policyAPI = {
  createPolicy: (policyData) => api.post('/policies', policyData),
  getUserPolicies: (params) => api.get('/policies', { params }),
  getPolicyById: (id) => api.get(`/policies/${id}`),
  updatePolicy: (id, policyData) => api.put(`/policies/${id}`, policyData),
  cancelPolicy: (id, reason) => api.post(`/policies/${id}/cancel`, { reason }),
  renewPolicy: (id) => api.post(`/policies/${id}/renew`),
  getAllPolicies: (params) => api.get('/policies/admin/all', { params }),
  getPolicyStats: (params) => api.get('/policies/admin/stats', { params })
};

// Claim API
export const claimAPI = {
  getUserClaims: (params) => api.get('/claims', { params }),
  getClaimById: (id) => api.get(`/claims/${id}`),
  getAllClaims: (params) => api.get('/claims/admin/all', { params }),
  reviewClaim: (id, reviewData) => api.post(`/claims/admin/${id}/review`, reviewData),
  getClaimStats: (params) => api.get('/claims/admin/stats', { params })
};

// Payment API
export const paymentAPI = {
  createOrder: (orderData) => api.post('/payments/create-order', orderData),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  getPaymentStats: (params) => api.get('/payments/stats', { params }),
  processRefund: (refundData) => api.post('/payments/refund', refundData)
};

// Dashboard API
export const dashboardAPI = {
  getUserDashboard: () => api.get('/dashboard/user'),
  getAdminDashboard: (params) => api.get('/dashboard/admin', { params }),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params }),
  getFraudAlerts: (params) => api.get('/dashboard/fraud-alerts', { params }),
  
  // Trigger management
  checkTriggers: () => api.post('/dashboard/triggers/check'),
  createDemoTriggers: () => api.post('/dashboard/triggers/demo'),
  createCurfewTrigger: (triggerData) => api.post('/dashboard/triggers/curfew', triggerData),
  createOutageTrigger: (triggerData) => api.post('/dashboard/triggers/outage', triggerData),
  getActiveTriggers: () => api.get('/dashboard/triggers/active'),
  getMonitoringStatus: () => api.get('/dashboard/monitoring/status')
};

// Health check
export const healthAPI = {
  checkBackend: () => api.get('/health'),
  checkMLService: () => axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:5000'}/api/health`)
};

export default api;
