const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize a string by removing all HTML tags.
 * Used for strict text fields like names, titles, etc.
 * @param {string} input 
 * @returns {string}
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},
    });
};

/**
 * Sanitize a string allowing basic rich text formatting.
 * Used for descriptions, comments, etc.
 * @param {string} input 
 * @returns {string}
 */
const sanitizeRichText = (input) => {
    if (typeof input !== 'string') return input;
    return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'ol', 'br'],
        allowedAttributes: {
            'a': ['href']
        },
    });
};

module.exports = { sanitizeInput, sanitizeRichText };
