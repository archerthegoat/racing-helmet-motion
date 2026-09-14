import {createPortraitRenderer} from '../reference-renderer/portrait-renderer.js';

const root = document.querySelector('[data-helmet-portrait]');
if (root) {
  const canvas = root.querySelector('canvas');
  const stage = root.querySelector('[data-portrait-stage]');
  const fallback = root.querySelector('[data-portrait-fallback]');
  const pause = root.querySelector('[data-portrait-pause]');
  const demo = root.querySelector('[data-portrait-demo]');
  const full = root.querySelector('[data-portrait-full]');
  const status = root.querySelector('[data-portrait-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const asset = key => new URL(root.dataset[key], document.baseURI).href;
  let manualPaused = false;
  let offscreen = false;
  let fullVisible = false;

  const instance = createPortraitRenderer(canvas, {
    stage,
    photo: asset('photo'),
    helmet: asset('helmet'),
    ghost: asset('ghost'),
    onStatus(value) {
      const ready = value === 'ready';
      canvas.classList.toggle('is-ready', ready);
      fallback.hidden = ready;
      if (value === 'fallback') {
        status.hidden = false;
        pause.hidden = true;
        demo.hidden = true;
        full.hidden = true;
        stage.removeAttribute('tabindex');
      }
    },
    onHelmet(value) { if (value === 'fallback') full.hidden = true; },
    onGhost() {},
    onDemo() {},
    onFull(value) {
      fullVisible = value;
      full?.setAttribute('aria-pressed', String(value));
    }
  });

  const suspended = () => document.hidden || offscreen || !!document.querySelector('dialog[open]');
  function sync() {
    instance.setReduced(reduced.matches);
    instance.setEnabled(!manualPaused && !suspended());
    pause?.setAttribute('aria-pressed', String(manualPaused));
    pause?.setAttribute('aria-label', manualPaused ? '开启人像动效' : '暂停人像动效');
  }

  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  }

  root.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') instance.setPointerInside(true);
  });
  root.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' && !event.target.closest('a,button')) instance.aim(...position(event));
  });
  root.addEventListener('pointerleave', () => instance.setPointerInside(false));
  stage.addEventListener('pointerdown', event => instance.pulse(...position(event)));
  stage.addEventListener('focus', () => instance.setFocused(true));
  stage.addEventListener('blur', () => instance.setFocused(false));
  stage.addEventListener('keydown', event => {
    const poses = {ArrowLeft: [.2, .4], ArrowRight: [.8, .4], ArrowUp: [.5, .2], ArrowDown: [.5, .65]};
    if (poses[event.key]) {
      event.preventDefault();
      instance.aim(...poses[event.key]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      instance.playDemo();
    } else if (event.key === 'Escape') instance.reset();
  });

  pause?.addEventListener('click', () => { manualPaused = !manualPaused; sync(); });
  demo?.addEventListener('click', () => instance.playDemo());
  full?.addEventListener('click', () => instance.setFull(!fullVisible));
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(sync).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['open']});
  new IntersectionObserver(([entry]) => { offscreen = !entry.isIntersecting; sync(); }, {rootMargin: '100px'}).observe(root);
  addEventListener('pagehide', () => instance.setEnabled(false));
  addEventListener('pageshow', sync);
  fallback.addEventListener('error', () => { status.hidden = false; });
  sync();
}
