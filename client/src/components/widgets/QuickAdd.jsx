import React, { useState } from 'react';
import { Plus, X, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const QuickAdd = ({ onTaskAdded }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            // Default values for quick add
            const payload = {
                title: data.title,
                priority: data.priority || 'Medium',
                status: 'Todo',
                // Assuming we might need a project ID, defaulting or leaving optional if backend supports it.
                // If backend requires projectId, we might need a selector or default to a "General" project.
                // For now, sending without projectId hoping it's optional or handled.
            };

            // NOTE: Adjust endpoint if necessary based on API structure
            const response = await axios.post('http://localhost:3000/api/tasks', payload);

            if (onTaskAdded) {
                onTaskAdded(response.data);
            }

            reset();
            setIsExpanded(false);
        } catch (err) {
            console.error("Failed to add task", err);
            setError("Failed to create task. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-100 transition-all duration-300 ${isExpanded ? 'p-4' : 'p-3'}`}>
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Plus size={18} />
                    </div>
                    <span className="font-medium">Quick Add Task</span>
                </button>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-800">New Task</h3>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <input
                                {...register('title', { required: 'Task title is required' })}
                                type="text"
                                placeholder="What needs to be done?"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                            {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title.message}</span>}
                        </div>

                        <div className="flex gap-2">
                            <select
                                {...register('priority')}
                                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 w-1/2 bg-white"
                            >
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                                <option value="Critical">Critical</option>
                            </select>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader size={14} className="animate-spin" /> : <Plus size={16} />}
                                Add Task
                            </button>
                        </div>

                        {error && <div className="text-xs text-red-500 text-center">{error}</div>}
                    </div>
                </form>
            )}
        </div>
    );
};

export default QuickAdd;
