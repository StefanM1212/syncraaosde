/* ══════════════════════════════════════════
   SyncraOS.io — Script
══════════════════════════════════════════ */


/* ── Counter 0 → 110 ── */
const counterEl = document.getElementById('counter');
let started = false;

function runCounter() {
  if (started || !counterEl) return;
  started = true;
  const duration = 2400;
  const target = 110;
  let startTs = null;
  requestAnimationFrame(function tick(now) {
    if (startTs === null) startTs = now;
    const progress = Math.min((now - startTs) / duration, 1);
    // sanftes easeOutQuad — gleichmäßig flüssig, ohne hartes Abbremsen am Ende
    const ease = 1 - (1 - progress) * (1 - progress);
    counterEl.textContent = Math.round(ease * target);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      counterEl.textContent = target; // sauberer Endwert, bleibt stehen
    }
  });
}

if (counterEl) {
  const observer = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { runCounter(); observer.disconnect(); }
  }, { threshold: 0.5 });
  observer.observe(counterEl);
  // Fallback: Hero ist beim Laden ohnehin sichtbar — falls der Observer
  // (z. B. bei sehr großer Headline) nicht auslöst, trotzdem starten.
  window.addEventListener('load', () => { if (!started) runCounter(); });
}

/* ── Comparison Section — Choreographie ── */
const compSection = document.querySelector('.comparison');
if (compSection) {
  const compObs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    const tools = compSection.querySelectorAll('.tool-card');
    tools.forEach((t, i) => {
      t.style.animationDelay = `${i * 110}ms`;
      t.classList.add('fly-in');
    });
    setTimeout(() => compSection.querySelector('.syncra-card').classList.add('reveal'), 1200);
    setTimeout(() => compSection.querySelector('.alles-weg').classList.add('show'), 1600);
    setTimeout(() => compSection.querySelector('.tools-stack').classList.add('dimmed'), 2000);
    compObs.disconnect();
  }, { threshold: 0.25 });
  compObs.observe(compSection);
}

/* ── More Features — fly-in beim Scrollen ── */
const moreFeats = document.querySelectorAll('.more-feat-card');
const moreObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animationDelay = `${i * 60}ms`;
      entry.target.classList.add('fly-in');
      moreObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
moreFeats.forEach(c => moreObs.observe(c));

/* ── Feature Tabs (with lazy video loading + Vorladen) ── */

// Quelle zuweisen + im Hintergrund puffern, OHNE abzuspielen.
// So liegt das Video beim Tab-Klick schon (teilweise) im Cache → fühlt sich instant an.
function preloadLazyVideo(panel) {
  const v = panel && panel.querySelector('video[data-lazy-video]');
  if (!v || v.dataset.loaded) return;
  v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; });
  v.preload = 'auto';
  v.load();
  v.dataset.loaded = '1';
}

function activateLazyVideo(panel) {
  const v = panel.querySelector('video[data-lazy-video]');
  if (!v) return;
  preloadLazyVideo(panel);   // falls noch nicht geschehen
  v.play().catch(() => {});
}

function panelFor(idx) {
  return document.querySelector(`.feat-panel[data-panel="${idx}"]`);
}

function pauseAllPanelVideos(except) {
  document.querySelectorAll('.feat-panel video').forEach(v => {
    if (v !== except) v.pause();
  });
}

document.querySelectorAll('.feat-tab').forEach(tab => {
  // Bei Hover / Fokus / Touch schon mit dem Laden anfangen,
  // bevor überhaupt geklickt wird.
  const warm = () => preloadLazyVideo(panelFor(tab.dataset.tab));
  tab.addEventListener('mouseenter', warm, { passive: true });
  tab.addEventListener('focus', warm);
  tab.addEventListener('touchstart', warm, { passive: true });

  tab.addEventListener('click', () => {
    const idx = tab.dataset.tab;
    document.querySelectorAll('.feat-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.feat-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = panelFor(idx);
    panel.classList.add('active');
    const newVideo = panel.querySelector('video');
    pauseAllPanelVideos(newVideo);
    activateLazyVideo(panel);
  });
});

// Sobald der Feature-Bereich in den Viewport scrollt, alle Tab-Videos
// im Leerlauf gestaffelt vorladen — kleinste zuerst, damit die Leitung
// nicht von den großen (WhatsApp/E-Mail) blockiert wird.
(function preloadOnView() {
  const section = document.getElementById('features');
  if (!section) return;
  const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1));
  const order = ['2', '4', '3', '5', '0', '1']; // klein → groß
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    order.forEach((idx, i) => {
      setTimeout(() => idle(() => preloadLazyVideo(panelFor(idx))), i * 600);
    });
  }, { threshold: 0.1 });
  obs.observe(section);
})();

/* ── VSL Hero Video (YouTube — lädt erst beim Klick) ── */
const vslFrame = document.getElementById('vslFrame');

if (vslFrame && vslFrame.dataset.yt) {
  let vslLoaded = false;
  const startVsl = () => {
    if (vslLoaded) return;
    vslLoaded = true;
    const id = vslFrame.dataset.yt;
    const iframe = document.createElement('iframe');
    iframe.className = 'vsl-video';
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.title = 'SyncraOS VSL';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('frameborder', '0');
    vslFrame.innerHTML = '';
    vslFrame.appendChild(iframe);
    vslFrame.classList.add('is-playing');
    vslFrame.removeAttribute('role');
    vslFrame.removeAttribute('tabindex');
  };
  vslFrame.addEventListener('click', startVsl);
  vslFrame.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startVsl(); }
  });
}

/* ── Done-4-You Toggle ── */
const addonToggle = document.getElementById('addonToggle');
const addonBanner = document.getElementById('done4you');
const addonLabel  = document.querySelector('.addon-toggle-label');

if (addonToggle && addonBanner && addonLabel) {
  addonToggle.addEventListener('click', () => {
    const isOn = addonToggle.getAttribute('aria-checked') === 'true';
    const next = !isOn;
    addonToggle.setAttribute('aria-checked', String(next));
    addonBanner.classList.toggle('is-on', next);
    addonLabel.textContent = next ? 'Aktiviert · 1.000 €/User' : 'Schalter umlegen';
  });
}

/* ── Header scroll class ── */
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Datenschutz / Cookie Banner ── */
(function () {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  const KEY = 'syncra_consent';
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (!stored) banner.hidden = false;

  const decide = (value) => {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    banner.hidden = true;
  };
  const accept  = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  if (accept)  accept.addEventListener('click',  () => decide('all'));
  if (decline) decline.addEventListener('click', () => decide('necessary'));
})();


