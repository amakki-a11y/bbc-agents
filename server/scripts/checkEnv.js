require('dotenv').config();

console.log('Environment Check:');
console.log('------------------');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (' + process.env.OPENAI_API_KEY.substring(0, 15) + '...)' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
