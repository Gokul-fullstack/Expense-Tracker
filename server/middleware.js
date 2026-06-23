import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'FINSPIRE_JWT_SECRET_KEY_12345';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token expired or invalid. Please sign in again.' });
    }
    
    // Attach user payload (id, email, name) to request
    req.user = user;
    next();
  });
}

export default authenticateToken;
