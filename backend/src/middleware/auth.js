const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_token');
    
    req.user = decoded; // Attach decoded user info (id, username) to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authorization token' });
  }
};
