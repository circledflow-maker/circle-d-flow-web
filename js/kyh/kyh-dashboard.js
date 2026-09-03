/**
 * Kiss Your Heart — shareable team dashboard
 */
(function () {
  function u(path) { return window.KYH_CONFIG?.url ? KYH_CONFIG.url(path) : path; }
  function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function loadProject(id) {
    try {
      const list = JSON.parse(localStorage.getItem('kyh_projects') || '[]');
      return list.find((p) => p.id === id) || null;
    } catch { return null; }
  }

  function render(container, projectId) {
    if (!container) return;
    const project = loadProject(projectId);
    if (!project) {
      container.innerHTML = `<div class="kyh-panel"><p class="kyh-display kyh-display-md">Project not found on this device.</p>
        <p class="kyh-muted">Open the share link on the device where the briefing was created, or start a new project.</p>
        <a class="kyh-btn kyh-btn--primary" href="${u('create/project-builder')}" style="margin-top:1rem;">Start Your Project</a></div>`;
      return;
    }

    const a = project.analysis || {};
    const shareUrl = `${location.origin}${u('dashboard')}?project=${project.id}`;

    container.innerHTML = `
      <header class="kyh-dashboard__head kyh-reveal">
        <p class="kyh-eyebrow">Team Dashboard · Kiss Your Heart LX</p>
        <h1 class="kyh-display kyh-display-lg">${esc(project.title)}</h1>
        <p class="kyh-muted">Stage: <strong>${esc(a.stage)}</strong> · Updated ${new Date(project.updatedAt).toLocaleDateString()}</p>
        <div class="kyh-briefing__actions" style="margin-top:1rem;">
          <button type="button" class="kyh-btn kyh-btn--ghost" id="kyh-dash-copy">Copy team link</button>
          <a class="kyh-btn kyh-btn--primary" href="${u('book')}">Book session</a>
          <a class="kyh-btn kyh-btn--text" href="${u('feedback')}?project=${project.id}">Feedback session</a>
        </div>
      </header>

      <nav class="kyh-dash-tabs kyh-reveal" aria-label="Dashboard sections">
        <button type="button" class="kyh-dash-tab is-active" data-tab="overview">Overview</button>
        <button type="button" class="kyh-dash-tab" data-tab="places">Places</button>
        <button type="button" class="kyh-dash-tab" data-tab="team">Team</button>
        <button type="button" class="kyh-dash-tab" data-tab="plan">Plan</button>
        <button type="button" class="kyh-dash-tab" data-tab="marketing">Marketing</button>
      </nav>

      <div id="kyh-dash-panel" class="kyh-reveal"></div>`;

    const panel = document.getElementById('kyh-dash-panel');
    const tabs = container.querySelectorAll('.kyh-dash-tab');

    function showTab(name) {
      tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
      if (name === 'overview') {
        panel.innerHTML = `<div class="kyh-panel"><p class="kyh-lead">${esc(a.concept?.pitch)}</p>
          <p class="kyh-muted" style="margin-top:1rem;">Vision: ${esc(project.vision)}</p>
          <p class="kyh-muted">Success: ${esc(project.success)}</p></div>
          <div class="kyh-briefing__split" style="margin-top:1rem;">
            <div class="kyh-panel"><p class="kyh-eyebrow">Benefits</p><ul class="kyh-map-list">${(a.benefits||[]).map(b=>`<li>✓ ${esc(b)}</li>`).join('')}</ul></div>
            <div class="kyh-panel"><p class="kyh-eyebrow">Risks</p><ul class="kyh-map-list">${(a.risks||[]).map(r=>`<li>${esc(r.text)}</li>`).join('')}</ul></div>
          </div>`;
      } else if (name === 'places') {
        panel.innerHTML = `<div class="kyh-venue-grid">${(a.venues||[]).map(v=>`
          <div class="kyh-panel"><h3>${esc(v.name)}</h3><p class="kyh-muted">${esc(v.vibe)}</p></div>`).join('')}</div>`;
      } else if (name === 'team') {
        panel.innerHTML = `<div class="kyh-venue-grid">${(a.artists||[]).map(x=>`
          <div class="kyh-panel kyh-panel--accent"><h3>${esc(x.name)}</h3><p class="kyh-muted">${esc(x.roles.join(' · '))}</p></div>`).join('')}
          </div><div class="kyh-panel" style="margin-top:1rem;"><p class="kyh-eyebrow">Production roles</p>
          <ul class="kyh-map-list">${(a.teamRoles||[]).map(r=>`<li>${esc(r.label)} — ${esc(r.desc)}</li>`).join('')}</ul></div>`;
      } else if (name === 'plan') {
        panel.innerHTML = `<div class="kyh-panel kyh-panel--accent"><p class="kyh-eyebrow">Pay model</p>
          <h3>${esc(a.payModel?.label)} · ${esc(a.payModel?.range)}</h3><p class="kyh-muted">${esc(a.payModel?.desc)}</p></div>
          <div class="kyh-gap-grid" style="margin-top:1rem;">${(a.gaps||[]).map(g=>`
            <div class="kyh-panel"><strong>${esc(g.label)}</strong><p class="kyh-muted">${esc(g.action)}</p></div>`).join('')}</div>`;
      } else if (name === 'marketing') {
        panel.innerHTML = `<ol class="kyh-marketing-flow">${(a.marketingFlow||[]).map(m=>`
          <li><span class="kyh-eyebrow">${esc(m.stage)}</span><p>${esc(m.action)}</p></li>`).join('')}</ol>`;
      }
    }

    tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
    showTab('overview');

    document.getElementById('kyh-dash-copy')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(shareUrl);
    });
  }

  window.KYHDashboard = { render, loadProject };
})();
