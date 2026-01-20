const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);

try {
  const user = { id: 1, email: 'admin@bbc.com' };

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  console.log('Access token generated successfully');
  console.log('Token:', accessToken.substring(0, 50) + '...');

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('Refresh token generated successfully');
} catch (error) {
  console.error('JWT Error:', error.message);
}
