/**
 * Circle D Flow — public runtime config (browser-safe only).
 * Anon key is publishable and must be protected by Supabase RLS.
 * Never put SUPABASE_SERVICE_ROLE_KEY here.
 */
(function (global) {
  var cfg = global.__CDF_CONFIG__ || {};
  global.__CDF_CONFIG__ = {
    supabaseUrl: cfg.supabaseUrl || 'https://agkmbaephgsnunlarntm.supabase.co',
    supabaseKey: cfg.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21iYWVwaGdzbnVubGFybnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTAwNjEsImV4cCI6MjA4NjQ4NjA2MX0.XTuM8TTPWgbe65OzNnD8YQkfXY_nTAiYH_Cu-oiRM-k'
  };
  global.CDF_SUPABASE_URL = global.__CDF_CONFIG__.supabaseUrl;
  global.CDF_SUPABASE_KEY = global.__CDF_CONFIG__.supabaseKey;
})(typeof window !== 'undefined' ? window : globalThis);
