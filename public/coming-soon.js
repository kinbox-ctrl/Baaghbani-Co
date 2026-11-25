(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- config: countdown + instagram ---------- */
  fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => {
      if (!cfg) return;
      if (cfg.instagram) document.getElementById('ig-link').href = cfg.instagram;
      if (cfg.launchDate) startCountdown(new Date(cfg.launchDate));
    })
    .catch(() => {});

  function startCountdown(target) {
    if (isNaN(target) || target <= Date.now()) return;
    const box = document.getElementById('countdown');
    const el = (u) => box.querySelector(`[data-unit="${u}"]`);
    const units = { d: el('d'), h: el('h'), m: el('m'), s: el('s') };
    const pad = (n) => String(n).padStart(2, '0');
    box.hidden = false;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const s = Math.floor(diff / 1000);
      units.d.textContent = pad(Math.floor(s / 86400));
      units.h.textContent = pad(Math.floor((s % 86400) / 3600));
      units.m.textContent = pad(Math.floor((s % 3600) / 60));
      units.s.textContent = pad(s % 60);
      if (diff === 0) clearInterval(timer);
    };
    tick();
    const timer = setInterval(tick, 1000);
  }

  /* ---------- notify form ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const form = document.querySelector('[data-notify]');
  const msg = document.querySelector('.notify__msg');

  if (form) {
    const input = form.querySelector('input[type="email"]');
    const hp = form.querySelector('.hp');
    const btn = form.querySelector('button');
    const say = (text, isError) => {
      msg.textContent = text;
      msg.classList.toggle('is-error', !!isError);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!EMAIL_RE.test(email)) {
        say('That email doesn’t look quite right.', true);
        input.focus();
        return;
      }
      btn.disabled = true;
      say('Planting your seed…');
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, website: hp ? hp.value : '' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
        say(data.message || 'You’re on the list.');
        input.value = '';
      } catch (err) {
        say(err.message, true);
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- gentle parallax on the plant ---------- */
  const plant = document.querySelector('.plant');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (plant && !reduce && window.matchMedia('(pointer: fine)').matches) {
    plant.style.transition = 'transform 1.4s cubic-bezier(.22,1,.36,1)';
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        plant.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0)`;
      });
    });
  }
})();
