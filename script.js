/* === Romantic Wedding Invitation - Vanilla JS === */

// --- Preloader ---
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  setTimeout(() => pre.classList.add('fading'), 1800);
  setTimeout(() => pre.classList.add('hidden'), 2600);
});

// --- Reveal on scroll (IntersectionObserver) ---
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// --- Countdown to July 17, 2026 5:00 PM ---
const TARGET = new Date('2026-07-17T17:00:00').getTime();
const cdNums = document.querySelectorAll('#countdown .cd-num');

function pad(n) { return String(n).padStart(2, '0'); }

function tick() {
  const diff = Math.max(0, TARGET - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const map = { d, h, m, s };
  cdNums.forEach(el => { el.textContent = pad(map[el.dataset.k]); });
}
tick();
setInterval(tick, 1000);

// --- Scroll Heart Path ---
const drawPath = document.getElementById('drawPath');
const heart = document.getElementById('heartFollower');
let pathLen = 0;

function initPath() {
  if (!drawPath) return;
  pathLen = drawPath.getTotalLength();
  drawPath.style.strokeDasharray = pathLen;
  drawPath.style.strokeDashoffset = pathLen;
  drawPath.style.transition = 'stroke-dashoffset 0.15s linear';
}

function updateHeart() {
  if (!pathLen || !drawPath || !heart) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  const drawn = pathLen * p;
  drawPath.style.strokeDashoffset = pathLen - drawn;
  const pt = drawPath.getPointAtLength(drawn);
  heart.style.left = pt.x + '%';
  heart.style.top  = (pt.y / 1000 * 100) + '%';
}

function bootPath() { initPath(); updateHeart(); }

document.addEventListener('DOMContentLoaded', bootPath);
window.addEventListener('load', () => {
  bootPath();
  // Re-measure after images/fonts settle
  setTimeout(bootPath, 300);
  setTimeout(bootPath, 1200);
});
window.addEventListener('resize', bootPath);
window.addEventListener('scroll', updateHeart, { passive: true });

// Recompute when any image finishes loading (page height changes)
document.querySelectorAll('img').forEach(img => {
  if (!img.complete) img.addEventListener('load', bootPath, { once: true });
});

// --- Music voice-note player ---
const voiceNote = document.getElementById('voiceNotePlayer');
const voiceAudio = document.getElementById('voiceAudio');
const voiceToggle = document.getElementById('voiceToggle');
const voiceSeek = document.getElementById('voiceSeek');
const voiceCurrent = document.getElementById('voiceCurrent');
const voiceDuration = document.getElementById('voiceDuration');
const voiceStatus = document.getElementById('voiceStatus');

function formatTime(totalSeconds) {
  const sec = Math.floor(totalSeconds || 0);
  const minutes = Math.floor(sec / 60);
  const seconds = String(sec % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

if (voiceNote && voiceAudio && voiceToggle && voiceSeek && voiceCurrent && voiceDuration) {
  const setStatus = (text) => {
    if (voiceStatus) voiceStatus.textContent = text;
  };

  const syncProgress = () => {
    if (!voiceAudio.duration) return;
    const progress = (voiceAudio.currentTime / voiceAudio.duration) * 100;
    voiceSeek.value = String(progress);
    voiceCurrent.textContent = formatTime(voiceAudio.currentTime);
  };

  voiceAudio.addEventListener('loadedmetadata', () => {
    voiceDuration.textContent = formatTime(voiceAudio.duration);
  });

  voiceAudio.addEventListener('timeupdate', syncProgress);

  // --- Autoplay on first interaction ---
  const interactions = ['click', 'touchstart', 'scroll', 'mousemove'];
  const startAutoplay = async () => {
    try {
      if (voiceAudio.paused) {
        await voiceAudio.play();
        voiceNote.classList.add('is-playing');
        setStatus('Playing now');
        voiceToggle.setAttribute('aria-label', 'Pause song');
      }
      // Remove listeners after first successful interaction
      interactions.forEach(evt => window.removeEventListener(evt, startAutoplay));
    } catch (_) {
      // If play fails (e.g. browser still blocking), we'll try again on next interaction
    }
  };

  interactions.forEach(evt => {
    window.addEventListener(evt, startAutoplay, { passive: true });
  });

  voiceToggle.addEventListener('click', async (e) => {
    // Prevent interaction listener from firing if button is clicked
    interactions.forEach(evt => window.removeEventListener(evt, startAutoplay));
    
    try {
      if (voiceAudio.paused) {
        await voiceAudio.play();
        voiceNote.classList.add('is-playing');
        setStatus('Playing now');
        voiceToggle.setAttribute('aria-label', 'Pause song');
      } else {
        voiceAudio.pause();
        voiceNote.classList.remove('is-playing');
        setStatus('Paused');
        voiceToggle.setAttribute('aria-label', 'Play song');
      }
    } catch (_) {
      setStatus('Unable to play');
    }
  });

  voiceSeek.addEventListener('input', () => {
    if (!voiceAudio.duration) return;
    voiceAudio.currentTime = (Number(voiceSeek.value) / 100) * voiceAudio.duration;
    syncProgress();
  });

  voiceAudio.addEventListener('ended', () => {
    voiceNote.classList.remove('is-playing');
    setStatus('Replay');
    voiceToggle.setAttribute('aria-label', 'Play song');
  });
}
