// Scroll reveal using IntersectionObserver
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  if (revealEls.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // reveal once
      }
    }
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.12,
  });

  // Observe elements and apply optional per-element delay via data attribute
  revealEls.forEach((el) => {
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) el.style.transitionDelay = delay;
    observer.observe(el);
  });
})();

