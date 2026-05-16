import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'|| 'https://expense-tracker-server-bay.vercel.app/';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Don't retry login/register requests
        if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
            return Promise.reject(error);
        }

        // If not 401 or already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If no token at all, just reject (App.jsx handles redirect)
        if (!localStorage.getItem('access_token')) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            const { access_token } = response.data;

            localStorage.setItem('access_token', access_token);
            api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            processQueue(null, access_token);
            return api(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            
            // Clear auth data
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');

            // Only redirect if not already on login page
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

// ==================== AUTH ENDPOINTS ====================
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const logout = () => api.post('/auth/logout');
export const refreshToken = () => api.post('/auth/refresh');
export const getCurrentUser = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/me', data);
export const changePassword = (data) => api.put('/auth/password', data);
export const updateCurrency = (currency) => api.put('/auth/currency', { currency });
export const getAvailableCurrencies = () => api.get('/auth/currencies');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password });
export const deleteAccount = () => api.delete('/auth/me');

// ==================== TRANSACTION ENDPOINTS ====================
export const getTransactions = (params) => api.get('/transactions', { params });
export const getTransaction = (id) => api.get(`/transactions/${id}`);
export const addTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getTransactionStats = () => api.get('/transactions/stats');

// ==================== DASHBOARD ENDPOINTS ====================
export const getDashboardData = () => api.get('/dashboard');
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getMonthlyStats = (months = 6) => api.get('/dashboard/monthly', { params: { months } });

// ==================== BUDGET ENDPOINTS ====================
export const getBudgets = () => api.get('/budgets');
export const getBudget = (id) => api.get(`/budgets/${id}`);
export const createBudget = (data) => api.post('/budgets', data);
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
export const getBudgetStatus = () => api.get('/budgets/status');
export const getBudgetRecommendations = () => api.get('/budgets/recommendations');

// ==================== CATEGORY ENDPOINTS ====================
export const getCategories = (period = 'month') => api.get('/categories', { params: { period } });
export const getCategoryStats = (name, months = 6) => api.get(`/categories/${name}`, { params: { months } });

// ==================== PREDICTION ENDPOINTS ====================
export const getMonthlyPrediction = () => api.get('/predictions/monthly');
export const getCategoryPredictions = () => api.get('/predictions/categories');
export const getRecommendations = () => api.get('/predictions/recommendations');
export const getSavingsPotential = () => api.get('/predictions/savings');
export const getSeasonalAnalysis = () => api.get('/predictions/seasonal');

// ==================== ANOMALY ENDPOINTS ====================
export const getAnomalies = (params) => api.get('/anomalies', { params });
export const getAnomalySummary = () => api.get('/anomalies/summary');
export const getDailySpikes = (days = 30) => api.get('/anomalies/spikes', { params: { days } });
export const getCategoryAnomalies = (category) => api.get(`/anomalies/categories/${category}`);

// ==================== HEALTH CHECK ====================
export const healthCheck = () => api.get('/health');

export default api;