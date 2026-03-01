/* OAuthPage Markdown Renderer — ~2KB */
(function(){
  const defined = window.__OP_MD || {};
  const root = defined.base || '';
  const el = {
    main: document.getElementById('content'),
    toc: document.getElementById('toc'),
    nav: document.getElementById('nav'),
    title: document.querySelector('title'),
    toggle: document.getElementById('theme-toggle'),
    menu: document.getElementById('menu-toggle'),
    sidebar: document.getElementById('sidebar'),
  };

  /* --- Markdown via marked (CDN) --- */
  marked.setOptions({
    gfm: true,
    breaks: false,
    highlight: function(code, lang) {
      if (lang && Prism.languages[lang]) {
        try { return Prism.highlight(code, Prism.languages[lang], lang); }
        catch(_) {}
      }
      return code;
    }
  });

  /* --- Router --- */
  function currentPath() {
    var h = location.hash.replace(/^#\/?/, '') || 'README';
    if (h.endsWith('/')) h += 'README';
    return h;
  }

  function navigate() {
    var path = currentPath();
    var url = root + '/' + path + '.md';
    fetch(url).then(function(r) {
      if (!r.ok) return fetch(root + '/README.md');
      return r;
    }).then(function(r) { return r.text(); })
      .then(render)
      .catch(function() {
        el.main.innerHTML = '<h1>Not Found</h1><p>Page not found.</p>';
      });
  }

  /* --- Render --- */
  function render(md) {
    var html = marked.parse(md);
    el.main.innerHTML = html;

    // Extract title from first h1
    var h1 = el.main.querySelector('h1');
    if (h1 && el.title) {
      el.title.textContent = h1.textContent + ' — ' + (defined.title || 'Docs');
    }

    // Build TOC from h2/h3
    buildToc();

    // Re-highlight (Prism auto mode)
    if (window.Prism) Prism.highlightAllUnder(el.main);

    // Intercept local links
    el.main.querySelectorAll('a[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && href.endsWith('.md')) {
        a.setAttribute('href', '#/' + href.replace(/\.md$/, ''));
        a.addEventListener('click', function() {
          setTimeout(function(){ window.scrollTo(0,0); }, 10);
        });
      }
    });

    window.scrollTo(0, 0);
  }

  /* --- TOC --- */
  function buildToc() {
    if (!el.toc) return;
    var headings = el.main.querySelectorAll('h2, h3');
    if (headings.length === 0) { el.toc.innerHTML = ''; return; }

    var items = [];
    headings.forEach(function(h) {
      var id = h.textContent.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      h.id = id;
      var level = h.tagName === 'H3' ? 'toc-h3' : '';
      items.push('<a href="#' + currentPath() + '#' + id + '" class="toc-link ' + level + '">' + h.textContent + '</a>');
    });
    el.toc.innerHTML = items.join('');
  }

  /* --- Sidebar (_sidebar.md) --- */
  function loadSidebar() {
    if (!el.nav) return;
    fetch(root + '/_sidebar.md').then(function(r) {
      if (!r.ok) { el.nav.innerHTML = ''; return r; }
      return r.text().then(function(md) {
        el.nav.innerHTML = marked.parse(md);
        // Fix sidebar links
        el.nav.querySelectorAll('a[href]').forEach(function(a) {
          var href = a.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('#')) {
            var clean = href.replace(/\.md$/, '').replace(/^\//, '');
            a.setAttribute('href', '#/' + clean);
          }
        });
      });
    }).catch(function(){});
  }

  /* --- Theme --- */
  function initTheme() {
    var saved = localStorage.getItem('op-theme');
    if (saved === 'light') document.documentElement.classList.add('light');
    if (el.toggle) {
      el.toggle.addEventListener('click', function() {
        document.documentElement.classList.toggle('light');
        localStorage.setItem('op-theme',
          document.documentElement.classList.contains('light') ? 'light' : 'dark');
      });
    }
  }

  /* --- Mobile menu --- */
  if (el.menu && el.sidebar) {
    el.menu.addEventListener('click', function() {
      el.sidebar.classList.toggle('open');
    });
    // Close on nav click (mobile)
    el.sidebar.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') el.sidebar.classList.remove('open');
    });
  }

  /* --- Init --- */
  initTheme();
  loadSidebar();
  navigate();
  window.addEventListener('hashchange', navigate);
})();
