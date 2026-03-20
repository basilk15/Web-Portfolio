document.documentElement.classList.add('js-enabled');

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;

  const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
  const chapterTitles = Array.from(document.querySelectorAll('.chapter-title'));
  const beats = Array.from(document.querySelectorAll('[data-beat]'));
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const navShell = document.querySelector('[data-nav-shell]');
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
  const navSections = Array.from(document.querySelectorAll('[data-nav-section]'));

  const setGlowFromLink = (link) => {
    if (!navShell || !link) return;
    const shellRect = navShell.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const center = linkRect.left + linkRect.width / 2 - shellRect.left;
    navShell.style.setProperty('--glow-x', `${center}px`);
  };

  const activateNavLink = (id) => {
    if (!navLinks.length) return;
    let activeLink = null;

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) activeLink = link;
    });

    if (activeLink) {
      setGlowFromLink(activeLink);
      activeLink.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  const revealAll = () => {
    chapterTitles.forEach((title) => {
      title.classList.add('section-zoom');
      title.classList.add('is-visible');
    });
    reveals.forEach((el) => el.classList.add('is-visible'));
    chapters.forEach((chapter) => chapter.style.setProperty('--p', 1));
    if (navSections.length) {
      activateNavLink(navSections[0].id);
    }
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

  if (navShell && navLinks.length && navSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        activateNavLink(visible[0].target.id);
      }
    }, {
      root: null,
      rootMargin: '-18% 0px -55% 0px',
      threshold: [0.2, 0.35, 0.55, 0.75],
    });

    navSections.forEach((section) => sectionObserver.observe(section));

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const targetId = link.getAttribute('href').slice(1);
        activateNavLink(targetId);
      });
    });

    navShell.addEventListener('pointermove', (event) => {
      const rect = navShell.getBoundingClientRect();
      navShell.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
    });

    navShell.addEventListener('pointerleave', () => {
      const activeLink = navLinks.find((link) => link.classList.contains('is-active')) || navLinks[0];
      setGlowFromLink(activeLink);
    });
  }

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
  if (navLinks.length) {
    const initialSection = navSections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top >= 0;
    }) || navSections[0];

    if (initialSection) {
      activateNavLink(initialSection.id);
    }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener('change', requestTick);
  } else {
    desktopMedia.addListener(requestTick);
  }
  window.addEventListener('resize', () => {
    const activeLink = navLinks.find((link) => link.classList.contains('is-active')) || navLinks[0];
    setGlowFromLink(activeLink);
  });
})();
