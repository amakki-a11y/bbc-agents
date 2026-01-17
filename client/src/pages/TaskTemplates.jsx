import { useState, useEffect } from 'react';
import { getTemplates, createTemplate, deleteTemplate, instantiateTemplate } from '../api/templates';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Play } from 'lucide-react';

const TaskTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', description: '', priority: 'medium', time_estimate: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createTemplate({
                ...newTemplate,
                time_estimate: newTemplate.time_estimate ? parseInt(newTemplate.time_estimate) : null
            });
            setIsCreating(false);
            setNewTemplate({ name: '', description: '', priority: 'medium', time_estimate: '' });
            fetchTemplates();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleInstantiate = async (id) => {
        try {
            await instantiateTemplate(id, {});
            navigate('/'); // Go back to dashboard to see new task
        } catch (error) {
            alert('Failed to create task from template');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Task Templates</h1>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={20} /> New Template
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Create Template</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-gray-400 mb-1">Priority</label>
                                    <select
                                        value={newTemplate.priority}
                                        onChange={e => setNewTemplate({ ...newTemplate, priority: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-gray-400 mb-1">Est. Time (mins)</label>
                                    <input
                                        type="number"
                                        value={newTemplate.time_estimate}
                                        onChange={e => setNewTemplate({ ...newTemplate, time_estimate: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 rounded text-gray-300 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
                                >
                                    Save Template
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(template => (
                            <div key={template.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-semibold">{template.name}</h3>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <p className="text-gray-400 mb-4 h-12 overflow-hidden">{template.description || 'No description'}</p>
                                <div className="flex gap-2 mb-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${template.priority === 'urgent' ? 'bg-red-900 text-red-200' :
                                        template.priority === 'high' ? 'bg-orange-900 text-orange-200' :
                                            template.priority === 'medium' ? 'bg-blue-900 text-blue-200' :
                                                'bg-gray-700 text-gray-300'
                                        }`}>
                                        {template.priority.toUpperCase()}
                                    </span>
                                    {template.time_estimate && (
                                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                                            {template.time_estimate}m
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleInstantiate(template.id)}
                                    className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Play size={16} /> Create Task
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskTemplates;
