const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized — missing token' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myheath_jwt_secret');
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or deactivated user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied — required role: ${roles.join(' | ')}`,
    });
  }
  next();
};

module.exports = { protect, authorize };
