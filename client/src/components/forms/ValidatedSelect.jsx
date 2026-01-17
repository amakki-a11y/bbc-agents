import React from 'react';

const ValidatedSelect = React.forwardRef(({
    label,
    error,
    options = [],
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 
          ${error
                        ? 'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                    } 
          ${className}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error.message}
                </p>
            )}
        </div>
    );
});

ValidatedSelect.displayName = 'ValidatedSelect';

export default ValidatedSelect;
