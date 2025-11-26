const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // DEBUG: log incoming Authorization header to help debug 401s during development
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const xAccessToken = req.headers['x-access-token'];
  const tokenFromQuery = req.query && req.query.token;
  const tokenFromBody = req.body && req.body.token;

  if (process.env.NODE_ENV !== 'production') {
    console.log('verifyToken - Authorization header:', authHeader);
    console.log('verifyToken - x-access-token header:', xAccessToken);
    console.log('verifyToken - token in query:', tokenFromQuery);
    console.log('verifyToken - token in body:', !!tokenFromBody);
  }

  // Prefer Authorization Bearer token, fallback to x-access-token, query, or body
  let token = null;
  if (typeof authHeader === 'string' && authHeader.split(' ').length > 1) {
    token = authHeader.split(' ')[1];
  } else if (typeof xAccessToken === 'string') {
    token = xAccessToken;
  } else if (tokenFromQuery) {
    token = tokenFromQuery;
  } else if (tokenFromBody) {
    token = tokenFromBody;
  }

  if (!token) return res.status(403).send({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      console.log('verifyToken - jwt.verify error:', err && err.message);
      return res.status(401).send({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.id;
    req.userRoleId = decoded.role_id;
    // Ensure backward compatibility for handlers expecting req.user.id
    req.user = {
      id: decoded.id,
      roleId: decoded.role_id,
    };
    next();
  });
};

exports.authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRoleId)) {
      return res.status(403).send({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};
