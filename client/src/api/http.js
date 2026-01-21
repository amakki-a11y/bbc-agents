import axios from "axios";
import axiosRetry from "axios-retry";

// Single source of truth for API URLs
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = `${API_BASE}/api/v1`;

export function getAuthToken() {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
}

export function getRefreshToken() {
    return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken, refreshToken) {
    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
}

// HTTP client for API routes (/api/*)
export const http = axios.create({
    baseURL: API_URL,
});

// HTTP client for auth routes (/auth/*)
export const authHttp = axios.create({
    baseURL: API_BASE,
});

// Configure retry strategies for both clients
const configureRetry = (client) => {
    axiosRetry(client, {
        retries: 3,
        retryDelay: (retryCount) => retryCount * 1000,
        retryCondition: (error) => {
            return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                   (error.response && error.response.status >= 500);
        },
    });
};

configureRetry(http);
configureRetry(authHttp);

// Add auth token to requests
const addAuthInterceptor = (client) => {
    client.interceptors.request.use((config) => {
        const token = getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
};

addAuthInterceptor(http);
addAuthInterceptor(authHttp);

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];
let isRedirecting = false; // Prevent multiple redirects

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

// Safe redirect to login - prevents infinite loops
const redirectToLogin = () => {
    // Only redirect once and only if not already on login page
    if (isRedirecting) return;
    if (window.location.pathname === '/login') return;

    isRedirecting = true;
    clearTokens();

    // Use replace to avoid back button issues
    window.location.replace('/login');
};

// Response interceptor with automatic token refresh
const addResponseInterceptor = (client) => {
    client.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Skip auth handling for auth endpoints to prevent loops
            if (originalRequest?.url?.includes('/auth/')) {
                return Promise.reject(error);
            }

            // Handle 403 with TOKEN_EXPIRED - try to refresh
            if (error.response?.status === 403 &&
                error.response?.data?.code === 'TOKEN_EXPIRED' &&
                !originalRequest._retry) {

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return client(originalRequest);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    redirectToLogin();
                    return Promise.reject(error);
                }

                try {
                    const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    setTokens(accessToken, newRefreshToken);
                    processQueue(null, accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    redirectToLogin();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            // Handle 401 - redirect to login (but only once)
            if (error.response?.status === 401) {
                redirectToLogin();
            }

            return Promise.reject(error);
        }
    );
};

addResponseInterceptor(http);
addResponseInterceptor(authHttp);

export default http;
