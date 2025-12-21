import jwt from "jsonwebtoken";

// JWT Secret - In production, use environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Authentication middleware to verify JWT tokens
 * Adds user object to req.user if token is valid
 */
export const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired. Please login again.",
      });
    }

    return res.status(403).json({
      success: false,
      error: "Invalid token.",
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user object to req.user if token is valid, but doesn't reject if missing
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid or expired, continue without user
      req.user = null;
    }
  }

  next();
};

/**
 * Middleware to check if authenticated user owns the resource
 */
export const authorizeOwner = (req, res, next) => {
  const resourceUserId = parseInt(req.params.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (req.user.userId !== resourceUserId) {
    return res.status(403).json({
      success: false,
      error: "Access denied. You can only modify your own resources.",
    });
  }

  next();
};

/**
 * Middleware to check if user has required role
 * Usage: requireRole('admin') or requireRole(['admin', 'super_admin'])
 * Note: super_admin users automatically pass all role checks
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const userRole = req.user.role || "user";
    const roles = allowedRoles.flat(); // Flatten in case array is passed

    // super_admin has access to everything
    if (userRole === "super_admin") {
      return next();
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, username, email, role = "user") => {
  return jwt.sign(
    {
      userId,
      username,
      email,
      role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export { JWT_SECRET, JWT_EXPIRES_IN };
