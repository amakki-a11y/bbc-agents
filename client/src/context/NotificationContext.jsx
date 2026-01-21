import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Using centralized API from http.js

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize Socket
    useEffect(() => {
        if (user && token) {
            const newSocket = io(API_BASE_URL, {
                auth: { token }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                newSocket.emit('join', user.id);
            });

            newSocket.on('notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Optional: Show toast here
            });

            setSocket(newSocket);

            return () => newSocket.close();
        } else {
            if (socket) socket.close();
            setSocket(null);
        }
    }, [user, token]);

    // Initial Fetch (Mock for now, should call API)
    useEffect(() => {
        // TODO: specific API call to get unread notifications
        // check if user is logged in
    }, [user]);

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // TODO: Call API to mark as read
        // axios.put(`/api/notifications/${id}/read`)
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        // TODO: Call API
    };

    const value = {
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
