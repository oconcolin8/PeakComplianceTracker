const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid email or password' });

  const { data: appUser } = await supabase
    .from('app_users')
    .select('role, is_active, full_name')
    .eq('id', data.user.id)
    .single();

  if (!appUser || !appUser.is_active) {
    return res.status(403).json({ error: 'Account not active' });
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: appUser.full_name,
      role: appUser.role,
    },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    role: req.user.role,
  });
});

module.exports = { login, logout, me };
