import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { setTokens, clearTokens } from '../api/http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            // Decode JWT to get user info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.userId, email: payload.email });
            } catch {
                setUser({ email: 'Logged In User' });
            }
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            const { accessToken, refreshToken, user: userData } = res.data;
            setTokens(accessToken, refreshToken);
            setToken(accessToken);
            setUser(userData);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const register = async (email, password, firstName, lastName) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/register`, { email, password, firstName, lastName });
            const { accessToken, refreshToken, user: userData } = res.data;
            setTokens(accessToken, refreshToken);
            setToken(accessToken);
            setUser(userData);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
        clearTokens();
        setToken(null);
    };

    const value = useMemo(() => ({
        user,
        token, // Add token here
        login,
        register,
        logout,
        isAuthenticated: !!token
    }), [user, token]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
