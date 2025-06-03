const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    throw new Error('Token không hợp lệ');
  }
};

// Generate Token for User
const generateTokenForUser = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };
  
  return generateToken(payload);
};

// Extract token from request header
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

module.exports = {
  generateToken,
  verifyToken,
  generateTokenForUser,
  extractTokenFromHeader
}; 