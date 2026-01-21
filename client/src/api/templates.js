import axios from 'axios';

// Using centralized API_URL from http.js

const getTemplates = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const createTemplate = async (templateData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/templates`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateTemplate = async (id, templateData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/templates/${id}`, templateData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const deleteTemplate = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const instantiateTemplate = async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/templates/${id}/instantiate`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate
};
