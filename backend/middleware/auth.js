const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const authMiddleware = (req, res, next) => {
  // Allow public access to room leaderboard endpoints (read-only)
  // e.g. GET /api/v1/room/:code/leaderboard or /api/v1/room/leaderboard/global
  if (
    req.method === 'GET' &&
    typeof req.path === 'string' &&
    req.path.includes('leaderboard')
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = authMiddleware;
