import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import http from '../api/http';

const ClientsContext = createContext();

export const useClients = () => {
    const context = useContext(ClientsContext);
    if (!context) {
        throw new Error('useClients must be used within ClientsProvider');
    }
    return context;
};

export const ClientsProvider = ({ children }) => {
    const { token } = useAuth();

    const [clients, setClients] = useState([]);
    const [currentClient, setCurrentClient] = useState(null);
    const [stats, setStats] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });

    // Filters state
    const [filters, setFilters] = useState({
        status: 'all',
        stage: 'all',
        search: '',
        ownerId: null
    });

    const fetchClients = useCallback(async (params = {}) => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                page: params.page || pagination.page,
                limit: params.limit || pagination.limit,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.stage !== 'all' && { stage: filters.stage }),
                ...(filters.search && { search: filters.search }),
                ...(filters.ownerId && { ownerId: filters.ownerId })
            });

            const response = await http.get(`/clients?${queryParams}`);
            setClients(response.data.clients);
            setPagination(response.data.pagination);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    }, [token, filters, pagination.page, pagination.limit]);

    const fetchClient = useCallback(async (id) => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await http.get(`/clients/${id}`);
            setCurrentClient(response.data);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchStats = useCallback(async () => {
        if (!token) return;

        try {
            const response = await http.get('/clients/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, [token]);

    const fetchTags = useCallback(async () => {
        if (!token) return;

        try {
            const response = await http.get('/clients/tags');
            setTags(response.data);
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    }, [token]);

    const createClient = async (clientData) => {
        const response = await http.post('/clients', clientData);
        setClients(prev => [response.data, ...prev]);
        return response.data;
    };

    const updateClient = async (id, updates) => {
        const response = await http.put(`/clients/${id}`, updates);
        setClients(prev => prev.map(c => c.id === id ? response.data : c));
        if (currentClient?.id === id) {
            setCurrentClient(response.data);
        }
        return response.data;
    };

    const deleteClient = async (id) => {
        await http.delete(`/clients/${id}`);
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const moveClient = async (id, status, stage) => {
        const response = await http.post(`/clients/${id}/move`, { status, stage });
        setClients(prev => prev.map(c => c.id === id ? response.data : c));
        return response.data;
    };

    const addInteraction = async (clientId, interactionData) => {
        const response = await http.post(`/clients/${clientId}/interactions`, interactionData);
        return response.data;
    };

    const addNote = async (clientId, noteData) => {
        const response = await http.post(`/clients/${clientId}/notes`, noteData);
        return response.data;
    };

    const deleteNote = async (clientId, noteId) => {
        await http.delete(`/clients/${clientId}/notes/${noteId}`);
    };

    const addTask = async (clientId, taskData) => {
        const response = await http.post(`/clients/${clientId}/tasks`, taskData);
        return response.data;
    };

    const updateTask = async (clientId, taskId, updates) => {
        const response = await http.put(`/clients/${clientId}/tasks/${taskId}`, updates);
        return response.data;
    };

    const addTagToClient = async (clientId, tagName) => {
        const response = await http.post(`/clients/${clientId}/tags`, { tagName });
        return response.data;
    };

    const removeTagFromClient = async (clientId, tagId) => {
        await http.delete(`/clients/${clientId}/tags/${tagId}`);
    };

    const importClients = async (clients) => {
        const response = await http.post('/clients/import', { clients });
        return response.data;
    };

    const value = {
        clients,
        currentClient,
        stats,
        tags,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        fetchClients,
        fetchClient,
        fetchStats,
        fetchTags,
        createClient,
        updateClient,
        deleteClient,
        moveClient,
        addInteraction,
        addNote,
        deleteNote,
        addTask,
        updateTask,
        addTagToClient,
        removeTagFromClient,
        importClients,
        setCurrentClient
    };

    return (
        <ClientsContext.Provider value={value}>
            {children}
        </ClientsContext.Provider>
    );
};

export default ClientsContext;
