import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper function for consistent response
const sendResponse = (res, statusCode, success, data = null, error = null, message = null) => {
  res.status(statusCode).json({
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  });
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, pendidikan, pekerjaan } = req.body;

    // Validation
    if (!email || !password || !name) {
      return sendResponse(res, 400, false, null, 'Email, password, and name are required');
    }

    if (password.length < 6) {
      return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }

    // 1. Create user in Supabase Auth FIRST
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          pendidikan,
          pekerjaan
        }
      }
    });

    if (authError) {
      return sendResponse(res, 400, false, null, authError.message);
    }

    if (!authData.user) {
      return sendResponse(res, 400, false, null, 'Registration failed - no user created');
    }

    const userId = authData.user.id;

    // 2. Check if user profile already exists (race condition check)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Profile sudah ada, just return it
      const { data: fullProfile } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      return sendResponse(res, 201, true, {
        user: authData.user,
        profile: fullProfile,
        session: authData.session,
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token
      }, null, 'User registered successfully');
    }

    // 3. Create user profile in users table - ONLY if doesn't exist
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([{
        user_id: userId,
        name,
        email,
        role: 'user',
        pendidikan: pendidikan || null,
        pekerjaan: pekerjaan || null
      }])
      .select();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Kalau error, coba get yang sudah ada
      if (profileError.message.includes('duplicate')) {
        const { data: fallbackProfile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single();

        return sendResponse(res, 201, true, {
          user: authData.user,
          profile: fallbackProfile,
          session: authData.session,
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token
        }, null, 'User registered successfully');
      }
      return sendResponse(res, 400, false, null, 'Profile creation failed: ' + profileError.message);
    }

    sendResponse(res, 201, true, {
      user: authData.user,
      profile: profileData[0],
      session: authData.session,
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token
    }, null, 'User registered successfully');
  } catch (err) {
    console.error('Register error:', err);
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, null, 'Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return sendResponse(res, 401, false, null, 'Invalid email or password');
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.warn('Profile not found, creating...');
      // Auto-create profile jika tidak ada
      const { data: newProfile } = await supabase
        .from('users')
        .insert([{
          user_id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email,
          email: data.user.email,
          role: 'user',
          pendidikan: data.user.user_metadata?.pendidikan || null,
          pekerjaan: data.user.user_metadata?.pekerjaan || null
        }])
        .select()
        .single();

      return sendResponse(res, 200, true, {
        user: data.user,
        profile: newProfile,
        session: data.session,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      }, null, 'Login successful');
    }

    sendResponse(res, 200, true, {
      user: data.user,
      profile,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    }, null, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== LOGOUT ====================
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Logged out successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== REFRESH TOKEN ====================
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return sendResponse(res, 400, false, null, 'Refresh token is required');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return sendResponse(res, 401, false, null, 'Invalid refresh token');
    }

    sendResponse(res, 200, true, {
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    }, null, 'Token refreshed successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== GET CURRENT USER ====================
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Get user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', req.userId)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, 'User profile not found');
    }

    sendResponse(res, 200, true, {
      auth_user: req.user,
      profile
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== UPDATE PASSWORD ====================
router.put('/update-password', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }

    const { data, error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, data, null, 'Password updated successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, 400, false, null, 'Email is required');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Password reset email sent');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return sendResponse(res, 400, false, null, 'Reset token is required');
    }

    if (!password || password.length < 6) {
      return sendResponse(res, 400, false, null, 'Password must be at least 6 characters');
    }

    // Verify token and update password
    const { data, error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, data, null, 'Password reset successful');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

export default router;