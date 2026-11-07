/* 연과 도깨비불 — 랜딩 v0.1 스크립트 (의존성 없음) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /* ---------- 첫 화면 인트로 시네마틱 ----------
     대작 게임 사이트처럼 들어오자마자 전체 화면 영상.
     브라우저는 소리 있는 자동 재생을 막으므로 '소리 없이 자동 재생 + 소리 켜기 버튼'.
     한 번 본(또는 건너뛴) 탭에선 다시 안 띄움. 움직임 줄이기 설정이면 자동 재생 안 함. */
  const intro = document.getElementById('intro');
  if (intro) {
    const v = intro.querySelector('video');
    const btnSound = intro.querySelector('[data-intro-sound]');
    const btnSkip = intro.querySelector('[data-intro-skip]');
    const btnPlay = intro.querySelector('[data-intro-play]');
    const bar = intro.querySelector('.intro-bar i');
    const params = new URLSearchParams(location.search);
    const force = params.has('intro');
    const skipNow = params.has('nointro') || (!force && store.get('kw_intro_seen'));

    const close = () => {
      if (intro.hidden) return;
      store.set('kw_intro_seen', '1');
      intro.classList.add('leaving');
      v.pause();
      document.documentElement.classList.remove('intro-open');
      setTimeout(() => { intro.hidden = true; intro.classList.remove('leaving', 'paused'); }, reduce ? 0 : 900);
      const h = document.getElementById('hero-title'); if (h) h.setAttribute('tabindex', '-1'), h.focus({ preventScroll: true });
    };
    const open = (fromUser) => {
      intro.hidden = false;
      document.documentElement.classList.add('intro-open');
      v.currentTime = 0;
      if (fromUser) { v.muted = false; btnSound.setAttribute('aria-pressed', 'true'); }
      const p = v.play();
      if (p && p.catch) p.catch(() => intro.classList.add('paused'));
      btnSkip.focus({ preventScroll: true });
    };

    if (skipNow) { intro.hidden = true; }
    else if (reduce) { intro.hidden = false; document.documentElement.classList.add('intro-open'); intro.classList.add('paused'); btnPlay.focus(); }
    else { open(false); }

    btnSkip.addEventListener('click', close);
    btnPlay.addEventListener('click', () => { intro.classList.remove('paused'); v.muted = false; btnSound.setAttribute('aria-pressed', 'true'); v.play(); });
    btnSound.addEventListener('click', () => {
      v.muted = !v.muted;
      btnSound.setAttribute('aria-pressed', String(!v.muted));
      if (v.paused) { intro.classList.remove('paused'); v.play(); }
    });
    v.addEventListener('ended', close);
    v.addEventListener('timeupdate', () => { if (bar && v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`; });
    document.addEventListener('keydown', e => { if (!intro.hidden && e.key === 'Escape') close(); });
    document.querySelectorAll('[data-replay-intro]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(true); }));
  }

  /* ---------- 모바일 메뉴 ---------- */
  const tg = document.querySelector('.nav-toggle'), nav = document.getElementById('nav');
  if (tg && nav) {
    tg.addEventListener('click', () => { const o = nav.classList.toggle('open'); tg.setAttribute('aria-expanded', String(o)); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- 먹물 안개 걷힘 ---------- */
  const inks = document.querySelectorAll('.ink');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { threshold: 0.25 });
    inks.forEach(el => io.observe(el));
  } else inks.forEach(el => el.classList.add('seen'));

  /* ---------- 스크린샷: 원본 크기 이상일 때만 도트를 또렷하게 ---------- */
  const main = document.getElementById('shot-main'), cap = document.getElementById('shot-cap');
  const crisp = () => { if (main) main.classList.toggle('crisp', main.clientWidth * devicePixelRatio >= main.naturalWidth - 1); };
  if (main) {
    addEventListener('resize', crisp); main.addEventListener('load', crisp);
    document.querySelectorAll('.shots-thumbs button').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('.shots-thumbs button').forEach(x => x.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
      main.src = b.dataset.src; main.alt = b.dataset.alt; cap.textContent = b.dataset.cap;
    }));
  }

  /* ---------- 커서를 따라오는 도깨비불 (마우스 기기만) ---------- */
  const w = document.querySelector('.cursor-wisp');
  if (w && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = -100, ty = -100, x = -100, y = -100, last = 0, raf = 0;
    const step = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      const t = performance.now();
      w.style.transform = `translate(${x + 18}px, ${y + 14 + Math.sin(t / 380) * 3}px)`;
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) ? requestAnimationFrame(step) : (requestAnimationFrame(idle), 0);
    };
    const idle = () => { if (!raf) { w.style.transform = `translate(${x + 18}px, ${y + 14 + Math.sin(performance.now() / 380) * 3}px)`; requestAnimationFrame(idle); } };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY; w.classList.add('on');
      if (!raf) raf = requestAnimationFrame(step);
      const now = performance.now();
      if (now - last > 70) { last = now; spark(x + 18, y + 14); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => w.classList.remove('on'));
    function spark(px, py) {
      const s = document.createElement('i'); s.className = 'cursor-spark';
      s.style.left = px + 'px'; s.style.top = py + 'px';
      s.style.setProperty('--dx', (Math.random() * 16 - 8).toFixed(1) + 'px');
      s.style.setProperty('--dy', (-8 - Math.random() * 14).toFixed(1) + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 720);
    }
  }
})();
