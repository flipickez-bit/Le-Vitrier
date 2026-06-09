/* ================================================================
   LE VITRIER — script.js
   Taste-Skill: Pure vanilla JS, zero dependencies
   MOTION_INTENSITY 6 — spring physics via CSS cubic-bezier
   ================================================================ */

(function () {
  'use strict';

  /* ── 1. SCROLL REVEAL ──────────────────────────────────────────
     Intersection Observer adds .revealed to .reveal elements.
     Stagger is handled by CSS --i custom property.
  ───────────────────────────────────────────────────────────────── */
  function initReveal() {
    var targets = document.querySelectorAll(
      '.quick-card, .sf-block, .contact-btn, .ba, .contact-block__title, .contact-block__sub'
    );

    targets.forEach(function (el) {
      el.classList.add('reveal');
      var parent = el.closest('.quick-grid, .contact-grid');
      if (parent) {
        var cls      = el.className.split(' ')[0];
        var siblings = parent.querySelectorAll('.' + cls);
        var i        = Array.from(siblings).indexOf(el);
        el.style.setProperty('--i', i);
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px 60px 0px' }
    );

    targets.forEach(function (el) { io.observe(el); });

    /* Fallback : révèle tout après 1.5s si jamais l'observer rate */
    setTimeout(function () {
      targets.forEach(function (el) {
        el.classList.add('revealed');
      });
    }, 1500);
  }


  /* ── 2. CARD SPOTLIGHT ────────────────────────────────────────
     Mouse tracking: updates --mouse-x/y for spotlight radial.
     3D rotation REMOVED (was causing hero to show through cards).
     Pure spotlight effect only — no perspective transforms.
  ───────────────────────────────────────────────────────────────── */
  function initCardSpotlight() {
    document.querySelectorAll('.card').forEach(function (card) {
      var rafId = null;

      card.addEventListener('mousemove', function (e) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
          var r    = card.getBoundingClientRect();
          var x    = e.clientX - r.left;
          var y    = e.clientY - r.top;
          var pctX = ((x / r.width)  * 100).toFixed(1);
          var pctY = ((y / r.height) * 100).toFixed(1);

          card.style.setProperty('--mouse-x', pctX + '%');
          card.style.setProperty('--mouse-y', pctY + '%');
        });
      });

      card.addEventListener('mouseleave', function () {
        if (rafId) cancelAnimationFrame(rafId);
        /* reset spotlight to center */
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      });
    });
  }


  /* ── 3. AMBIENT CURSOR GLOW ───────────────────────────────────
     Smooth lagged radial that trails the cursor across the page.
     Uses lerp (linear interpolation) for the premium trailing feel.
     Completely isolated from React render cycle (pure DOM).
  ───────────────────────────────────────────────────────────────── */
  function initCursorGlow() {
    var glow = document.getElementById('cursorGlow');
    if (!glow) return;

    /* Skip on touch-only devices */
    if (!window.matchMedia('(hover: hover)').matches) return;

    var mx = window.innerWidth  / 2;
    var my = window.innerHeight / 2;
    var cx = mx;
    var cy = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    function lerp(a, b, t) { return a + (b - a) * t; }

    (function tick() {
      cx = lerp(cx, mx, 0.07);
      cy = lerp(cy, my, 0.07);
      glow.style.transform = 'translate(' + (cx - 260) + 'px, ' + (cy - 260) + 'px)';
      requestAnimationFrame(tick);
    })();
  }


  /* ── 4. COUNTER ANIMATION ─────────────────────────────────────
     Count-up for [data-count] elements. Triggers on first
     intersection. Eased with ease-out-cubic for premium feel.
  ───────────────────────────────────────────────────────────────── */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);

        var el       = entry.target;
        var target   = parseInt(el.dataset.count, 10);
        var duration = 1600;
        var start    = null;

        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

        (function tick(timestamp) {
          if (!start) start = timestamp;
          var progress = Math.min((timestamp - start) / duration, 1);
          el.textContent = Math.round(easeOutCubic(progress) * target);
          if (progress < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { io.observe(el); });
  }


  /* ── 5. BEFORE / AFTER DRAG SLIDER ───────────────────────────
     Touch + mouse drag. Updates --ba-split CSS variable on .ba.
  ───────────────────────────────────────────────────────────────── */
  function initBASliders() {
    document.querySelectorAll('.ba').forEach(function (ba) {
      /* Inject handle if absent */
      if (!ba.querySelector('.ba__handle')) {
        var handle = document.createElement('div');
        handle.className = 'ba__handle';
        handle.innerHTML =
          '<svg viewBox="0 0 24 24">' +
          '<path d="M9 18l-6-6 6-6"/>' +
          '<path d="M15 6l6 6-6 6"/>' +
          '</svg>';
        ba.appendChild(handle);
      }

      var dragging = false;

      function setSplit(clientX) {
        var r   = ba.getBoundingClientRect();
        var pct = ((clientX - r.left) / r.width) * 100;
        pct = Math.max(4, Math.min(96, pct));
        ba.style.setProperty('--ba-split', pct.toFixed(2) + '%');
      }

      ba.addEventListener('mousedown',  function (e) { dragging = true; setSplit(e.clientX); e.preventDefault(); });
      ba.addEventListener('touchstart', function (e) { dragging = true; setSplit(e.touches[0].clientX); }, { passive: true });

      window.addEventListener('mousemove',  function (e) { if (dragging) setSplit(e.clientX); });
      window.addEventListener('touchmove',  function (e) { if (dragging) setSplit(e.touches[0].clientX); }, { passive: true });
      window.addEventListener('mouseup',    function () { dragging = false; });
      window.addEventListener('touchend',   function () { dragging = false; });
    });
  }


  /* ── 6. BADGE MARQUEE ─────────────────────────────────────────
     Wraps .badge children in .badge-track, duplicates for seamless loop.
  ───────────────────────────────────────────────────────────────── */
  function initMarquee() {
    document.querySelectorAll('.badges--center').forEach(function (wrap) {
      var badges = Array.from(wrap.querySelectorAll('.badge'));
      if (!badges.length) return;

      var track = document.createElement('div');
      track.className = 'badge-track';

      badges.concat(badges.map(function (b) { return b.cloneNode(true); }))
        .forEach(function (b) { track.appendChild(b); });

      wrap.innerHTML = '';
      wrap.appendChild(track);

      track.addEventListener('mouseenter', function () { track.style.animationPlayState = 'paused'; });
      track.addEventListener('mouseleave', function () { track.style.animationPlayState = 'running'; });
    });
  }


  /* ── 7. DIRECTIONAL HOVER — CONTACT BUTTONS ──────────────────
     Detects which edge cursor enters from, sets --fill-x/y,
     then toggles .is-hovered for CSS fill expansion.
  ───────────────────────────────────────────────────────────────── */
  function initDirectionalHover() {
    document.querySelectorAll('.contact-btn').forEach(function (btn) {
      function getOrigin(e) {
        var r  = btn.getBoundingClientRect();
        var x  = e.clientX - r.left;
        var y  = e.clientY - r.top;
        var w  = r.width;
        var h  = r.height;
        var ds = [y, h - y, x, w - x];
        var m  = Math.min.apply(null, ds);
        var fx = '50%', fy = '50%';
        if      (m === ds[0]) fy = '0%';
        else if (m === ds[1]) fy = '100%';
        else if (m === ds[2]) fx = '0%';
        else                  fx = '100%';
        return { fx: fx, fy: fy };
      }

      btn.addEventListener('mouseenter', function (e) {
        var o = getOrigin(e);
        btn.style.setProperty('--fill-x', o.fx);
        btn.style.setProperty('--fill-y', o.fy);
        btn.classList.add('is-hovered');
      });

      btn.addEventListener('mouseleave', function (e) {
        var o = getOrigin(e);
        btn.style.setProperty('--fill-x', o.fx);
        btn.style.setProperty('--fill-y', o.fy);
        btn.classList.remove('is-hovered');
      });
    });
  }


  /* ── 8. FULLPAGE SCROLL ────────────────────────────────────────
     - CSS scroll-snap gère le snapping (natif, mobile inclus)
     - Images : changement quasi-instantané (opacity 80ms)
     - Texte  : glisse vers le bas en sortie, monte en entrée
     - IntersectionObserver détecte la section visible
  ───────────────────────────────────────────────────────────────── */
  function initFullPage() {
    var sections = document.querySelectorAll('.fp-section');
    var bgs      = document.querySelectorAll('.fp-bg');
    var dots     = document.querySelectorAll('.fp-dot');
    var counter  = document.querySelector('.fp-counter__current');

    if (!sections.length) return;

    var N       = sections.length;
    var current = 0;

    /* Active le snap CSS sur <html> */
    document.documentElement.classList.add('fp-snap');

    /* ── Activation d'une section ───────────────────────────── */
    function setActive(idx) {
      if (idx === current && bgs[idx].classList.contains('is-active')) return;

      /* Marque l'ancienne section comme "en sortie" */
      sections[current].classList.remove('is-active');
      sections[current].classList.add('is-leaving');

      /* Supprime is-leaving après la transition */
      (function (old) {
        setTimeout(function () { sections[old].classList.remove('is-leaving'); }, 400);
      })(current);

      current = idx;

      /* Fonds : bascule quasi-instantanément */
      bgs.forEach(function (bg, i) { bg.classList.toggle('is-active', i === idx); });

      /* Texte : entre en glissant depuis le bas */
      sections[idx].classList.add('is-active');

      /* Dots & compteur */
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
    }

    /* Init section 0 sans animation d'entrée */
    bgs[0].classList.add('is-active');
    sections[0].classList.add('is-active');
    dots[0] && dots[0].classList.add('is-active');

    /* ── IntersectionObserver ───────────────────────────────── */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = parseInt(entry.target.dataset.index, 10);
          if (idx !== current) setActive(idx);
        }
      });
    }, { threshold: 0.55 });

    sections.forEach(function (s) { io.observe(s); });

    /* ── Clic sur les dots ──────────────────────────────────── */
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.dataset.target, 10);
        window.scrollTo({ top: idx * window.innerHeight, behavior: 'smooth' });
      });
    });

    /* ── Clavier ────────────────────────────────────────────── */
    window.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        window.scrollTo({ top: Math.min(current + 1, N - 1) * window.innerHeight, behavior: 'smooth' });
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        window.scrollTo({ top: Math.max(current - 1, 0) * window.innerHeight, behavior: 'smooth' });
      }
    });
  }


  /* ── 9. GOOGLE REVIEWS — Places API (optionnel) ──────────────
     Active les vrais avis Google dès que GOOGLE_PLACE_ID est renseigné
     et que le script Maps API est décommenté dans index.html.
     Sinon les avis statiques restent affichés (fallback).
  ───────────────────────────────────────────────────────────────── */
  var GOOGLE_PLACE_ID = 'ChIJt99CbDN7HmoRAigjVeQWfr0'; // Le Vitrier — Nice

  function renderGoogleReviews(reviews) {
    var grid     = document.querySelector('.testi-grid');
    var dotsWrap = document.querySelector('.testi-dots');
    if (!grid || !reviews || reviews.length === 0) return;

    var good = reviews.filter(function(r) { return r.rating >= 4; });
    if (good.length === 0) return;

    grid.innerHTML = good.map(function(r) {
      var stars = '';
      for (var i = 0; i < 5; i++) stars += (i < r.rating) ? '★' : '☆';
      var txt = r.text || '';
      if (txt.length > 300) txt = txt.slice(0, 300) + '…';
      var when = r.relative_time_description ? ' · ' + r.relative_time_description : '';
      return '<div class="testi-card">' +
        '<div class="testi-stars">' + stars + '</div>' +
        '<p class="testi-text">« ' + txt + ' »</p>' +
        '<div>' +
          '<div class="testi-name">' + (r.author_name || 'Client vérifié') + '</div>' +
          '<div class="testi-detail">Avis Google vérifié' + when + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    if (dotsWrap) {
      dotsWrap.innerHTML = good.map(function(r, i) {
        return '<span class="testi-dot' + (i === 0 ? ' testi-dot--active' : '') + '"></span>';
      }).join('');
    }

    initTestiCarousel();
  }

  function initGoogleReviews() {
    if (!GOOGLE_PLACE_ID) return; // pas encore configuré

    /* Cache localStorage 6h */
    var KEY_DATA = 'lv_reviews_data';
    var KEY_TIME = 'lv_reviews_time';
    try {
      var cached = localStorage.getItem(KEY_DATA);
      var ts     = parseInt(localStorage.getItem(KEY_TIME) || '0', 10);
      if (cached && (Date.now() - ts) < 21600000) {
        renderGoogleReviews(JSON.parse(cached));
        return;
      }
    } catch(e) {}

    function fetchFromApi() {
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;
      var div = document.createElement('div');
      var svc = new google.maps.places.PlacesService(div);
      svc.getDetails({
        placeId: GOOGLE_PLACE_ID,
        fields: ['reviews', 'rating', 'user_ratings_total', 'name']
      }, function(place, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place.reviews) return;
        var reviews = place.reviews.slice(0, 5);
        try {
          localStorage.setItem(KEY_DATA, JSON.stringify(reviews));
          localStorage.setItem(KEY_TIME, String(Date.now()));
        } catch(e) {}
        renderGoogleReviews(reviews);
      });
    }

    if (window._mapsReady) {
      fetchFromApi();
    } else {
      window._mapsReadyCb = fetchFromApi;
    }
  }


  /* ── 9a. CAROUSEL AVIS — flèches + auto 4s ───────────────────
     Mobile uniquement (≤ 640px). Transform-based, flèches HTML.
  ───────────────────────────────────────────────────────────────── */
  function initTestiCarousel() {
    var grid = document.querySelector('.testi-grid');
    var prev = document.querySelector('.testi-arrow--prev');
    var next = document.querySelector('.testi-arrow--next');
    if (!grid || !prev || !next) return;

    var dots  = document.querySelectorAll('.testi-dot');
    var cards = grid.querySelectorAll('.testi-card');
    var count = cards.length;
    if (!count) return;

    /* Nettoie un éventuel timer précédent (ré-init après avis Google) */
    if (grid._testiTimer) clearInterval(grid._testiTimer);

    var w       = window.innerWidth;
    var perView = w > 900 ? 3 : (w > 640 ? 2 : 1);
    var maxIndex = Math.max(0, count - perView);
    var current  = 0;

    function step() {
      var c = grid.querySelector('.testi-card');
      if (!c) return 0;
      var cs  = getComputedStyle(grid);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      return c.offsetWidth + gap;
    }

    function goTo(idx) {
      current = idx > maxIndex ? 0 : (idx < 0 ? maxIndex : idx);
      grid.style.transform = 'translateX(-' + (current * step()) + 'px)';
      dots.forEach(function (d, i) {
        d.classList.toggle('testi-dot--active', i === current);
      });
    }

    function start() {
      if (grid._testiTimer) clearInterval(grid._testiTimer);
      if (maxIndex > 0) {
        grid._testiTimer = setInterval(function () { goTo(current + 1); }, 4000);
      }
    }

    /* onclick (et non addEventListener) pour éviter les doublons en ré-init */
    prev.onclick = function () { goTo(current - 1); start(); };
    next.onclick = function () { goTo(current + 1); start(); };
    dots.forEach(function (d, i) { d.onclick = function () { goTo(i); start(); }; });

    goTo(0);
    start();
  }


  /* ── 9b. CAROUSEL RÉSEAUX SOCIAUX — flèches + auto 4s ────────
     Mobile uniquement (≤ 640px). Transform-based, flèches HTML.
  ───────────────────────────────────────────────────────────────── */
  function initSocialCarousel() {
    if (window.innerWidth > 640) return;

    var grid  = document.querySelector('.social-cards');
    var prev  = document.querySelector('.social-arrow--prev');
    var next  = document.querySelector('.social-arrow--next');
    var dots  = document.querySelectorAll('.social-dot');
    if (!grid || !prev || !next) return;

    var cards   = grid.querySelectorAll('.social-card');
    var count   = cards.length;
    var current = 0;
    var timer;

    function goTo(idx) {
      current = (idx + count) % count;
      var w = grid.parentElement.offsetWidth;
      grid.style.transform = 'translateX(-' + (current * w) + 'px)';
      dots.forEach(function (d, i) {
        d.classList.toggle('social-dot--active', i === current);
      });
    }

    function startTimer() {
      timer = setInterval(function () { goTo(current + 1); }, 4000);
    }

    prev.addEventListener('click', function () { clearInterval(timer); goTo(current - 1); startTimer(); });
    next.addEventListener('click', function () { clearInterval(timer); goTo(current + 1); startTimer(); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { clearInterval(timer); goTo(i); startTimer(); });
    });

    startTimer();
  }


  /* ── 9c. CARROUSELS MOBILES — fallback scroll ─────────────────
     Uniquement sur mobile (≤ 768px).
  ───────────────────────────────────────────────────────────────── */
  function initCarousels() {
    if (window.innerWidth > 768) return;

    var configs = [
      { gridSel: '.social-cards', itemSel: '.social-card' }
    ];

    configs.forEach(function (cfg) {
      var grid = document.querySelector(cfg.gridSel);
      if (!grid) return;

      var items = grid.querySelectorAll(cfg.itemSel);
      if (items.length < 2) return;

      var count   = items.length;
      var current = 0;

      /* ── Dots ──────────────────────────────────────────────── */
      var dotsWrap = document.createElement('div');
      dotsWrap.className = 'carousel-dots';
      for (var d = 0; d < count; d++) {
        var dot = document.createElement('span');
        dot.className = 'carousel-dot' + (d === 0 ? ' is-active' : '');
        dot.dataset.idx = d;
        dotsWrap.appendChild(dot);
      }
      grid.parentNode.insertBefore(dotsWrap, grid.nextSibling);

      var dots = dotsWrap.querySelectorAll('.carousel-dot');

      /* ── Navigation ────────────────────────────────────────── */
      function goTo(idx) {
        current = (idx + count) % count;
        grid.scrollTo({ left: current * grid.offsetWidth, behavior: 'smooth' });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === current);
        });
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function () { goTo(parseInt(dot.dataset.idx, 10)); });
      });

      /* ── Auto-avance 3s ────────────────────────────────────── */
      var timer = setInterval(function () { goTo(current + 1); }, 3000);

      /* Pause pendant le touch, reprend après */
      grid.addEventListener('touchstart', function () {
        clearInterval(timer);
      }, { passive: true });

      grid.addEventListener('touchend', function () {
        clearInterval(timer);
        timer = setInterval(function () { goTo(current + 1); }, 3000);
      }, { passive: true });

      /* Sync dots si l'utilisateur swipe manuellement */
      grid.addEventListener('scroll', function () {
        var idx = Math.round(grid.scrollLeft / grid.offsetWidth);
        if (idx !== current) {
          current = idx;
          dots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === current);
          });
        }
      }, { passive: true });
    });
  }


  /* ── 10. NAVBAR — scroll shadow enhancement ───────────────────── */
  function initNavbar() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 12) {
        nav.style.background  = 'rgba(246, 247, 249, 0.96)';
        nav.style.boxShadow   = '0 1px 0 rgba(0,0,0,.08), 0 6px 32px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9)';
      } else {
        nav.style.background  = '';
        nav.style.boxShadow   = '';
      }
    }, { passive: true });
  }


  /* ── PHOTOS FORMULAIRE — cumul jusqu'à 5 ─────────────────────── */
  function initContactFiles() {
    var MAX = 5;
    document.querySelectorAll('.contact-form input[type="file"]').forEach(function (input) {
      if (input._lvFilesInit) return; // évite la double initialisation
      if (typeof DataTransfer === 'undefined') return; // navigateur trop ancien : champ standard
      input._lvFilesInit = true;
      var store = new DataTransfer();

      var list = document.createElement('div');
      list.className = 'contact-form__filelist';
      input.insertAdjacentElement('afterend', list);

      function render() {
        list.innerHTML = '';
        Array.prototype.forEach.call(store.files, function (file, i) {
          var chip = document.createElement('span');
          chip.className = 'contact-form__chip';
          chip.textContent = file.name.length > 22 ? file.name.slice(0, 20) + '…' : file.name;

          var rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'contact-form__chip-rm';
          rm.setAttribute('aria-label', 'Retirer');
          rm.textContent = '×';
          rm.onclick = function () {
            var next = new DataTransfer();
            Array.prototype.forEach.call(store.files, function (f, j) { if (j !== i) next.items.add(f); });
            store = next;
            input.files = store.files;
            render();
          };
          chip.appendChild(rm);
          list.appendChild(chip);
        });
      }

      input.addEventListener('change', function () {
        Array.prototype.forEach.call(input.files, function (f) {
          if (store.files.length < MAX && f.type.indexOf('image') === 0) {
            store.items.add(f);
          }
        });
        input.files = store.files;
        render();
      });
    });
  }


  /* ── BOUTON DEVIS FLOTTANT — mobile: WhatsApp · ordinateur: formulaire ── */
  function initQuoteFab() {
    if (!document.body) return;
    if (document.querySelector('.lv-devis-overlay')) return;

    var waLink = 'https://wa.me/33763140034?text=' +
      encodeURIComponent('Bonjour, je souhaite un devis gratuit pour un nettoyage de vitres.');

    var nav     = document.querySelector('.navbar');
    var cards   = document.querySelector('.cards-section');   // accueil : bloc catégories
    var contact = document.querySelector('.contact-block');   // autres pages : section contact
    var isHome  = !!cards;

    if (isHome && nav) nav.classList.add('nav--home'); // barre derrière les catégories (accueil seul)

    /* Modal formulaire (ordinateur) */
    var overlay = document.createElement('div');
    overlay.className = 'lv-devis-overlay';
    overlay.innerHTML =
      '<div class="lv-devis-modal">' +
        '<button class="lv-devis-close" type="button" aria-label="Fermer">×</button>' +
        '<div class="lv-devis-title">Demandez votre devis gratuit</div>' +
        '<div class="lv-devis-sub">Réponse sous 48 h · sans engagement</div>' +
        '<form class="contact-form" action="https://api.web3forms.com/submit" method="POST">' +
          '<input type="hidden" name="access_key" value="3675748c-2323-4c16-a420-23d18e251b22" />' +
          '<input type="hidden" name="subject" value="Demande de devis (bouton) - levitrier06.fr" />' +
          '<input type="hidden" name="from_name" value="Site Le Vitrier" />' +
          '<input type="hidden" name="redirect" value="https://levitrier06.fr/merci.html" />' +
          '<input type="checkbox" name="botcheck" style="display:none" tabindex="-1" autocomplete="off" />' +
          '<select name="Secteur" required>' +
            '<option value="">Secteur *</option>' +
            '<option>Particulier</option>' +
            '<option>Professionnel</option>' +
            '<option>Panneaux solaires</option>' +
            '<option>Après chantier</option>' +
          '</select>' +
          '<div class="contact-form__row">' +
            '<input type="text" name="Nom" placeholder="Votre nom *" required />' +
            '<input type="tel" name="Telephone" placeholder="Votre téléphone *" required />' +
          '</div>' +
          '<input type="email" name="email" placeholder="Votre email *" required />' +
          '<input type="text" name="Adresse" placeholder="Adresse du chantier *" required />' +
          '<textarea name="Description" placeholder="Description du chantier : surface, nombre de vitres, étage, accès…" required></textarea>' +
          '<button type="submit" class="contact-form__btn">Envoyer ma demande</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    if (typeof initContactFiles === 'function') initContactFiles();

    function closeModal() { overlay.classList.remove('is-open'); }
    overlay.querySelector('.lv-devis-close').onclick = closeModal;
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

    /* Bouton "Votre devis" de la barre du haut : ordinateur → formulaire · téléphone → WhatsApp */
    document.querySelectorAll('.navbar__cta[href*="wa.me"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!isMobile()) {
          e.preventDefault();
          overlay.classList.add('is-open');
        }
      });
    });

    /* Bouton flottant : UNIQUEMENT sur la page d'accueil */
    var fab = null;
    if (isHome) {
      fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'lv-devis-fab';
      fab.setAttribute('aria-label', 'Demander un devis gratuit');
      fab.innerHTML =
        "<svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" +
          "<path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='9' y1='13' x2='15' y2='13'/><line x1='9' y1='17' x2='13' y2='17'/>" +
        "</svg>" +
        "<span class='lv-devis-fab__txt'>Devis gratuit</span>";
      document.body.appendChild(fab);
      fab.onclick = function () {
        if (isMobile()) { window.open(waLink, '_blank'); }
        else { overlay.classList.add('is-open'); }
      };
    }

    /* Comportement au scroll :
       - Accueil : barre cachée + bouton flottant dès que les catégories atteignent la barre.
       - Autres pages : barre visible partout, puis cachée en arrivant à la section contact. */
    function onScroll() {
      if (!isHome || !cards) return; // autres pages : la barre reste toujours visible
      var navH = nav ? nav.offsetHeight : 72;
      var down = cards.getBoundingClientRect().top <= navH;
      if (fab) fab.classList.toggle('is-visible', down);
      if (nav) nav.classList.toggle('is-hidden', down);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }


  /* ── SIMULATEUR PANNEAUX SOLAIRES ────────────────────────────── */
  function initSolarSim() {
    var root = document.getElementById('solarSim');
    if (!root) return;

    var form      = document.getElementById('simForm');
    var panels    = document.getElementById('simPanels');
    var panelsOut = document.getElementById('simPanelsOut');
    var access    = document.getElementById('simAccess');
    var last      = document.getElementById('simLast');
    var tilt      = document.getElementById('simTilt');
    var results   = document.getElementById('simResults');
    var costEl    = document.getElementById('simCost');
    var kwhEl     = document.getElementById('simKwh');
    var gainEl    = document.getElementById('simGain');
    var verdictEl = document.getElementById('simVerdict');
    var hidPanels = document.getElementById('hidPanels');
    var hidAccess = document.getElementById('hidAccess');
    var hidLast   = document.getElementById('hidLast');
    var hidTilt   = document.getElementById('hidTilt');
    var hidCost   = document.getElementById('hidCost');
    var hidGain   = document.getElementById('hidGain');
    if (!panels || !form) return;

    var MIN_PRICE      = 80;   // € minimum d'intervention
    var PROD_PER_PANEL = 520;  // kWh/an par panneau (PACA)
    var ELEC_PRICE     = 0.20; // € par kWh
    var tiltCost = { plat: 1, moyenne: 1.07, forte: 1.18 };  // toit pentu = +%
    var tiltSoil = { plat: 1.2, moyenne: 1.0, forte: 0.85 };
    /* Gain récupéré selon l'ancienneté : 1 an / 2 ans+ */
    var SOIL     = [0.22, 0.30];  // 22% / 30% de production récupérée
    var LASTCOST = [1.08, 1.18];  // dépôt plus ancien = nettoyage un peu plus cher

    /* Tarif par paliers : 10 premiers à 11€, 5 suivants à 10€, reste à 9€ */
    function basePrice(n) {
      var t1 = Math.min(n, 10);
      var t2 = Math.min(Math.max(n - 10, 0), 5);
      var t3 = Math.max(n - 15, 0);
      return t1 * 11 + t2 * 10 + t3 * 9;
    }
    function roundUp5(n) { return Math.ceil(n / 5) * 5; }

    function eur(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }
    function kwh(n) { return Math.round(n).toLocaleString('fr-FR') + ' kWh'; }

    function calc() {
      var n    = parseInt(panels.value, 10);
      var acc  = parseFloat(access.value);
      var li   = last.selectedIndex;
      var soil = SOIL[li];
      var t    = tilt.value;
      var raw   = basePrice(n) * acc * (tiltCost[t] || 1) * (LASTCOST[li] || 1);
      var cost  = roundUp5(Math.max(MIN_PRICE, raw));
      var recov = n * PROD_PER_PANEL * soil * (tiltSoil[t] || 1);
      var gain  = recov * ELEC_PRICE;
      return { n: n, cost: cost, recov: recov, gain: gain };
    }

    function showResults(r) {
      costEl.textContent = eur(r.cost);
      kwhEl.textContent  = kwh(r.recov);
      gainEl.textContent = eur(r.gain) + ' /an';
      if (r.gain <= 0) { verdictEl.textContent = '—'; }
      else {
        var months = r.cost / r.gain * 12;
        if (months <= 12) {
          verdictEl.innerHTML = '✅ Rentabilisé en ' + Math.max(1, Math.round(months)) +
            ' mois — puis <strong>' + eur(r.gain) + ' / an de gain net</strong>';
        } else {
          verdictEl.innerHTML = '✅ Rentabilisé en ' + (months / 12).toFixed(1).replace('.', ',') + ' ans';
        }
      }
      results.hidden = false;
      results.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* Le numéro de panneaux se met à jour en direct (pas le résultat) */
    panels.addEventListener('input', function () { panelsOut.textContent = panels.value; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

      var r = calc();
      if (hidPanels) hidPanels.value = r.n + ' panneaux';
      if (hidAccess) hidAccess.value = access.options[access.selectedIndex].text;
      if (hidLast)   hidLast.value   = last.options[last.selectedIndex].text;
      if (hidTilt)   hidTilt.value   = tilt.options[tilt.selectedIndex].text;
      if (hidCost)   hidCost.value   = r.cost + ' €';
      if (hidGain)   hidGain.value   = Math.round(r.gain) + ' € / an';

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }

      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) })
        .then(function (res) { return res.json(); })
        .then(function () {
          showResults(r);
          if (btn) btn.textContent = 'Estimation envoyée ✓';
        })
        .catch(function () {
          showResults(r); /* on affiche quand même le résultat */
          if (btn) { btn.disabled = false; btn.textContent = 'Voir mon estimation'; }
        });
    });
  }


  /* ── INIT ─────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initSolarSim();
    initReveal();
    initCardSpotlight();
    initCursorGlow();
    initCounters();
    initBASliders();
    initMarquee();
    initDirectionalHover();
    initGoogleReviews();
    initTestiCarousel();
    initSocialCarousel();
    initCarousels();
    initNavbar();
    initFullPage();
    initContactFiles();
    initQuoteFab();
  });

})();
