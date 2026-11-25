(() => {
  'use strict';

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  // stagger siblings that share a parent
  const groups = new Map();
  reveals.forEach((el) => {
    const i = groups.get(el.parentElement) || 0;
    el.style.setProperty('--rd', `${i * 0.09}s`);
    groups.set(el.parentElement, i + 1);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- year ---------- */
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
    const units = {
      d: box.querySelector('[data-unit="d"]'),
      h: box.querySelector('[data-unit="h"]'),
      m: box.querySelector('[data-unit="m"]'),
      s: box.querySelector('[data-unit="s"]'),
    };
    box.hidden = false;
    const pad = (n) => String(n).padStart(2, '0');
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

  /* ---------- notify forms ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  document.querySelectorAll('[data-notify]').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const hp = form.querySelector('.hp');
    const btn = form.querySelector('button');
    const msg = form.querySelector('.notify__msg');

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
        form.classList.add('is-done');
        input.value = '';
      } catch (err) {
        say(err.message, true);
      } finally {
        btn.disabled = false;
      }
    });
  });

  /* ---------- subtle parallax on the arch ---------- */
  const art = document.querySelector('.hero__art');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (art && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    window.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        art.style.transform = `translate3d(${x * -8}px, ${y * -8}px, 0)`;
      });
    });
    art.style.transition = 'transform 1.2s cubic-bezier(.22,1,.36,1), opacity 1.1s cubic-bezier(.22,1,.36,1)';
  }
})();
