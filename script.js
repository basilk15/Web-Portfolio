// Scroll reveal and chapter interactions
(function () {
  const root = document.documentElement;
  root.classList.add('js-enabled');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsIO = 'IntersectionObserver' in window;

  const revealAll = () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('.chapter-title').forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('[data-chapter]').forEach((chapter) => {
      chapter.style.setProperty('--p', 1);
    });
  };

  if (reduce || !supportsIO) {
    revealAll();
    return;
  }

  const beats = Array.from(document.querySelectorAll('[data-beat]'));
  const beatObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const beat = entry.target;
      const items = Array.from(beat.querySelectorAll('.reveal'));
      items.forEach((item, index) => {
        const delay = Math.min(index * 90, 360);
        item.style.transitionDelay = `${delay}ms`;
        item.classList.add('is-visible');
      });
      obs.unobserve(beat);
    });
  }, { threshold: 0.25 });

  beats.forEach((beat) => beatObserver.observe(beat));

  const chapterTitles = Array.from(document.querySelectorAll('[data-chapter] .chapter-title'));
  const chapterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.55 });

  chapterTitles.forEach((title) => chapterObserver.observe(title));

  const revealEls = Array.from(document.querySelectorAll('.reveal')).filter(
    (el) => !el.closest('[data-beat]')
  );
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach((el) => {
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) el.style.transitionDelay = delay;
    revealObserver.observe(el);
  });

  const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  let ticking = false;

  const updateProgress = () => {
    ticking = false;
    if (!desktopQuery.matches) return;
    const vh = window.innerHeight || 1;
    chapters.forEach((chapter) => {
      const rect = chapter.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      chapter.style.setProperty('--p', progress.toFixed(3));
    });
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  };

  if (desktopQuery.matches) {
    updateProgress();
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
})();
