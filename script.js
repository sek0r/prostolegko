// просто|легко, демо. Меню, вкладки прайса на телефоне, колонна, которая крутится при скролле.
(function () {
  // Меню на телефоне
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  // Вкладки прайса: только на узком экране; на десктопе весь стеллаж виден сразу
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var narrow = window.matchMedia('(max-width: 59.99rem)');
  var current = tabs[0];
  function panelOf(t) { return document.getElementById(t.getAttribute('aria-controls')); }
  function select(tab, focus) {
    current = tab;
    tabs.forEach(function (t) {
      var on = t === tab;
      var panel = panelOf(t);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (narrow.matches) {
        // phone: real tabs, one shelf at a time
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', t.id);
        panel.tabIndex = 0;
        panel.hidden = !on;
      } else {
        // desktop: the whole rack is on show, so the shelves are plain sections named by their own label
        panel.removeAttribute('role');
        panel.removeAttribute('aria-labelledby');
        panel.removeAttribute('tabindex');
        panel.hidden = false;
      }
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  if (tabs.length) {
    select(current, false);
    var onWidth = function () { select(current, false); };
    // Safari 13 and older only know addListener; without this the script stops and the booking bar never appears
    if (narrow.addEventListener) narrow.addEventListener('change', onWidth); else narrow.addListener(onWidth);
  }

  // Нижняя панель на телефоне появляется, когда кнопки первого экрана ушли из вида
  var heroActions = document.querySelector('.hero .actions');
  if (heroActions && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('bar-on', !entries[0].isIntersecting);
    }).observe(heroActions);
  } else {
    document.body.classList.add('bar-on');
  }

  // Мастера на телефоне: карусель со свайпом, стрелками и точками.
  // Один раз сама проходит по всем мастерам, когда раздел виден; любое касание её останавливает.
  var track = document.querySelector('.barbers');
  if (track) {
    var cards = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(document.querySelectorAll('.barbers-dots button'));
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var phone = window.matchMedia('(max-width: 47.99rem)');
    var active = 0, timer = null, steps = 0, userTouched = false;
    var mark = function (i) {
      active = i;
      cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === i)); });
    };
    var go = function (i) {
      i = (i + cards.length) % cards.length;
      var c = cards[i];
      track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    var stop = function () { userTouched = true; clearInterval(timer); timer = null; };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) mark(cards.indexOf(e.target)); });
      }, { root: track, threshold: 0.6 });
      cards.forEach(function (c) { io.observe(c); });
      // autoplay: one lap through the barbers, only on phones, only while the section is on screen
      new IntersectionObserver(function (entries) {
        var seen = entries[0].isIntersecting;
        if (seen && !timer && !userTouched && phone.matches && !reduce.matches && steps < cards.length) {
          timer = setInterval(function () {
            steps++;
            go(active + 1);
            if (steps >= cards.length) { clearInterval(timer); timer = null; }
          }, 5000);
        } else if (!seen && timer) { clearInterval(timer); timer = null; }
      }, { threshold: 0.5 }).observe(track);
    }
    mark(0);
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(function (ev) {
      track.addEventListener(ev, stop, { passive: true });
    });
    document.querySelectorAll('.barbers-arrow').forEach(function (b) {
      b.addEventListener('click', function () { stop(); go(active + Number(b.getAttribute('data-dir'))); });
    });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { stop(); go(k); }); });
  }

  // Колонна-барбер-пол: полосы сдвигаются со скроллом, как будто она вращается
  var stripes = document.querySelector('.pole-stripes');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var period = 56 * Math.SQRT2; // шаг полос по вертикали при наклоне 45°
  var ticking = false;
  function turn() {
    ticking = false;
    var y = still.matches ? 0 : (window.scrollY * 0.6) % period;
    stripes.style.transform = 'translate3d(0,' + (-y).toFixed(2) + 'px,0)';
  }
  if (stripes) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(turn); }
    }, { passive: true });
    turn();
  }
})();
