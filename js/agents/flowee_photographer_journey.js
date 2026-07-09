/**
 * Flowee Photographer Journey — solo + community path for visual creators
 */
(function () {
  const KEY = 'cdf_photographer_journey_v1';

  async function speak(text, mood, options) {
    if (window.Flowee) window.Flowee.talk(true, text, mood || 'guide', options || []);
    await new Promise((r) => setTimeout(r, Math.max(2200, text.length * 35)));
  }

  function highlight(sel) {
    document.querySelectorAll('.flowee-tour-highlight').forEach((e) => e.classList.remove('flowee-tour-highlight'));
    const el = document.querySelector(sel);
    if (el) {
      el.classList.add('flowee-tour-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  window.FloweePhotographerJourney = {
    async start(force) {
      if (!force && localStorage.getItem(KEY)) return;
      const path = location.pathname;
      if (path.includes('photographer_hub')) return this.hubTour();
      if (path.includes('booking')) return this.bookingTour();
      if (path.includes('vision_studio')) return this.studioTour();
      if (path.includes('partner-scanner')) return this.communityTour();
      if (path.includes('coop')) return this.coopTour();
      if (path.includes('dashboard')) return this.dashboardTour();
    },

    async hubTour() {
      await speak('Vision Hub — solo path: Studio, Gallery, Book. Community: Flow Finder and Resonance Bar.');
      highlight('.hub-card');
      localStorage.setItem(KEY, '1');
    },

    async dashboardTour() {
      await speak('Welcome, Navigator. Tap the Vision planet on the orbit to open your photo studio.');
      highlight('#planet-Vision');
      await speak('Or book a session with Kyheart directly from the gallery or booking page.');
      localStorage.setItem(KEY, '1');
    },

    async studioTour() {
      await speak('Vision Studio — your daily missions, uploads, and Cinema Stage live here.');
      highlight('#upload-zone, .upload-dropzone, [data-upload]');
      await speak('Upload today\'s best shot for XP. Missions sync to the Grand Bazaar when you mint artifacts.');
      await speak('Solo mode: build your portfolio. Community mode: open Coop to plan shoots with Naru, C-riz, and crew.', 'guide', [
        { label: 'OPEN COOP', action: () => { location.href = 'coop.html'; } },
        { label: 'BOOK SESSION', action: () => { location.href = 'booking.html'; } },
      ]);
      localStorage.setItem(KEY, '1');
    },

    async bookingTour() {
      await speak('Book a photo session with Circle D Flow in Lisbon. Choose your package and hours.');
      highlight('#booking-config, form, .booking-step');
      await speak('After payment or calendar pick, your booking saves to the database and you earn Navigator XP.');
      localStorage.setItem(KEY, '1');
    },

    async communityTour() {
      await speak('Flow Finder — scan collaborators. Pick Visual Flow if you are a photographer or videographer.');
      await speak('Your profile syncs locally; link your Supabase account to persist crew invites in Coop.');
      highlight('form, .quiz-card, #partner-form');
      await speak('Next: Resonance Bar for event planning with roles, gear, and calendar.', 'guide', [
        { label: 'RESONANCE BAR', action: () => { location.href = 'coop.html'; } },
      ]);
      localStorage.setItem(KEY, '1');
    },

    async coopTour() {
      await speak('Community mode — plan shoots together. Assign photographer, vision, and audio roles.');
      highlight('#coop-team-block, #coop-phase-form-m, #coop-phase-form');
      localStorage.setItem(KEY, '1');
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.FloweePhotographerJourney?.start(), 2500);
  });
})();
