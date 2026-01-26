import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authHttp, setTokens, clearTokens } from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Decode JWT to get user info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.userId, email: payload.email });
            } catch {
                setUser({ email: 'Logged In User' });
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await authHttp.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user: userData } = res.data;
            setTokens(accessToken, refreshToken);
            setToken(accessToken);
            setUser(userData);
            return true;
        } catch (e) {
            console.error('Login error:', e.response?.data || e.message);
            return false;
        }
    };

    const register = async (email, password, firstName, lastName) => {
        try {
            const res = await authHttp.post('/auth/register', { email, password, firstName, lastName });
            const { accessToken, refreshToken, user: userData } = res.data;
            setTokens(accessToken, refreshToken);
            setToken(accessToken);
            setUser(userData);
            return true;
        } catch (e) {
            console.error('Register error:', e.response?.data || e.message);
            return false;
        }
    };

    const logout = () => {
        clearTokens();
        setToken(null);
    };

    const value = useMemo(() => ({
        user,
        token,
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
