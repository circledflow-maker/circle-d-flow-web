/**
 * Pre-select KYH service on pages/booking.html (?source=kyh&service=slug)
 */
(function () {
  function boot() {
    const params = new URLSearchParams(location.search);
    if (params.get('source') !== 'kyh') return;

    const slug = params.get('service');
    const svc = window.KYHServices?.getBySlug(slug);
    if (!svc) return;

    const banner = document.createElement('div');
    banner.className = 'fixed top-0 left-0 right-0 z-[200] bg-[#121010]/95 border-b border-[#c9a962]/30 px-4 py-3 text-center text-sm text-white/90';
    banner.innerHTML = `Kiss Your Heart · <strong class="text-[#FFD700]">${svc.title}</strong> — complete your booking below. <a href="/pages/kyh/book" class="underline ml-2 text-white/70">← KYH sessions</a>`;
    document.body.prepend(banner);
    document.body.style.paddingTop = '52px';

    const select = document.getElementById('project-type');
    if (select && svc.bookingType) select.value = svc.bookingType;

    const textarea = document.querySelector('#step-details textarea');
    if (textarea && svc.bookingNote && !textarea.value.trim()) {
      textarea.value = svc.bookingNote;
    }

    if (typeof window.openBooking === 'function') {
      window.openBooking(svc.title);
    } else if (typeof window.showStep === 'function') {
      window.showStep('step-details');
      document.getElementById('booking-config')?.classList.remove('hidden');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
