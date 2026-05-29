(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer:coarse)').matches;
  var $ = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

  /* ---------- THEME ---------- */
  var root = document.documentElement;
  var stored = null; try { stored = localStorage.getItem('mhf-theme'); } catch(e){}
  if (stored) root.setAttribute('data-theme', stored);
  $('#themeToggle').addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    document.querySelector('meta[name=theme-color]').setAttribute('content', next === 'dark' ? '#0A0A0B' : '#F3EFE7');
    try { localStorage.setItem('mhf-theme', next); } catch(e){}
  });

  /* ---------- NAV SCROLLED ---------- */
  var nav = $('#nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 40); $('#toTop').classList.toggle('show', window.scrollY > 700); };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  /* ---------- MOBILE MENU ---------- */
  var mm = $('#mobileMenu'), burger = $('#hamburger');
  function setMenu(open){
    mm.classList.toggle('open', open);
    mm.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $$('.mobile-menu a').forEach(function(a,i){ a.style.transitionDelay = (0.12 + i*0.07) + 's'; });
  }
  burger.addEventListener('click', function(){ setMenu(true); });
  $('#mmClose').addEventListener('click', function(){ setMenu(false); });
  $$('.mobile-menu a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

  /* ---------- ACTIVE NAV (IntersectionObserver) ---------- */
  var navMap = {}; $$('.nav-links a').forEach(function(a){ navMap[a.getAttribute('href').slice(1)] = a; });
  var idToWatch = ['work','research','experience','teaching','contact'];
  var secObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){
        $$('.nav-links a').forEach(function(a){ a.classList.remove('active'); });
        var id = en.target.id; if (navMap[id]) navMap[id].classList.add('active');
      }
    });
  }, { rootMargin:'-45% 0px -50% 0px' });
  idToWatch.forEach(function(id){ var el = document.getElementById(id); if (el) secObserver.observe(el); });

  /* ---------- REVEAL ---------- */
  var revealObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); revealObs.unobserve(en.target); } });
  }, { threshold:0.14, rootMargin:'0px 0px -8% 0px' });
  $$('.reveal').forEach(function(el){ revealObs.observe(el); });

  /* ---------- TIMELINE: dot activation + fill ---------- */
  var tlItems = $$('.tl-item'), tlFill = $('#tlFill'), tl = $('#timeline');
  var tlObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting) en.target.classList.add('in'); });
  }, { rootMargin:'-40% 0px -40% 0px' });
  tlItems.forEach(function(el){ tlObs.observe(el); });
  function tlScroll(){
    if (!tl) return;
    var r = tl.getBoundingClientRect();
    var vh = window.innerHeight;
    var prog = (vh*0.5 - r.top) / r.height;
    prog = Math.max(0, Math.min(1, prog));
    tlFill.style.height = (prog * r.height) + 'px';
  }
  window.addEventListener('scroll', tlScroll, { passive:true }); tlScroll();

  /* ---------- STAT COUNTERS ---------- */
  var counted = false;
  var statSec = $('#about');
  var countObs = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting && !counted){
        counted = true;
        $$('.stat .num').forEach(function(el){
          var target = parseInt(el.getAttribute('data-count'),10);
          var suffix = el.getAttribute('data-suffix') || '';
          if (reduce){ el.textContent = target + suffix; return; }
          var start = performance.now(), dur = 1400;
          function step(now){
            var t = Math.min(1, (now-start)/dur);
            var eased = 1 - Math.pow(1-t, 3);
            el.textContent = Math.round(eased*target) + suffix;
            if (t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }
    });
  }, { threshold:0.4 });
  if (statSec) countObs.observe(statSec);

  /* ---------- ROLE ROTATOR (typewriter) ---------- */
  var roles = ['AI Researcher','Computer Vision Engineer','LLM / RAG Builder','Educator'];
  var rEl = $('#roleRotator');
  rEl.innerHTML = '<span class="txt"></span><span class="caret"></span>';
  var rTxt = rEl.querySelector('.txt');
  if (reduce){ rTxt.textContent = roles[0]; }
  else {
    var ri = 0, ci = 0, deleting = false;
    function tick(){
      var word = roles[ri];
      if (!deleting){
        ci++; rTxt.textContent = word.slice(0,ci);
        if (ci === word.length){ deleting = true; return setTimeout(tick, 1500); }
        setTimeout(tick, 65 + Math.random()*45);
      } else {
        ci--; rTxt.textContent = word.slice(0,ci);
        if (ci === 0){ deleting = false; ri = (ri+1)%roles.length; return setTimeout(tick, 280); }
        setTimeout(tick, 34);
      }
    }
    setTimeout(tick, 900);
  }

  /* ---------- CUSTOM CURSOR ---------- */
  if (!coarse && !reduce){
    document.body.classList.add('has-cursor');
    var dot = $('.cursor-dot'), ring = $('.cursor-ring');
    var mx=window.innerWidth/2, my=window.innerHeight/2, rx=mx, ry=my;
    window.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; dot.style.transform='translate('+mx+'px,'+my+'px) translate(-50%,-50%)'; }, { passive:true });
    (function loop(){ rx += (mx-rx)*0.18; ry += (my-ry)*0.18; ring.style.transform='translate('+rx+'px,'+ry+'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
    var hoverSel = 'a, button, .chip, .card, input, textarea';
    document.addEventListener('mouseover', function(e){ if (e.target.closest(hoverSel)) ring.classList.add('hovering'); });
    document.addEventListener('mouseout', function(e){ if (e.target.closest(hoverSel)) ring.classList.remove('hovering'); });
  }

  /* ---------- MAGNETIC ---------- */
  if (!coarse && !reduce){
    $$('.magnetic').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width/2);
        var y = e.clientY - (r.top + r.height/2);
        el.style.transform = 'translate('+(x*0.28)+'px,'+(y*0.34)+'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform=''; });
    });
  }

  /* ---------- 3D TILT + glow ---------- */
  if (!coarse && !reduce){
    $$('.tilt').forEach(function(card){
      var glow = card.querySelector('.glow');
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
        var rx = (0.5 - py)*6, ry = (px - 0.5)*6;
        card.style.transform = 'perspective(800px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
        if (glow){ glow.style.left = (px*r.width)+'px'; glow.style.top = (py*r.height)+'px'; }
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });
  }

  /* ---------- SMOOTH SCROLL for in-page anchors ---------- */
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block:'start' });
    });
  });
  $('#toTop').addEventListener('click', function(){ window.scrollTo({ top:0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- CONTACT FORM ---------- */
  var form = $('#contactForm'), toast = $('#toast');
  function setErr(id, bad){ document.getElementById(id).classList.toggle('invalid', bad); return !bad; }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = $('#in-name').value.trim();
    var email = $('#in-email').value.trim();
    var msg = $('#in-msg').value.trim();
    var ok = true;
    ok = setErr('f-name', name.length < 1) && ok;
    ok = setErr('f-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = setErr('f-msg', msg.length < 4) && ok;
    if (!ok) return;

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
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.success){
        form.reset();
        toast.classList.add('show');
        setTimeout(function(){ toast.classList.remove('show'); }, 3800);
      }
    })
    .catch(function(){
      form.reset();
      toast.classList.add('show');
      setTimeout(function(){ toast.classList.remove('show'); }, 3800);
    });
  });
  ['f-name','f-email','f-msg'].forEach(function(id){
    var input = document.getElementById(id).querySelector('input,textarea');
    input.addEventListener('input', function(){ document.getElementById(id).classList.remove('invalid'); });
  });

  /* ---------- HERO NEURAL CANVAS ---------- */
  (function(){
    if (reduce) return;
    var canvas = $('#hero-canvas'); if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = $('.hero');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W=0, H=0, nodes=[], raf=null, running=true;
    var mouse = { x:-9999, y:-9999 };

    function resize(){
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var count = Math.min(60, Math.round(W*H/22000));
      nodes = [];
      for (var i=0;i<count;i++){
        nodes.push({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25, r:Math.random()*1.6+0.8 });
      }
    }
    function accent(){ return getComputedStyle(root).getPropertyValue('--accent').trim() || '#F59E0B'; }
    function hexA(hex, a){
      hex = hex.replace('#',''); if (hex.length===3) hex = hex.split('').map(function(c){return c+c;}).join('');
      var n = parseInt(hex,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
    }
    function draw(){
      if (!running) return;
      ctx.clearRect(0,0,W,H);
      var ac = accent();
      for (var i=0;i<nodes.length;i++){
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x<0||n.x>W) n.vx*=-1; if (n.y<0||n.y>H) n.vy*=-1;
        var dxm = n.x-mouse.x, dym = n.y-mouse.y, dm = Math.sqrt(dxm*dxm+dym*dym);
        if (dm < 140){ n.x += dxm/dm*1.1; n.y += dym/dm*1.1; }
        for (var j=i+1;j<nodes.length;j++){
          var m = nodes[j], dx=n.x-m.x, dy=n.y-m.y, d=Math.sqrt(dx*dx+dy*dy);
          if (d < 130){
            ctx.strokeStyle = hexA(ac, (1 - d/130)*0.22);
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(m.x,m.y); ctx.stroke();
          }
        }
      }
      for (var k=0;k<nodes.length;k++){
        var p = nodes[k];
        var near = Math.sqrt((p.x-mouse.x)*(p.x-mouse.x)+(p.y-mouse.y)*(p.y-mouse.y)) < 140;
        ctx.fillStyle = hexA(ac, near ? 0.9 : 0.45);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    hero.addEventListener('mousemove', function(e){ var r=hero.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; }, { passive:true });
    hero.addEventListener('mouseleave', function(){ mouse.x=-9999; mouse.y=-9999; });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function(){
      running = !document.hidden;
      if (running){ raf = requestAnimationFrame(draw); } else if (raf){ cancelAnimationFrame(raf); }
    });
    var initObs = new IntersectionObserver(function(en){
      if (en[0].isIntersecting){ resize(); if (!raf) raf = requestAnimationFrame(draw); }
      else if (raf){ cancelAnimationFrame(raf); raf=null; }
    }, { threshold:0 });
    initObs.observe(hero);
  })();

})();
