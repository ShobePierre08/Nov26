const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set!");
    return res.status(500).send({ message: 'Server misconfiguration' });
  }

  let token = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // ONLY for development testing
  if (!token && process.env.NODE_ENV !== 'production') {
    token = req.headers['x-access-token'] || req.query.token || req.body.token;
  }

  if (!token) return res.status(403).send({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Invalid or expired token' });

    // attach user info
    req.user = {
      id: decoded.id,
      roleId: decoded.role_id,
    };
    req.userId = decoded.id;
    req.userRoleId = decoded.role_id;

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
