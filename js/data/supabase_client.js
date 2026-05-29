import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// These need to be replaced with your actual Supabase project URL and anon key
// You can set them in your Vercel Environment Variables:
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

// Using hardcoded fallbacks or window.ENV if provided by a bundler
const supabaseUrl = window.ENV?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

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
            console.error("Error fetching profile:", e);
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
            console.error("Error fetching events:", e);
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
            console.error("Error fetching projects:", e);
            return [];
        }
    }
};
