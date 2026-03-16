const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, full_name, role, is_active, created_at')
    .order('full_name');
  if (error) throw error;

  // Get emails from auth.users via admin API
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailMap = Object.fromEntries((authUsers?.users || []).map((u) => [u.id, u.email]));

  res.json(data.map((u) => ({ ...u, email: emailMap[u.id] || null })));
});

const create = asyncHandler(async (req, res) => {
  const { email, password, full_name, role } = req.body;

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) {
    if (authError.message.includes('already registered')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    throw authError;
  }

  // Create app_users profile
  const { data, error } = await supabase
    .from('app_users')
    .insert({ id: authData.user.id, full_name, role, is_active: true })
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ ...data, email });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, is_active, full_name } = req.body;

  const updates = {};
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;
  if (full_name !== undefined) updates.full_name = full_name;

  const { data, error } = await supabase
    .from('app_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Deactivate instead of hard delete
  const { error } = await supabase
    .from('app_users')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
  res.json({ message: 'User deactivated' });
});

module.exports = { list, create, update, remove };
