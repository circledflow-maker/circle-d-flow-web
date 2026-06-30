/**
 * CORS-safe DOM prep for html2canvas / html2pdf flyer export.
 */
const ShareExport = {
    isExternal(url) {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
        try {
            const u = new URL(url, window.location.origin);
            return u.origin !== window.location.origin;
        } catch {
            return false;
        }
    },

    proxyUrl(url) {
        const abs = new URL(url, window.location.origin).toString();
        if (!this.isExternal(abs)) return abs;
        return `/api/image-proxy?url=${encodeURIComponent(abs)}`;
    },

    async loadImageAsBlobUrl(src) {
        const url = this.proxyUrl(src);
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    },

    async inlineImages(root) {
        const revoked = [];
        const imgs = root.querySelectorAll('img');
        for (const img of imgs) {
            const src = img.getAttribute('src') || img.src;
            if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;
            try {
                const blobUrl = await this.loadImageAsBlobUrl(src);
                img.crossOrigin = 'anonymous';
                img.src = blobUrl;
                revoked.push(blobUrl);
                await img.decode();
            } catch (e) {
                console.warn('[ShareExport] dropping image', src, e);
                const ph = document.createElement('div');
                ph.style.cssText = 'width:100%;height:100%;background:#222;border-radius:8px;';
                img.replaceWith(ph);
            }
        }
        const styled = root.querySelectorAll('[style*="background-image"]');
        for (const el of styled) {
            const m = el.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (!m || !m[1]) continue;
            const bg = m[1];
            if (!this.isExternal(bg) && !bg.includes('data:')) continue;
            try {
                const blobUrl = await this.loadImageAsBlobUrl(bg);
                el.style.backgroundImage = `url("${blobUrl}")`;
                revoked.push(blobUrl);
            } catch {
                el.style.backgroundImage = 'none';
            }
        }
        return () => revoked.forEach((u) => URL.revokeObjectURL(u));
    },

    async capturePng(element, filename) {
        const cleanup = await this.inlineImages(element);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            cleanup();
        }
    },
};

window.ShareExport = ShareExport;
