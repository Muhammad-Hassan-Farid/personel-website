(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---------- THEME ---------- */
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');
  var themeMeta = document.querySelector('meta[name=theme-color]');
  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    themeMeta.setAttribute('content', theme === 'dark' ? '#0F1115' : '#FAF9F6');
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  themeBtn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('mhf-theme', next); } catch(e){}
  });

  /* ---------- HEADER SHADOW + TO-TOP ---------- */
  var header = $('#nav'), toTop = $('#toTop');
  var onScroll = function(){
    header.classList.toggle('scrolled', window.scrollY > 8);
    toTop.classList.toggle('show', window.scrollY > 700);
  };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
  toTop.addEventListener('click', function(){ window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- MOBILE MENU ---------- */
  var mm = $('#mobileMenu'), burger = $('#hamburger');
  function setMenu(open){
    mm.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function(){ setMenu(mm.hidden); });
  $$('a', mm).forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !mm.hidden){ setMenu(false); burger.focus(); }
  });
  var desktopMq = window.matchMedia('(min-width: 1024px)');
  var onDesktop = function(e){ if (e.matches) setMenu(false); };
  if (desktopMq.addEventListener) desktopMq.addEventListener('change', onDesktop); else desktopMq.addListener(onDesktop);
  document.addEventListener('click', function(e){
    if (!mm.hidden && !header.contains(e.target)) setMenu(false);
  });

  /* ---------- ACTIVE NAV (IntersectionObserver) ---------- */
  var navAnchors = $$('.nav-links a, .mobile-menu a:not(.btn)');
  var idToWatch = ['about','work','research','experience','skills','contact'];
  if ('IntersectionObserver' in window){
    var secObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var href = '#' + en.target.id;
        navAnchors.forEach(function(a){
          var on = a.getAttribute('href') === href;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    idToWatch.forEach(function(id){ var el = document.getElementById(id); if (el) secObserver.observe(el); });
  }

  /* ---------- REVEAL ----------
     Reveal anything whose top has entered the viewport, including elements the
     user jumped past via an anchor link, so no content is left hidden. */
  var pending = $$('.reveal');
  function revealAll(){ pending.forEach(function(el){ el.classList.add('in'); }); pending = []; }
  function revealCheck(){
    var limit = window.innerHeight * 0.95;
    pending = pending.filter(function(el){
      if (el.getBoundingClientRect().top < limit){ el.classList.add('in'); return false; }
      return true;
    });
    if (!pending.length){
      window.removeEventListener('scroll', revealCheck);
      window.removeEventListener('resize', revealCheck);
    }
  }
  if (reduce || !root.classList.contains('motion')){
    revealAll();
  } else {
    // scroll events already fire at most once per frame, so no extra throttling
    window.addEventListener('scroll', revealCheck, { passive:true });
    window.addEventListener('resize', revealCheck);
    window.addEventListener('beforeprint', revealAll);
    revealCheck();
  }

  /* ---------- CONTACT FORM ---------- */
  var form = $('#contactForm'), toast = $('#toast'), toastMsg = $('.toast-msg', toast), toastTimer = null;
  function showToast(msg, isError){
    toastMsg.textContent = msg;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 4200);
  }
  function setErr(id, bad){
    var field = document.getElementById(id);
    field.classList.toggle('invalid', bad);
    field.querySelector('input,textarea').setAttribute('aria-invalid', String(bad));
    return !bad;
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = $('#in-name').value.trim();
    var email = $('#in-email').value.trim();
    var msg = $('#in-msg').value.trim();
    var ok = true;
    ok = setErr('f-name', name.length < 1) && ok;
    ok = setErr('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = setErr('f-msg', msg.length < 4) && ok;
    if (!ok){ var first = $('.field.invalid input, .field.invalid textarea', form); if (first) first.focus(); return; }

    var submit = $('button[type=submit]', form);
    submit.disabled = true;
    var csrfToken = (document.querySelector('[name=csrfmiddlewaretoken]') || {}).value || '';
    fetch('/contact/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken
      },
      body: 'name=' + encodeURIComponent(name) +
            '&email=' + encodeURIComponent(email) +
            '&message=' + encodeURIComponent(msg)
    })
    .then(function(r){ return r.json().then(function(data){ return { ok:r.ok, data:data }; }); })
    .then(function(res){
      if (res.ok && res.data.success){
        form.reset();
        showToast("Message sent. I'll be in touch soon.");
      } else {
        showToast('Message could not be sent. Please check the form or email me directly.', true);
      }
    })
    .catch(function(){
      showToast('Message could not be sent. Please email me directly.', true);
    })
    .then(function(){ submit.disabled = false; });
  });
  ['f-name','f-email','f-msg'].forEach(function(id){
    var input = document.getElementById(id).querySelector('input,textarea');
    input.addEventListener('input', function(){ setErr(id, false); });
  });

})();
