// ==================== SKILL QUESTIONS ====================

// Get all role categories (PUBLIC) - MUST BE BEFORE :id route
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

// Get all skill questions (PUBLIC - with optional role filter)
router.get('/skill-questions', async (req, res) => {
  try {
    const roleCategory = req.query.role_category;

    let query = supabase
      .from('skill_questions')
      .select('id, text, trait, category, role_category');

    // Filter by role_category if provided
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

// Get single question - MUST BE AFTER /categories and general /skill-questions
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

// Create question (Protected - requires auth)
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

// Update question (Protected - requires auth)
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

// Delete question (Protected - requires auth)
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