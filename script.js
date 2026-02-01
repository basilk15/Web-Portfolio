document.documentElement.classList.add('js-enabled');

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;

  const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
  const chapterTitles = Array.from(document.querySelectorAll('.chapter-title'));
  const beats = Array.from(document.querySelectorAll('[data-beat]'));
  const reveals = Array.from(document.querySelectorAll('.reveal'));

  const revealAll = () => {
    chapterTitles.forEach((title) => {
      title.classList.add('section-zoom');
      title.classList.add('is-visible');
    });
    reveals.forEach((el) => el.classList.add('is-visible'));
    chapters.forEach((chapter) => chapter.style.setProperty('--p', 1));
  };

  if (reduce || !supportsObserver) {
    revealAll();
    return;
  }

  chapterTitles.forEach((title) => title.classList.add('section-zoom'));

  const titleObserver = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    }
  }, {
    root: null,
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.2,
  });

  chapterTitles.forEach((title) => titleObserver.observe(title));

  const revealBeat = (beat) => {
    const items = Array.from(beat.querySelectorAll('.reveal'));
    const baseDelay = 80;
    const step = 90;
    const maxDelay = 420;

    items.forEach((el, index) => {
      const delay = Math.min(baseDelay + index * step, maxDelay);
      el.style.transitionDelay = `${delay}ms`;
      el.classList.add('is-visible');
    });
  };

  const beatObserver = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        revealBeat(entry.target);
        obs.unobserve(entry.target);
      }
    }
  }, {
    root: null,
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.25,
  });

  beats.forEach((beat) => beatObserver.observe(beat));

  const genericReveals = reveals.filter((el) => !el.closest('[data-beat]'));
  if (genericReveals.length) {
    const genericObserver = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    }, {
      root: null,
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.15,
    });

    genericReveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(60 + index * 60, 300)}ms`;
      genericObserver.observe(el);
    });
  }

  const desktopMedia = window.matchMedia('(min-width: 901px)');
  let ticking = false;

  const updateProgress = () => {
    if (!desktopMedia.matches) {
      chapters.forEach((chapter) => chapter.style.setProperty('--p', 0));
      return;
    }

    const view = window.innerHeight || document.documentElement.clientHeight;
    chapters.forEach((chapter) => {
      const rect = chapter.getBoundingClientRect();
      const total = rect.height + view;
      const passed = view - rect.top;
      const progress = Math.min(1, Math.max(0, passed / total));
      chapter.style.setProperty('--p', progress.toFixed(3));
    });
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
    }
  };

  updateProgress();
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener('change', requestTick);
  } else {
    desktopMedia.addListener(requestTick);
  }
})();
