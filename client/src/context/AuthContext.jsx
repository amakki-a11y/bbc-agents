import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
            // Ideally verify token here or decode it
            setUser({ email: 'Logged In User' }); // Placeholder until we have a /me endpoint or decode
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            const res = await axios.post('http://localhost:3000/auth/login', { email, password });
            setToken(res.data.accessToken);
            setUser(res.data.user);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const register = async (email, password, firstName, lastName) => {
        try {
            const res = await axios.post('http://localhost:3000/auth/register', { email, password, firstName, lastName });
            setToken(res.data.accessToken);
            setUser(res.data.user);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
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
