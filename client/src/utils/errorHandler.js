/**
 * Parses an error object to extract a user-friendly message.
 * @param {Error} error - The error object.
 * @returns {string} - The extracted error message.
 */
export const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred.';

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const data = error.response.data;
        if (data && data.message) {
            return data.message;
        }
        return `Server Error: ${error.response.statusText || error.response.status}`;
    } else if (error.request) {
        // The request was made but no response was received
        return 'Network Error. Please check your internet connection.';
    } else {
        // Something happened in setting up the request that triggered an Error
        return error.message;
    }
};

/**
 * Logs error to a monitoring service (placeholder).
 * @param {Error} error 
 * @param {object} info 
 */
export const logErrorToService = (error, info) => {
    // Placeholder for Sentry or other loggers
    console.error('Logged to service:', error, info);
};
