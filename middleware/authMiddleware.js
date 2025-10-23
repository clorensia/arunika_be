import { supabase } from '../config/supabaseClient.js';

/**
 * Middleware to verify JWT token from Supabase Auth
 * Usage: router.get('/protected-route', requireAuth, handler)
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: err.message
    });
  }
};

/**
 * Optional auth - doesn't block request if no token
 * Just attaches user if token is valid
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (err) {
    // Don't block request on error
    next();
  }
};