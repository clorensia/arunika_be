import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit, { createIpKeyGenerator } from 'express-rate-limit';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== TRUST PROXY (PENTING!) ====================
// Ini untuk production di Railway, Vercel, Heroku, dll
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================

// Parse JSON request bodies
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use(helmet());

// ==================== RATE LIMITING ====================

// Create IP key generator untuk handle IPv6 & proxy
const keyGenerator = createIpKeyGenerator({
  skip: () => false // Process semua requests
});

// General rate limiter: 100 requests per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit untuk health check
    return req.path === '/health';
  },
  keyGenerator
});
app.use(limiter);

// Stricter rate limiter for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== ROUTES ====================

// Auth routes with stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// API routes
app.use('/api', apiRoutes);

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   ARUNIKA API SERVER STARTED         ║
╠══════════════════════════════════════╣
║ Port: ${PORT}                           
║ Environment: ${process.env.NODE_ENV || 'development'}
║ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
║ Supabase: ${process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}
║ Trust Proxy: ${app.get('trust proxy') ? '✓ Enabled' : '✗ Disabled'}
╚══════════════════════════════════════╝
  `);
});