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

function setExpanded(card, isOpen) {
  card.classList.toggle('is-open', isOpen);
  const btn = card.querySelector('.cs-summary-btn');
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

function closeCard(card) {
  const body = card.querySelector('.cs-body');
  if (!card.classList.contains('is-open') || !body) return;
  if (reduceMotion) { setExpanded(card, false); return; }
  const startHeight = body.scrollHeight;
  body.style.height = startHeight + 'px';
  void body.offsetHeight; // force reflow so the browser commits the start height before animating
  body.style.height = '0px';
  runOnceAfterHeightTransition(body, () => {
    setExpanded(card, false);
    body.style.height = ''; // falls back to the CSS resting height: 0
  });
}

function openCard(card) {
  const body = card.querySelector('.cs-body');
  setExpanded(card, true);
  if (!body || reduceMotion) return;
  const endHeight = body.scrollHeight;
  body.style.height = '0px';
  void body.offsetHeight; // force reflow so the browser commits 0 before animating to endHeight
  body.style.height = endHeight + 'px';
  runOnceAfterHeightTransition(body, () => {
    body.style.height = 'auto'; // content-sized resting state; CSS default (0) would re-collapse it
  });
}

document.querySelectorAll('.case-study-list').forEach(list => {
  const cards = list.querySelectorAll('.case-study-card:not(.cs-pending)');
  cards.forEach(card => {
    const toggle = () => {
      const willOpen = !card.classList.contains('is-open');
      cards.forEach(other => { if (other !== card) closeCard(other); });
      if (willOpen) openCard(card); else closeCard(card);
    };

    const summaryBtn = card.querySelector('.cs-summary-btn');
    summaryBtn.addEventListener('click', toggle);

    const viewBtn = card.querySelector('.cs-view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
      });
    }
  });
});

// Case study service-line filter
const csFilterBtns = document.querySelectorAll('.cs-filter-btn');
const csGroups = document.querySelectorAll('.case-study-group[data-service-group]');

csFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    csFilterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    csGroups.forEach(group => {
      group.hidden = filter !== 'all' && group.dataset.serviceGroup !== filter;
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
