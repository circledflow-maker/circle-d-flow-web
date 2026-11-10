/** Resolve payment ownership from a verified Supabase token, never browser IDs. */
const { createClient } = require('@supabase/supabase-js');
module.exports = async function membershipUser(req) {
  const jwt = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!jwt) { const e = new Error('Sign in before managing your membership.'); e.status = 401; throw e; }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { const e = new Error('Server authentication env incomplete'); e.status = 500; throw e; }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data?.user?.id) { const e = new Error('Your session expired. Please sign in again.'); e.status = 401; throw e; }
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY){const e=Error('Account checks unavailable.');e.status=503;throw e;}
  const guard=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const restriction=await guard.from('cdf_account_restrictions').select('blocked').eq('user_id',data.user.id).maybeSingle();
  if(restriction.error){const e=Error('Account checks unavailable.');e.status=503;throw e;}
  if(restriction.data?.blocked){const e=Error('Your CDF account is restricted. Contact the team.');e.status=403;throw e;}
  return data.user;
};
