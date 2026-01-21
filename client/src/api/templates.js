import http from './http';

const getTemplates = async () => {
    const response = await http.get('/templates');
    return response.data;
};

const createTemplate = async (templateData) => {
    const response = await http.post('/templates', templateData);
    return response.data;
};

const updateTemplate = async (id, templateData) => {
    const response = await http.put(`/templates/${id}`, templateData);
    return response.data;
};

const deleteTemplate = async (id) => {
    await http.delete(`/templates/${id}`);
};

const instantiateTemplate = async (id, data) => {
    const response = await http.post(`/templates/${id}/instantiate`, data);
    return response.data;
};

export {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate
};
