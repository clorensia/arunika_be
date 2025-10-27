import express from 'express';
import { supabase } from '../config/supabaseClient.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

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

// Helper function for pagination
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { page, limit, from, to };
};

// ==================== USERS ====================

router.get('/users', optionalAuth, async (req, res) => {
  try {
    const { from, to, limit } = getPaginationParams(req);
    
    const { data, error, count } = await supabase
      .from('users')
      .select('user_id, name, email, role, pendidikan, pekerjaan, created_at', { count: 'exact' })
      .range(from, to);
    
    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      users: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, name, email, role, pendidikan, pekerjaan, created_at')
      .eq('user_id', req.params.id)
      .single();
    
    if (error) {
      return sendResponse(res, 404, false, null, 'User not found');
    }

    sendResponse(res, 200, true, { user: data });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.put('/users/:id', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return sendResponse(res, 403, false, null, 'You can only update your own profile');
    }

    const { name, role, pendidikan, pekerjaan } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (pendidikan) updateData.pendidikan = pendidikan;
    if (pekerjaan) updateData.pekerjaan = pekerjaan;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', req.params.id)
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    if (!data || data.length === 0) {
      return sendResponse(res, 404, false, null, 'User not found');
    }

    sendResponse(res, 200, true, { user: data[0] }, null, 'User updated successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return sendResponse(res, 403, false, null, 'You can only delete your own account');
    }

    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', req.params.id);

    if (dbError) {
      return sendResponse(res, 400, false, null, dbError.message);
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(req.params.id);

    if (authError) {
      return sendResponse(res, 400, false, null, authError.message);
    }

    sendResponse(res, 200, true, null, null, 'User deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== PEKERJAAN (Jobs) ====================

router.get('/pekerjaan', async (req, res) => {
  try {
    const { from, to, limit } = getPaginationParams(req);
    const bidang = req.query.bidang;

    let query = supabase.from('pekerjaan').select('*', { count: 'exact' });

    if (bidang) {
      query = query.eq('bidang', bidang);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      jobs: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/pekerjaan/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pekerjaan')
      .select('*')
      .eq('pekerjaan_id', req.params.id)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, 'Job not found');
    }

    sendResponse(res, 200, true, { job: data });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/pekerjaan', requireAuth, async (req, res) => {
  try {
    const { nama_pekerjaan, bidang, link_pekerjaan, deskripsi, requirements } = req.body;

    if (!nama_pekerjaan || !bidang) {
      return sendResponse(res, 400, false, null, 'nama_pekerjaan and bidang are required');
    }

    const { data, error } = await supabase
      .from('pekerjaan')
      .insert([{ nama_pekerjaan, bidang, link_pekerjaan, deskripsi, requirements }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { job: data[0] }, null, 'Job created successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.put('/pekerjaan/:id', requireAuth, async (req, res) => {
  try {
    const { nama_pekerjaan, bidang, link_pekerjaan, deskripsi, requirements } = req.body;

    const { data, error } = await supabase
      .from('pekerjaan')
      .update({ nama_pekerjaan, bidang, link_pekerjaan, deskripsi, requirements, updated_at: new Date().toISOString() })
      .eq('pekerjaan_id', req.params.id)
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, { job: data[0] }, null, 'Job updated successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/pekerjaan/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('pekerjaan')
      .delete()
      .eq('pekerjaan_id', req.params.id);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Job deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== PEKERJAAN SKILLS BY ROLE & LEVEL ====================

router.get('/pekerjaan-skills/:role_category/:level', async (req, res) => {
  try {
    const { role_category, level } = req.params;
    
    console.log(`[Skills Endpoint] Fetching skills for role: ${role_category}, level: ${level}`);
    
    const validLevels = ['junior', 'middle', 'senior', 'intern'];
    if (!validLevels.includes(level)) {
      return sendResponse(res, 400, false, null, `Level must be one of: ${validLevels.join(', ')}`);
    }

    const validRoles = ['PM', 'UI/UX', 'BE', 'FE'];
    if (!validRoles.includes(role_category)) {
      return sendResponse(res, 400, false, null, `Role must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('pekerjaan')
      .select('*')
      .eq('role_category', role_category)
      .single();

    if (error) {
      console.error(`[Skills Endpoint] Error: ${error.message}`);
      return sendResponse(res, 404, false, null, `Job position for ${role_category} not found`);
    }

    const skillsColumn = `required_skills_${level}`;
    const skills = data[skillsColumn] || [];

    console.log(`[Skills Endpoint] Found skills for ${level}:`, skills);

    const response = {
      pekerjaan_id: data.pekerjaan_id,
      nama_pekerjaan: data.nama_pekerjaan,
      role_category: data.role_category,
      level: level,
      skills: skills,
      search_urls: {
        linkedin: data.search_url_linkedin,
        jobstreet: data.search_url_jobstreet,
        sribulancer: data.search_url_sribulancer
      },
      deskripsi: data.deskripsi
    };

    sendResponse(res, 200, true, response, null, `Skills for ${role_category} ${level} fetched successfully`);
  } catch (err) {
    console.error(`[Skills Endpoint] Exception:`, err.message);
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/pekerjaan-skills/:role_category/all', async (req, res) => {
  try {
    const { role_category } = req.params;

    const validRoles = ['PM', 'UI/UX', 'BE', 'FE'];
    if (!validRoles.includes(role_category)) {
      return sendResponse(res, 400, false, null, `Role must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('pekerjaan')
      .select('*')
      .eq('role_category', role_category)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, `Job position for ${role_category} not found`);
    }

    const response = {
      pekerjaan_id: data.pekerjaan_id,
      nama_pekerjaan: data.nama_pekerjaan,
      role_category: data.role_category,
      skills: {
        junior: data.required_skills_junior || [],
        middle: data.required_skills_middle || [],
        senior: data.required_skills_senior || []
      },
      search_urls: {
        linkedin: data.search_url_linkedin,
        jobstreet: data.search_url_jobstreet,
        sribulancer: data.search_url_sribulancer
      },
      deskripsi: data.deskripsi
    };

    sendResponse(res, 200, true, response, null, `All skills for ${role_category} fetched successfully`);
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/pekerjaan-skills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pekerjaan')
      .select('*');

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    const formattedData = data.map(job => ({
      pekerjaan_id: job.pekerjaan_id,
      nama_pekerjaan: job.nama_pekerjaan,
      role_category: job.role_category,
      skills: {
        junior: job.required_skills_junior || [],
        middle: job.required_skills_middle || [],
        senior: job.required_skills_senior || []
      },
      search_urls: {
        linkedin: job.search_url_linkedin,
        jobstreet: job.search_url_jobstreet,
        sribulancer: job.search_url_sribulancer
      }
    }));

    sendResponse(res, 200, true, { jobs: formattedData }, null, 'All job skills fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== SKILLUP (Courses) ====================

router.get('/skillup', async (req, res) => {
  try {
    const { from, to, limit } = getPaginationParams(req);
    const level = req.query.level;

    let query = supabase.from('skillup').select('*', { count: 'exact' });

    if (level) {
      query = query.eq('level', level);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      skills: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/skillup/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skillup')
      .select('*')
      .eq('skill_id', req.params.id)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, 'Skill not found');
    }

    sendResponse(res, 200, true, { skill: data });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/skillup', requireAuth, async (req, res) => {
  try {
    const { nama_skillup, link_skillup, deskripsi, level } = req.body;

    if (!nama_skillup) {
      return sendResponse(res, 400, false, null, 'nama_skillup is required');
    }

    const { data, error } = await supabase
      .from('skillup')
      .insert([{ nama_skillup, link_skillup, deskripsi, level }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { skill: data[0] }, null, 'Skill created successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.put('/skillup/:id', requireAuth, async (req, res) => {
  try {
    const { nama_skillup, link_skillup, deskripsi, level } = req.body;

    const { data, error } = await supabase
      .from('skillup')
      .update({ nama_skillup, link_skillup, deskripsi, level, updated_at: new Date() })
      .eq('skill_id', req.params.id)
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, { skill: data[0] }, null, 'Skill updated successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/skillup/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('skillup')
      .delete()
      .eq('skill_id', req.params.id);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Skill deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== PERSONALIZED ====================

router.get('/users/:userId/personalized', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { from, to, limit } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('personalized')
      .select('*', { count: 'exact' })
      .eq('user_id', req.params.userId)
      .range(from, to);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      personalizations: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/personalized/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('personalized')
      .select('*')
      .eq('rec_id', req.params.id)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (data.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    sendResponse(res, 200, true, { personalized: data });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/personalized', requireAuth, async (req, res) => {
  try {
    const { role_fit, strength, skill_gap, level, gap } = req.body;
    const user_id = req.userId;

    const { data, error } = await supabase
      .from('personalized')
      .insert([{ user_id, role_fit, strength, skill_gap, level, gap }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { personalized: data[0] }, null, 'Personalization created');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.put('/personalized/:id', requireAuth, async (req, res) => {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('personalized')
      .select('user_id')
      .eq('rec_id', req.params.id)
      .single();

    if (checkError || !existing) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (existing.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { role_fit, strength, skill_gap, level, gap } = req.body;

    const { data, error } = await supabase
      .from('personalized')
      .update({ role_fit, strength, skill_gap, level, gap, updated_at: new Date() })
      .eq('rec_id', req.params.id)
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, { personalized: data[0] }, null, 'Personalization updated');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== REC PEKERJAAN ====================

router.get('/personalized/:recId/jobs', requireAuth, async (req, res) => {
  try {
    const { data: personalized, error: checkError } = await supabase
      .from('personalized')
      .select('user_id')
      .eq('rec_id', req.params.recId)
      .single();

    if (checkError || !personalized) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { from, to, limit } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('rec_pekerjaan')
      .select(`repekerjaan_id, created_at, pekerjaan(*)`, { count: 'exact' })
      .eq('rec_id', req.params.recId)
      .range(from, to);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      recommendations: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/rec-pekerjaan', requireAuth, async (req, res) => {
  try {
    const { rec_id, pekerjaan_id } = req.body;

    if (!rec_id || !pekerjaan_id) {
      return sendResponse(res, 400, false, null, 'rec_id and pekerjaan_id are required');
    }

    const { data: personalized, error: checkError } = await supabase
      .from('personalized')
      .select('user_id')
      .eq('rec_id', rec_id)
      .single();

    if (checkError || !personalized) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { data, error } = await supabase
      .from('rec_pekerjaan')
      .insert([{ rec_id, pekerjaan_id }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { recommendation: data[0] }, null, 'Job recommendation added');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/rec-pekerjaan/:id', requireAuth, async (req, res) => {
  try {
    const { data: recPekerjaan, error: getError } = await supabase
      .from('rec_pekerjaan')
      .select('rec_id, personalized!inner(user_id)')
      .eq('repekerjaan_id', req.params.id)
      .single();

    if (getError || !recPekerjaan) {
      return sendResponse(res, 404, false, null, 'Recommendation not found');
    }

    if (recPekerjaan.personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { error } = await supabase
      .from('rec_pekerjaan')
      .delete()
      .eq('repekerjaan_id', req.params.id);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Job recommendation removed');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== REC SKILLUP ====================

router.get('/personalized/:recId/skills', requireAuth, async (req, res) => {
  try {
    const { data: personalized, error: checkError } = await supabase
      .from('personalized')
      .select('user_id')
      .eq('rec_id', req.params.recId)
      .single();

    if (checkError || !personalized) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { from, to, limit } = getPaginationParams(req);

    const { data, error, count } = await supabase
      .from('rec_skillup')
      .select(`recskillup_id, created_at, skillup(*)`, { count: 'exact' })
      .eq('rec_id', req.params.recId)
      .range(from, to);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, {
      recommendations: data,
      pagination: { total: count, limit, page: Math.floor(from / limit) + 1 }
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/rec-skillup', requireAuth, async (req, res) => {
  try {
    const { rec_id, skill_id } = req.body;

    if (!rec_id || !skill_id) {
      return sendResponse(res, 400, false, null, 'rec_id and skill_id are required');
    }

    const { data: personalized, error: checkError } = await supabase
      .from('personalized')
      .select('user_id')
      .eq('rec_id', rec_id)
      .single();

    if (checkError || !personalized) {
      return sendResponse(res, 404, false, null, 'Personalization not found');
    }

    if (personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { data, error } = await supabase
      .from('rec_skillup')
      .insert([{ rec_id, skill_id }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { recommendation: data[0] }, null, 'Skill recommendation added');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/rec-skillup/:id', requireAuth, async (req, res) => {
  try {
    const { data: recSkillup, error: getError } = await supabase
      .from('rec_skillup')
      .select('rec_id, personalized!inner(user_id)')
      .eq('recskillup_id', req.params.id)
      .single();

    if (getError || !recSkillup) {
      return sendResponse(res, 404, false, null, 'Recommendation not found');
    }

    if (recSkillup.personalized.user_id !== req.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { error } = await supabase
      .from('rec_skillup')
      .delete()
      .eq('recskillup_id', req.params.id);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Skill recommendation removed');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== COMPLEX QUERIES ====================

router.get('/profile/:userId', requireAuth, async (req, res) => {
  try {
    if (req.userId !== req.params.userId) {
      return sendResponse(res, 403, false, null, 'Access denied');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', req.params.userId)
      .single();

    if (userError) {
      return sendResponse(res, 404, false, null, 'User not found');
    }

    const { data: personalizedData, error: personalizedError } = await supabase
      .from('personalized')
      .select(`*, rec_pekerjaan(repekerjaan_id, pekerjaan(*)), rec_skillup(recskillup_id, skillup(*))`)
      .eq('user_id', req.params.userId);

    if (personalizedError) {
      return sendResponse(res, 400, false, null, personalizedError.message);
    }

    sendResponse(res, 200, true, {
      user: userData,
      personalizations: personalizedData
    });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

// ==================== SKILL QUESTIONS ====================

router.get('/skill-questions', async (req, res) => {
  try {
    const roleCategory = req.query.role_category;

    let query = supabase
      .from('skill_questions')
      .select('id, text, trait, category, role_category');

    if (roleCategory) {
      query = query.eq('role_category', roleCategory);
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, { 
      questions: data,
      count: data.length 
    }, null, 'Questions fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/skill-questions/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skill_questions')
      .select('role_category')
      .distinct();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    const categories = data.map(d => d.role_category);
    
    sendResponse(res, 200, true, { categories }, null, 'Categories fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.get('/skill-questions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skill_questions')
      .select('id, text, trait, category, role_category')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return sendResponse(res, 404, false, null, 'Question not found');
    }

    sendResponse(res, 200, true, { question: data });
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.post('/skill-questions', requireAuth, async (req, res) => {
  try {
    const { text, trait, category, role_category } = req.body;

    if (!text || !trait || !category || !role_category) {
      return sendResponse(res, 400, false, null, 'text, trait, category, and role_category are required');
    }

    const validTraits = ['analysis', 'innovation', 'collab', 'creative'];
    if (!validTraits.includes(trait)) {
      return sendResponse(res, 400, false, null, `trait must be one of: ${validTraits.join(', ')}`);
    }

    const validRoles = ['Backend Developer', 'UI/UX Designer', 'Frontend Developer', 'Product Manager'];
    if (!validRoles.includes(role_category)) {
      return sendResponse(res, 400, false, null, `role_category must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('skill_questions')
      .insert([{ text, trait, category, role_category }])
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 201, true, { question: data[0] }, null, 'Question created successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.put('/skill-questions/:id', requireAuth, async (req, res) => {
  try {
    const { text, trait, category, role_category } = req.body;

    const validTraits = ['analysis', 'innovation', 'collab', 'creative'];
    if (trait && !validTraits.includes(trait)) {
      return sendResponse(res, 400, false, null, `trait must be one of: ${validTraits.join(', ')}`);
    }

    const validRoles = ['Backend Developer', 'UI/UX Designer', 'Frontend Developer', 'Product Manager'];
    if (role_category && !validRoles.includes(role_category)) {
      return sendResponse(res, 400, false, null, `role_category must be one of: ${validRoles.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('skill_questions')
      .update({ 
        ...(text && { text }),
        ...(trait && { trait }),
        ...(category && { category }),
        ...(role_category && { role_category }),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    if (!data || data.length === 0) {
      return sendResponse(res, 404, false, null, 'Question not found');
    }

    sendResponse(res, 200, true, { question: data[0] }, null, 'Question updated successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

router.delete('/skill-questions/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('skill_questions')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return sendResponse(res, 400, false, null, error.message);
    }

    sendResponse(res, 200, true, null, null, 'Question deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, err.message);
  }
});

export default router;