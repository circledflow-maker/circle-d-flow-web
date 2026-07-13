/**
 * Kitchen Feedback — guest Flavor Log + live feed (photo/video)
 */
(function () {
  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          const max = 900;
          let w = img.width;
          let h = img.height;
          if (w > max) { h = h * max / w; w = max; }
          c.width = w;
          c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function readVideoDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_VIDEO_BYTES) {
        reject(new Error('Video too large — max 12 MB'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function localFeedback(slug) {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('cdf_flavor_feedback_')) continue;
      try {
        const row = JSON.parse(localStorage.getItem(key) || '{}');
        if (!row.body && !row.photo_url && !row.video_url) continue;
        if (slug && row.kitchen_slug && row.kitchen_slug !== slug) continue;
        out.push({ ...row, _local: true, created_at: row.created_at || new Date().toISOString() });
      } catch (_) { /* skip */ }
    }
    return out;
  }

  window.KitchenFeedback = {
    rating: 5,
    photoDataUrl: null,
    videoDataUrl: null,
    mediaType: 'text',
    kitchenSlug: 'akwabalx',
    kitchenId: null,
    _channel: null,

    async handlePhotoInput(file) {
      if (!file) return null;
      if (file.size > MAX_IMAGE_BYTES) throw new Error('Image too large — max 4 MB');
      this.photoDataUrl = await compressImage(file);
      this.videoDataUrl = null;
      this.mediaType = 'image';
      return this.photoDataUrl;
    },

    async handleVideoInput(file) {
      if (!file) return null;
      this.videoDataUrl = await readVideoDataUrl(file);
      this.photoDataUrl = null;
      this.mediaType = 'video';
      return this.videoDataUrl;
    },

    clearMedia() {
      this.photoDataUrl = null;
      this.videoDataUrl = null;
      this.mediaType = 'text';
    },

    setRating(n) {
      this.rating = Math.min(5, Math.max(1, n || 5));
    },

    async submit(body) {
      const text = String(body || '').trim();
      if (!text) return { ok: false, error: 'empty' };
      if (!this.photoDataUrl && !this.videoDataUrl) {
        return { ok: false, error: 'media_required' };
      }

      const mediaType = this.photoDataUrl && this.videoDataUrl
        ? 'mixed'
        : (this.videoDataUrl ? 'video' : 'image');

      const payload = {
        kitchenSlug: this.kitchenSlug,
        kitchenId: this.kitchenId,
        rating: this.rating,
        body: text,
        photoDataUrl: this.photoDataUrl,
        videoDataUrl: this.videoDataUrl,
        mediaType,
      };

      if (window.FlavorQuestEngine?.submitFeedback) {
        await window.FlavorQuestEngine.submitFeedback(payload);
      }

      this.clearMedia();
      return { ok: true };
    },

    async fetchFeed(slug, limit = 24) {
      const kitchenSlug = slug || this.kitchenSlug || 'akwabalx';
      let remote = [];

      if (window.supabaseClient) {
        try {
          const { data, error } = await window.supabaseClient
            .from('kitchen_feedback')
            .select('id, kitchen_slug, rating, body, photo_url, video_url, media_type, created_at')
            .eq('kitchen_slug', kitchenSlug)
            .order('created_at', { ascending: false })
            .limit(limit);
          if (!error && data) remote = data;
        } catch (e) {
          console.warn('[KitchenFeedback] fetch', e.message);
        }
      }

      const merged = [...remote, ...localFeedback(kitchenSlug)];
      const seen = new Set();
      return merged
        .filter((row) => {
          const key = row.id || `${row.body}-${row.created_at}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return row.body || row.photo_url || row.video_url;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    },

    renderStars(rating) {
      const r = Math.min(5, Math.max(1, rating || 5));
      return '🔥'.repeat(r) + '<span class="opacity-20">' + '🔥'.repeat(5 - r) + '</span>';
    },

    renderFeedItem(row) {
      const media = row.video_url
        ? `<video src="${row.video_url}" class="w-full max-h-40 rounded-lg border border-white/10 mt-2" controls playsinline muted></video>`
        : (row.photo_url
          ? `<img src="${row.photo_url}" alt="" class="w-full max-h-40 object-cover rounded-lg border border-white/10 mt-2" loading="lazy">`
          : '');
      const when = row.created_at ? new Date(row.created_at).toLocaleString() : 'just now';
      return `
        <article class="flavor-feed-item border border-white/10 rounded-xl p-3 bg-white/[0.03]">
          <div class="flex justify-between items-start gap-2 mb-1">
            <span class="text-sm">${this.renderStars(row.rating)}</span>
            <span class="text-[9px] text-white/30 uppercase">${escapeHtml(when)}</span>
          </div>
          <p class="text-xs text-white/75 leading-relaxed">${escapeHtml(row.body)}</p>
          ${media}
        </article>`;
    },

    async renderFeed(containerId, slug) {
      const el = document.getElementById(containerId);
      if (!el) return;
      const items = await this.fetchFeed(slug);
      if (!items.length) {
        el.innerHTML = '<p class="text-xs text-white/35 text-center py-6">No flavor logs yet — be the first Navigator to share the vibe.</p>';
        return;
      }
      el.innerHTML = items.map((row) => this.renderFeedItem(row)).join('');
    },

    bindForm(opts = {}) {
      const slug = opts.slug || this.kitchenSlug;
      this.kitchenSlug = slug;
      this.kitchenId = opts.kitchenId || null;

      const starsWrap = document.getElementById(opts.starsId || 'guest-feedback-stars');
      if (starsWrap) {
        starsWrap.querySelectorAll('[data-r]').forEach((btn) => {
          btn.addEventListener('click', () => {
            this.setRating(parseInt(btn.dataset.r, 10));
            starsWrap.querySelectorAll('[data-r]').forEach((b, j) => {
              b.style.opacity = j < this.rating ? '1' : '0.35';
            });
          });
        });
        starsWrap.querySelectorAll('[data-r]').forEach((b, j) => { b.style.opacity = j < 5 ? '1' : '0.35'; });
      }

      document.getElementById(opts.photoId || 'guest-feedback-photo')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const url = await this.handlePhotoInput(file);
          const prev = document.getElementById(opts.previewId || 'guest-feedback-preview');
          const vid = document.getElementById(opts.videoPreviewId || 'guest-feedback-video-preview');
          if (vid) { vid.classList.add('hidden'); vid.removeAttribute('src'); }
          if (prev) { prev.src = url; prev.classList.remove('hidden'); }
        } catch (err) {
          if (window.Pusher) window.Pusher.showToast(err.message, 'error');
        }
      });

      document.getElementById(opts.videoId || 'guest-feedback-video')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const url = await this.handleVideoInput(file);
          const prev = document.getElementById(opts.previewId || 'guest-feedback-preview');
          const vid = document.getElementById(opts.videoPreviewId || 'guest-feedback-video-preview');
          if (prev) prev.classList.add('hidden');
          if (vid) { vid.src = url; vid.classList.remove('hidden'); }
        } catch (err) {
          if (window.Pusher) window.Pusher.showToast(err.message, 'error');
        }
      });

      document.getElementById(opts.submitId || 'btn-guest-feedback')?.addEventListener('click', async () => {
        const body = document.getElementById(opts.bodyId || 'guest-feedback-body')?.value;
        const result = await this.submit(body);
        if (!result.ok) {
          const msg = result.error === 'media_required'
            ? 'Bitte Foto oder Video hinzufügen / Add photo or video'
            : 'Bitte Text eingeben / Please write feedback';
          if (window.Pusher) window.Pusher.showToast(msg, 'error');
          return;
        }
        document.getElementById(opts.bodyId || 'guest-feedback-body').value = '';
        document.getElementById(opts.previewId || 'guest-feedback-preview')?.classList.add('hidden');
        const vid = document.getElementById(opts.videoPreviewId || 'guest-feedback-video-preview');
        if (vid) { vid.classList.add('hidden'); vid.removeAttribute('src'); }
        if (window.Pusher) window.Pusher.showToast('Flavor Log live — +150 XP claimable in Flavor Quest', 'success');
        if (window.Flowee) window.Flowee.talk(true, 'Your flavor vibe is live for the crew!', 'celebrate');
        await this.renderFeed(opts.feedId || 'guest-feedback-feed', slug);
        if (window.FlavorQuestEngine) window.FlavorQuestEngine.evaluateLocks();
      });
    },

    subscribeRealtime(feedId, slug) {
      const kitchenSlug = slug || this.kitchenSlug;
      if (!window.supabaseClient) return;
      if (this._channel) window.supabaseClient.removeChannel(this._channel);
      this._channel = window.supabaseClient
        .channel(`kitchen-feedback-${kitchenSlug}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'kitchen_feedback',
          filter: `kitchen_slug=eq.${kitchenSlug}`,
        }, () => this.renderFeed(feedId, kitchenSlug))
        .subscribe();
    },

    initGuest(opts = {}) {
      const slug = opts.slug || 'akwabalx';
      this.bindForm(opts);
      this.renderFeed(opts.feedId || 'guest-feedback-feed', slug);
      this.subscribeRealtime(opts.feedId || 'guest-feedback-feed', slug);
      window.addEventListener('cdf-flavor-log', (e) => {
        if (!e.detail?.kitchen_slug || e.detail.kitchen_slug === slug) {
          this.renderFeed(opts.feedId || 'guest-feedback-feed', slug);
        }
      });
    },
  };
})();
