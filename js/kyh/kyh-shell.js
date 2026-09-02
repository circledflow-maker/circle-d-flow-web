/**
 * Kiss Your Heart — application shell (nav + footer)
 * Uses root-absolute paths for Vercel cleanUrls
 */
(function () {
  const cfg = () => window.KYH_CONFIG || {};
  const u = (path) => (cfg().url ? cfg().url(path) : path);

  function navLink(item, currentSlug) {
    const current = currentSlug === item.slug ? ' aria-current="page"' : '';
    return `<li><a href="${item.href}"${current}>${item.label}</a></li>`;
  }

  function renderNav(container, options) {
    if (!container) return;
    const c = cfg();
    const slug = options?.activeSlug || '';
    const logo = c.brandLogo || '/Assets/kyh/brand/kiss-your-heart-logo.png';
    const links = (c.nav || []).map((item) => navLink(item, slug)).join('');
    const primary = c.cta?.primary || { label: 'Start Your Project', href: u('create/project-builder') };
    const secondary = c.cta?.secondary || { label: 'Book a Session', href: u('book') };
    const home = u('');

    container.innerHTML = `
      <header class="kyh-nav" role="banner">
        <div class="kyh-nav__inner">
          <a class="kyh-nav__brand" href="${home}" aria-label="${c.brand?.name || 'Kiss Your Heart'} home">
            <img class="kyh-nav__logo" src="${logo}" alt="" width="36" height="36" decoding="async">
            <span class="kyh-nav__title">${c.brand?.name || 'Kiss Your Heart'}</span>
          </a>
          <nav aria-label="Primary">
            <ul class="kyh-nav__links">${links}</ul>
          </nav>
          <div class="kyh-nav__actions">
            <a class="kyh-btn kyh-btn--ghost kyh-nav__cta-secondary" href="${secondary.href}">${secondary.label}</a>
            <a class="kyh-btn kyh-btn--primary kyh-nav__cta-primary" href="${primary.href}">${primary.label}</a>
            <button type="button" class="kyh-nav__toggle" aria-expanded="false" aria-controls="kyh-mobile-menu" aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div id="kyh-mobile-menu" class="kyh-nav__mobile" hidden>
        ${(c.nav || []).map((item) => `<a href="${item.href}">${item.label}</a>`).join('')}
        <a href="${primary.href}">${primary.label}</a>
        <a href="${secondary.href}">${secondary.label}</a>
      </div>
    `;

    const toggle = container.querySelector('.kyh-nav__toggle');
    const mobile = container.querySelector('#kyh-mobile-menu');
    if (toggle && mobile) {
      toggle.addEventListener('click', () => {
        const open = mobile.classList.toggle('is-open');
        mobile.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      mobile.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          mobile.classList.remove('is-open');
          mobile.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  function renderFooter(container) {
    if (!container) return;
    const c = cfg();
    const year = new Date().getFullYear();
    container.innerHTML = `
      <footer class="kyh-footer" role="contentinfo">
        <div class="kyh-container kyh-footer__grid">
          <div class="kyh-footer__brand">
            <span class="kyh-eyebrow">${c.brand?.name || 'Kiss Your Heart'}</span>
            <p class="kyh-quote">"${c.brand?.motto || 'when you intrinsically make the effort.'}"</p>
            <p>${c.brand?.descriptor || 'Creative Project Management'} · Lisbon · International</p>
          </div>
          <div class="kyh-footer__col">
            <h4>Create</h4>
            <ul>
              <li><a href="${u('create/project-builder')}">Start Your Project</a></li>
              <li><a href="${u('journey')}">The Journey</a></li>
              <li><a href="${u('services')}">Services</a></li>
              <li><a href="${u('book')}">Book a Session</a></li>
            </ul>
          </div>
          <div class="kyh-footer__col">
            <h4>Ecosystem</h4>
            <ul>
              <li><a href="${u('experiences')}">Experiences</a></li>
              <li><a href="${u('support')}">Support</a></li>
              <li><a href="${u('spaces')}">Supported Spaces</a></li>
              <li><a href="${u('contact')}">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="kyh-container kyh-footer__bottom">
          <span>© ${year} ${c.brand?.name || 'Kiss Your Heart'}</span>
          <span>${c.brand?.lxSignature || 'Kiss Your Heart LX'}</span>
        </div>
      </footer>
    `;
  }

  window.KYHShell = {
    mount(options) {
      renderNav(document.getElementById('kyh-nav-root'), options);
      renderFooter(document.getElementById('kyh-footer-root'));
      document.body.classList.add('kyh-page-enter');
    },
  };
})();
