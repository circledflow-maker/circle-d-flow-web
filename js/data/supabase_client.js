import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// These need to be replaced with your actual Supabase project URL and anon key
// You can set them in your Vercel Environment Variables:
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

// Prefer env bridge / __CDF_CONFIG__; fall back to public anon (RLS-protected)
if (!window.__CDF_CONFIG__ || !window.__CDF_CONFIG__.supabaseKey) {
    window.__CDF_CONFIG__ = Object.assign({}, window.__CDF_CONFIG__ || {}, {
        supabaseUrl: 'https://agkmbaephgsnunlarntm.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21iYWVwaGdzbnVubGFybnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTAwNjEsImV4cCI6MjA4NjQ4NjA2MX0.XTuM8TTPWgbe65OzNnD8YQkfXY_nTAiYH_Cu-oiRM-k'
    });
}
const runtimeCfg = window.__CDF_CONFIG__ || {};
const supabaseUrl = window.ENV?.SUPABASE_URL || runtimeCfg.supabaseUrl;
const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || runtimeCfg.supabaseKey;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase runtime config missing for Heart client');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for Heart World
export const heartData = {
    async getProfile(userId) {
        if (!userId) return null;
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
        } catch (e) {
            if(!e.message?.includes('fetch')) console.error("Error fetching profile:", e);
            return null;
        }
    },
    
    async getEvents() {
        try {
            const { data, error } = await supabase.from('events').select(`
                *,
                profiles (username, role_calling),
                event_participants (
                    profiles (username, role_calling),
                    event_role
                )
            `).order('event_date', { ascending: true });
            if (error) throw error;
            return data;
        } catch (e) {
            if(!e.message?.includes('fetch')) console.error("Error fetching events:", e);
            return [];
        }
    },
    
    async getProjects() {
        try {
            const { data, error } = await supabase.from('projects').select(`
                *,
                profiles (username, role_calling),
                project_members (
                    profiles (username, role_calling),
                    project_role
                )
            `).order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (e) {
            if(!e.message?.includes('fetch')) console.error("Error fetching projects:", e);
            return [];
        }
    }
};
