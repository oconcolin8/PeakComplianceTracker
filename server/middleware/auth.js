const supabase = require('../config/supabase');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Look up role from app_users table
  const { data: appUser } = await supabase
    .from('app_users')
    .select('role, is_active, full_name')
    .eq('id', user.id)
    .single();

  if (!appUser || !appUser.is_active) {
    return res.status(403).json({ error: 'Account not active' });
  }

  req.user = { ...user, role: appUser.role, full_name: appUser.full_name };
  next();
}

module.exports = requireAuth;
