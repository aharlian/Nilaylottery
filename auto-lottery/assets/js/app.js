// Neon animated background, carousel, countdown, stats counters, join modal + confetti

(function () {
  'use strict';

  // Utils
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(n, b));
  const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Year
  $('#year').textContent = String(new Date().getFullYear());

  // Animated Background Canvas
  const bg = $('#bg-canvas');
  const ctx = bg.getContext('2d');
  let W, H, DPR;
  function resizeCanvas() {
    DPR = clamp(Math.round(window.devicePixelRatio || 1), 1, 2);
    W = bg.width = Math.floor(innerWidth * DPR);
    H = bg.height = Math.floor(innerHeight * DPR);
    bg.style.width = innerWidth + 'px';
    bg.style.height = innerHeight + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Neon particles
  const particles = [];
  const PARTICLE_COUNT = 140;
  function spawnParticle(i) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(W, H) * 0.45;
    const cx = W * 0.5 + Math.cos(angle) * radius * 0.15;
    const cy = H * 0.5 + Math.sin(angle) * radius * 0.15;
    return {
      id: i,
      x: cx,
      y: cy,
      vx: Math.cos(angle) * (0.5 + Math.random() * 1.4),
      vy: Math.sin(angle) * (0.5 + Math.random() * 1.4),
      life: 0,
      ttl: 600 + Math.random() * 800,
      hue: Math.random() * 360,
    };
  }
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(spawnParticle(i));

  function drawBackground(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (let p of particles) {
      p.life++;
      p.x += p.vx * 0.8;
      p.y += p.vy * 0.8;
      p.vx += Math.sin((p.y + t * 0.06) * 0.003) * 0.15;
      p.vy += Math.cos((p.x + t * 0.05) * 0.003) * 0.15;
      const alpha = 0.08 + 0.08 * Math.sin((p.life + p.id) * 0.04);
      const size = 1 + (p.life % 50) * 0.08;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 12);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${alpha})`);
      grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 8, 0, Math.PI * 2);
      ctx.fill();
      if (p.life > p.ttl || p.x < -50 || p.x > W + 50 || p.y < -50 || p.y > H + 50) {
        Object.assign(p, spawnParticle(p.id));
      }
    }

    // Neon sweep lines
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 6; i++) {
      const y = ((t * 0.06 + i * 200) % (H + 200)) - 200;
      const g = ctx.createLinearGradient(0, y, W, y + 0);
      g.addColorStop(0, 'rgba(0,229,255,0)');
      g.addColorStop(0.5, 'rgba(124,77,255,0.32)');
      g.addColorStop(1, 'rgba(255,59,167,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, W, 2);
    }
    ctx.globalAlpha = 1;
  }

  let start;
  function loop(ts) {
    if (!start) start = ts;
    const t = ts - start;
    drawBackground(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Countdown to next Friday 20:00 Asia/Tehran
  function nextFriday20() {
    const now = new Date();
    const d = new Date(now);
    const day = now.getDay(); // 0=Sun ... 5=Fri
    const daysToFri = (5 - day + 7) % 7 || 7; // always future Friday
    d.setDate(now.getDate() + daysToFri);
    d.setHours(20, 0, 0, 0);
    return d;
  }
  const target = nextFriday20();
  const cdEls = {
    d: $('#cd-days'),
    h: $('#cd-hours'),
    m: $('#cd-mins'),
    s: $('#cd-secs'),
  };
  function updateCountdown() {
    const now = new Date();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 24 * 60 * 60 * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 60 * 60 * 1000;
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * 60 * 1000;
    const secs = Math.floor(diff / 1000);
    cdEls.d.textContent = String(days).padStart(2, '0');
    cdEls.h.textContent = String(hours).padStart(2, '0');
    cdEls.m.textContent = String(mins).padStart(2, '0');
    cdEls.s.textContent = String(secs).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Stats counters
  const counters = $$('.stat-value');
  function animateCounter(el) {
    const target = Number(el.dataset.target || '0');
    const duration = 1600 + Math.random() * 800;
    const start = performance.now();
    function tick(ts) {
      const p = clamp((ts - start) / duration, 0, 1);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const value = Math.floor(target * eased);
      el.textContent = formatNumber(value);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach((el) => io.observe(el));

  // Carousel coverflow
  const track = $('#carTrack');
  const cards = $$('.car-card', track);
  let active = 2;
  function layout() {
    cards.forEach((card, i) => {
      const d = i - active;
      const z = 100 - Math.abs(d) * 10;
      const r = clamp(d * -12, -25, 25);
      const s = 1 - Math.min(Math.abs(d) * 0.1, 0.4);
      const x = d * 160;
      card.style.transform = `translate3d(${x}px, ${Math.abs(d) * 10}px, ${-Math.abs(d) * 120}px) rotateY(${r}deg) scale(${s})`;
      card.style.zIndex = String(z);
      card.style.filter = `blur(${Math.max(0, Math.abs(d) * 0.4 - 0.2)}px)`;
      card.style.opacity = String(1 - Math.min(Math.abs(d) * 0.22, 0.55));
    });
  }
  layout();
  $('#carPrev').addEventListener('click', () => { active = clamp(active - 1, 0, cards.length - 1); layout(); });
  $('#carNext').addEventListener('click', () => { active = clamp(active + 1, 0, cards.length - 1); layout(); });

  // Modal join flow
  const joinModal = $('#joinModal');
  const openers = ['#openJoin', '#joinNow'].map((s) => $(s)).filter(Boolean);
  const closers = $$('[data-close]', joinModal);
  const form = $('#joinForm');
  const amount = form.querySelector('input[name="amount"]');
  const amountValue = $('#amountValue');
  const formMsg = $('#formMsg');
  const payBtn = $('#payBtn');

  function openModal() {
    joinModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    joinModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  openers.forEach((el) => el && el.addEventListener('click', openModal));
  closers.forEach((el) => el.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close') || e.currentTarget === el) closeModal(); }));

  amount.addEventListener('input', () => { amountValue.textContent = formatNumber(Number(amount.value)); });
  amount.dispatchEvent(new Event('input'));

  // Confetti
  const confetti = $('#confetti');
  const cctx = confetti.getContext('2d');
  function resizeConfetti() {
    const dpr = clamp(Math.round(window.devicePixelRatio || 1), 1, 2);
    confetti.width = Math.floor(innerWidth * dpr);
    confetti.height = Math.floor(innerHeight * dpr);
    confetti.style.width = innerWidth + 'px';
    confetti.style.height = innerHeight + 'px';
  }
  resizeConfetti();
  window.addEventListener('resize', resizeConfetti);

  function fireConfetti() {
    const pieces = Array.from({ length: 180 }).map(() => ({
      x: Math.random() * confetti.width,
      y: -20,
      r: 4 + Math.random() * 6,
      c: `hsl(${Math.random() * 360}, 100%, ${50 + Math.random() * 20}%)`,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      va: -0.1 + Math.random() * 0.2,
      a: Math.random() * Math.PI * 2,
    }));
    let running = true;
    function draw() {
      if (!running) return;
      cctx.clearRect(0, 0, confetti.width, confetti.height);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.a);
        cctx.fillStyle = p.c;
        cctx.fillRect(-p.r * 0.5, -p.r * 0.5, p.r, p.r * 1.6);
        cctx.restore();
      });
      if (pieces[0].y < confetti.height + 40) requestAnimationFrame(draw); else running = false;
    }
    requestAnimationFrame(draw);
  }

  // Simulated payment
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formMsg.textContent = '';
    const phone = form.phone.value.trim();
    const agree = form.agree.checked;
    if (!/^0?9\d{9}$/.test(phone)) {
      formMsg.textContent = 'شماره موبایل معتبر وارد کنید.';
      return;
    }
    if (!agree) {
      formMsg.textContent = 'لطفاً قوانین را بپذیرید.';
      return;
    }
    payBtn.disabled = true; payBtn.textContent = 'در حال پردازش...';
    setTimeout(() => {
      const ok = Math.random() < 0.88; // 88% success
      if (ok) {
        formMsg.textContent = 'پرداخت موفق! کد شرکت برای شما ارسال شد.';
        fireConfetti();
        closeModal();
      } else {
        formMsg.textContent = 'پرداخت ناموفق بود. دوباره تلاش کنید.';
      }
      payBtn.disabled = false; payBtn.textContent = 'پرداخت و دریافت شانس';
    }, 1200 + Math.random() * 800);
  });
})();

