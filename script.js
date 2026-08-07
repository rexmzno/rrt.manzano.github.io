document.getElementById('year').textContent = new Date().getFullYear();

// Header background on scroll + scroll progress bar
const header = document.getElementById('header');
const progressBar = document.getElementById('progress-bar');

function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 20);

  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Reveal-on-scroll animation (with staggered delay for grid children)
const STAGGER_PARENTS = '.solutions-grid, .skills-grid, .cred-grid';
const revealEls = document.querySelectorAll('.reveal');

revealEls.forEach(el => {
  const staggerParent = el.closest(STAGGER_PARENTS);
  if (staggerParent) {
    const siblings = Array.from(staggerParent.children).filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > -1) el.style.transitionDelay = (idx * 70) + 'ms';
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

// Animated stat counters
const statNumbers = document.querySelectorAll('.stat-number');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(progress * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    statObserver.unobserve(el);
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => statObserver.observe(el));

// Case study accordion: smooth height animation, one card open per group
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CS_TRANSITION_MS = 320;

// Runs `cleanup` once, on whichever comes first: the height transitionend, or a
// timeout fallback slightly longer than the CSS transition. Guards against a
// stuck/open-forever card if transitionend never fires for any reason.
function runOnceAfterHeightTransition(body, cleanup) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
  };
  body.addEventListener('transitionend', function handler(e) {
    if (e.propertyName !== 'height') return;
    body.removeEventListener('transitionend', handler);
    finish();
  });
  setTimeout(finish, CS_TRANSITION_MS + 80);
}

function closeCard(card) {
  const body = card.querySelector('.cs-body');
  if (!card.open || !body) return;
  if (reduceMotion) { card.open = false; return; }
  const startHeight = body.scrollHeight;
  body.style.height = startHeight + 'px';
  void body.offsetHeight; // force reflow so the browser commits the start height before animating
  body.style.height = '0px';
  runOnceAfterHeightTransition(body, () => {
    card.open = false;
    body.style.height = '';
  });
}

function openCard(card) {
  const body = card.querySelector('.cs-body');
  card.open = true;
  if (!body || reduceMotion) return;
  const endHeight = body.scrollHeight;
  body.style.height = '0px';
  void body.offsetHeight; // force reflow so the browser commits 0 before animating to endHeight
  body.style.height = endHeight + 'px';
  runOnceAfterHeightTransition(body, () => {
    body.style.height = '';
  });
}

document.querySelectorAll('.case-study-list').forEach(list => {
  const cards = list.querySelectorAll('details.case-study-card');
  cards.forEach(card => {
    const summary = card.querySelector('summary');
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const willOpen = !card.open;
      cards.forEach(other => { if (other !== card) closeCard(other); });
      if (willOpen) openCard(card); else closeCard(card);
    });
  });
});

// Active-section nav highlighting
const navAnchorLinks = Array.from(navLinks.querySelectorAll('a[href^="#"]'));
const trackedSections = navAnchorLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const activeNavObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const link = navAnchorLinks.find(a => a.getAttribute('href') === '#' + entry.target.id);
    if (!link) return;
    if (entry.isIntersecting) {
      navAnchorLinks.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    }
  });
}, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

trackedSections.forEach(section => activeNavObserver.observe(section));
