/**
 * MediaCompress — auto-fit images & videos for localStorage / Supabase payloads
 */
(function () {
  const DEFAULT_MAX_IMAGE_BYTES = 4 * 1024 * 1024;
  const DEFAULT_MAX_VIDEO_BYTES = 8 * 1024 * 1024;

  function dataUrlBytes(dataUrl) {
    const base64 = String(dataUrl || '').split(',')[1] || '';
    return Math.ceil((base64.length * 3) / 4);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.readAsDataURL(file);
    });
  }

  function canvasToDataUrl(canvas, quality) {
    return canvas.toDataURL('image/jpeg', quality);
  }

  async function compressImageFile(file, maxBytes = DEFAULT_MAX_IMAGE_BYTES) {
    const img = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const dimensions = [1600, 1280, 1024, 900, 720, 540, 420, 320];
    const qualities = [0.88, 0.82, 0.76, 0.7, 0.62, 0.54, 0.46, 0.38];

    let best = null;
    for (const maxDim of dimensions) {
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxDim) {
        h = Math.round(h * maxDim / w);
        w = maxDim;
      } else if (h >= w && h > maxDim) {
        w = Math.round(w * maxDim / h);
        h = maxDim;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      for (const q of qualities) {
        const dataUrl = canvasToDataUrl(canvas, q);
        const size = dataUrlBytes(dataUrl);
        best = dataUrl;
        if (size <= maxBytes) {
          return { dataUrl, bytes: size, compressed: size < (file.size || size) };
        }
      }
    }

    if (best) return { dataUrl: best, bytes: dataUrlBytes(best), compressed: true };
    throw new Error('Could not compress image');
  }

  function waitForEvent(el, event) {
    return new Promise((resolve, reject) => {
      const onOk = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(new Error('Media load failed')); };
      const cleanup = () => {
        el.removeEventListener(event, onOk);
        el.removeEventListener('error', onErr);
      };
      el.addEventListener(event, onOk, { once: true });
      el.addEventListener('error', onErr, { once: true });
    });
  }

  async function extractVideoPoster(file, maxBytes = DEFAULT_MAX_IMAGE_BYTES) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    try {
      await waitForEvent(video, 'loadeddata');
      video.currentTime = Math.min(0.5, (video.duration || 1) * 0.1);
      await waitForEvent(video, 'seeked');
      const maxDim = 900;
      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      if (w > h && w > maxDim) {
        h = Math.round(h * maxDim / w);
        w = maxDim;
      } else if (h >= w && h > maxDim) {
        w = Math.round(w * maxDim / h);
        h = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      let dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      if (dataUrlBytes(dataUrl) > maxBytes) {
        const smaller = await compressImageFile(await dataUrlToFile(dataUrl, 'poster.jpg'), maxBytes);
        dataUrl = smaller.dataUrl;
      }
      return { dataUrl, bytes: dataUrlBytes(dataUrl), mode: 'poster' };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function dataUrlToFile(dataUrl, name) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || 'image/jpeg' });
  }

  async function transcodeVideo(file, maxBytes) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    try {
      await waitForEvent(video, 'loadedmetadata');
      const duration = Math.min(Math.max(video.duration || 15, 1), 20);
      const attempts = [
        { maxW: 960, bitrate: 900000 },
        { maxW: 720, bitrate: 600000 },
        { maxW: 540, bitrate: 400000 },
        { maxW: 420, bitrate: 250000 },
      ];

      for (const attempt of attempts) {
        const blob = await recordVideoSegment(video, duration, attempt.maxW, attempt.bitrate);
        if (blob && blob.size <= maxBytes) {
          return { dataUrl: await readFileAsDataUrl(blob), bytes: blob.size, mode: 'video' };
        }
        if (blob && blob.size < file.size) {
          const dataUrl = await readFileAsDataUrl(blob);
          if (attempt === attempts[attempts.length - 1]) {
            return { dataUrl, bytes: blob.size, mode: 'video', compressed: true };
          }
        }
        video.currentTime = 0;
        await waitForEvent(video, 'seeked').catch(() => {});
      }
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function pickRecorderMime() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    return types.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';
  }

  function recordVideoSegment(video, durationSec, maxW, videoBitsPerSecond) {
    return new Promise((resolve) => {
      let w = video.videoWidth || 720;
      let h = video.videoHeight || 1280;
      if (w > maxW) {
        h = Math.round(h * maxW / w);
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(24);
      const mimeType = pickRecorderMime();
      if (!mimeType) {
        resolve(null);
        return;
      }
      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
      recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      recorder.onstop = () => {
        resolve(chunks.length ? new Blob(chunks, { type: mimeType.split(';')[0] }) : null);
      };

      let rafId = 0;
      const start = performance.now();
      const draw = () => {
        if (video.ended || (performance.now() - start) / 1000 >= durationSec) {
          cancelAnimationFrame(rafId);
          try { recorder.stop(); } catch (_) { resolve(null); }
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        rafId = requestAnimationFrame(draw);
      };

      video.currentTime = 0;
      video.play().then(() => {
        recorder.start(250);
        draw();
      }).catch(() => resolve(null));
    });
  }

  async function compressVideoFile(file, maxBytes = DEFAULT_MAX_VIDEO_BYTES) {
    if (file.size <= maxBytes) {
      const dataUrl = await readFileAsDataUrl(file);
      return { dataUrl, bytes: file.size, mode: 'video', compressed: false };
    }

    const transcoded = await transcodeVideo(file, maxBytes);
    if (transcoded?.dataUrl && transcoded.bytes <= maxBytes * 1.15) {
      return { ...transcoded, compressed: true };
    }

    const poster = await extractVideoPoster(file, DEFAULT_MAX_IMAGE_BYTES);
    return {
      dataUrl: poster.dataUrl,
      bytes: poster.bytes,
      mode: 'poster',
      compressed: true,
      note: 'Video was compressed to a photo preview for upload',
    };
  }

  window.MediaCompress = {
    MAX_IMAGE_BYTES: DEFAULT_MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES: DEFAULT_MAX_VIDEO_BYTES,
    dataUrlBytes,
    compressImageFile,
    compressVideoFile,
    readFileAsDataUrl,
  };
})();
