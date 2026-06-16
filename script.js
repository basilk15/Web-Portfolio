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
  const navItems = Array.from(document.querySelectorAll('[data-nav-item]'));
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');
  const subnavLinks = Array.from(document.querySelectorAll('[data-subnav-link]'));
  const certSliders = Array.from(document.querySelectorAll('[data-cert-slider]'));
  const projectSections = ['academic-projects', 'side-projects']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navSectionIds = new Set(navSections.map((section) => section.id));
  let activeNavId = '';
  let activeSubnavId = '';

  const getHashTarget = (value) => {
    if (!value) return '';
    const hashIndex = value.indexOf('#');
    return hashIndex >= 0 ? value.slice(hashIndex + 1) : '';
  };

  const getPrimaryTarget = (link) => link.dataset.navTarget || getHashTarget(link.getAttribute('href'));

  const setupCertificationSliders = () => {
    certSliders.forEach((slider) => {
      const track = slider.querySelector('.cert-list');
      if (!track || track.dataset.cloned === 'true') return;

      Array.from(track.children).forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button').forEach((control) => {
          control.setAttribute('tabindex', '-1');
        });
        track.appendChild(clone);
      });

      track.dataset.cloned = 'true';
    });
  };

  setupCertificationSliders();

  const setGlowFromLink = (link) => {
    if (!navShell || !link) return;
    const shellRect = navShell.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const center = linkRect.left + linkRect.width / 2 - shellRect.left;
    navShell.style.setProperty('--glow-x', `${center}px`);
  };

  const activateNavLink = (id) => {
    if (!navLinks.length || !id || activeNavId === id) return;
    let activeLink = null;

    navLinks.forEach((link) => {
      const isActive = getPrimaryTarget(link) === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) activeLink = link;
    });

    if (activeLink) {
      activeNavId = id;
      setGlowFromLink(activeLink);
      activeLink.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  const activateSubnavLink = (id) => {
    if (!subnavLinks.length || !id || activeSubnavId === id) return;
    subnavLinks.forEach((link) => {
      const target = link.dataset.subnavTarget || getHashTarget(link.getAttribute('href'));
      link.classList.toggle('is-active', target === id);
    });
    activeSubnavId = id;
  };

  const syncHashTarget = () => {
    const hashTarget = window.location.hash.slice(1);
    if (!hashTarget) return;

    if (projectSections.some((section) => section.id === hashTarget)) {
      activateNavLink('projects');
      activateSubnavLink(hashTarget);
      return;
    }

    if (navSectionIds.has(hashTarget)) {
      activateNavLink(hashTarget);
    }
  };

  const getSectionAnchorLine = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return Math.max(140, Math.min(viewportHeight * 0.34, viewportHeight * 0.5));
  };

  const getActiveSection = (sections) => {
    if (!sections.length) return null;

    const anchor = window.scrollY + getSectionAnchorLine();
    let activeSection = sections[0];

    for (const section of sections) {
      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      if (sectionTop <= anchor) {
        activeSection = section;
      } else {
        break;
      }
    }

    return activeSection;
  };

  const syncActiveNavigation = () => {
    const activeSection = getActiveSection(navSections);
    if (activeSection) {
      activateNavLink(activeSection.id);
    }

    if (projectSections.length) {
      const hashTarget = window.location.hash.slice(1);
      const matchingProjectSection = projectSections.find((section) => section.id === hashTarget);
      const activeProjectSection = matchingProjectSection || getActiveSection(projectSections);
      if (activeProjectSection) {
        activateSubnavLink(activeProjectSection.id);
      }
    }
  };

  const setMenuOpen = (open) => {
    const item = navToggle ? navToggle.closest('[data-nav-item]') : null;
    if (!navToggle || !item) return;
    item.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const closeMenus = () => {
    navItems.forEach((item) => item.classList.remove('is-open'));
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
    }
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const item = navToggle.closest('[data-nav-item]');
      const willOpen = !item.classList.contains('is-open');
      closeMenus();
      setMenuOpen(willOpen);
      activateNavLink('projects');
    });

    navToggle.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMenuOpen(true);
        if (subnavLinks[0]) subnavLinks[0].focus();
      }
    });

    subnavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        activateNavLink('projects');
        activateSubnavLink(link.dataset.subnavTarget || getHashTarget(link.getAttribute('href')));
        closeMenus();
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-nav-item]')) {
        closeMenus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenus();
      }
    });
  }

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
    if (projectSections.length) {
      activateSubnavLink(projectSections[0].id);
    }
  };

  if (reduce || !supportsObserver) {
    revealAll();
  } else {
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

  if (navShell && navLinks.length) {
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const targetId = getPrimaryTarget(link);
        activateNavLink(targetId);
        if (!link.hasAttribute('data-nav-toggle')) {
          closeMenus();
        }
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
        syncActiveNavigation();
        ticking = false;
      });
    }
  };

  updateProgress();
  syncActiveNavigation();
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  window.addEventListener('hashchange', () => {
    syncHashTarget();
    window.setTimeout(requestTick, 300);
  });
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
