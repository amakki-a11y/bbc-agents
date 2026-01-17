import axios from "axios";
import axiosRetry from "axios-retry";

export const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function getAuthToken() {
    // Adjust the key if your app stores token under a different name
    return localStorage.getItem("token") || localStorage.getItem("authToken");
}

export const http = axios.create({
    baseURL: API_BASE,
});

// Configure retry strategies
axiosRetry(http, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // time interval between retries
    },
    retryCondition: (error) => {
        // Retry on network errors or 5xx status codes
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 500);
    },
});

http.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Global Error Interceptor
http.interceptors.response.use(
    (response) => response,
    (error) => {
        const expectedError =
            error.response &&
            error.response.status >= 400 &&
            error.response.status < 500;

        if (!expectedError) {
            // Log unexpected errors (network, 500s) locally or to service
            console.error("Unexpected error:", error);
            // Could trigger a global toast here if desired
        }

        return Promise.reject(error);
    }
);

