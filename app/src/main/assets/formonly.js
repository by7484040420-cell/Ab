(function () {
  try {
    var W = window;
    if (W.__nkOff) return 'off';
    function vis(e) {
      var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    }
    var FIELD = 'input:not([type=hidden]):not([type=search]):not([type=button]):not([type=submit]):not([type=image]):not([type=reset]), select, textarea';
    var BTN = 'button, input[type=submit], input[type=button], input[type=image], a.btn, [role=button]';
    var ACT = /submit|save|next|proceed|continue|preview|register|login|log in|sign|verify|send|apply|upload|pay|final|back|आगे|जमा|सबमिट|सुरक्षित|लॉग|पंजीकरण/i;
    var KEEP = /datepicker|calendar|flatpickr|picker|select2|modal|dialog|swal|toast|alert|popup|overlay|captcha|loader|loading|spinner|autocomplete|dropdown|consent/i;
    function isSearch(e) {
      var m = ((e.name || '') + ' ' + (e.id || '') + ' ' + (e.placeholder || '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (typeof e.className === 'string' ? e.className : '')).toLowerCase();
      return /search|खोज/.test(m);
    }
    function fields(root) {
      return [].slice.call(root.querySelectorAll(FIELD)).filter(function (e) { return vis(e) && !e.disabled && !isSearch(e); });
    }
    function restore() {
      [].slice.call(document.querySelectorAll('[data-nk-h]')).forEach(function (e) {
        e.style.removeProperty('display');
        var d = e.getAttribute('data-nk-d');
        if (d) e.style.setProperty('display', d);
        e.removeAttribute('data-nk-h');
        e.removeAttribute('data-nk-d');
      });
      W.__nkTop = null;
      W.__nkCnt = -1;
    }
    W.__nkRestore = function () { W.__nkOff = true; restore(); };

    function run() {
      if (W.__nkOff) return 'off';
      var cands = [].slice.call(document.querySelectorAll('form'));
      if (!cands.length) cands = [document.body];
      var best = null, bf = [];
      cands.forEach(function (f) {
        var fs = fields(f);
        if (fs.length > bf.length) { best = f; bf = fs; }
      });
      var hasPw = bf.some(function (e) { return e.type === 'password'; });
      if (!best || (bf.length < 2 && !hasPw)) return 'none';
      var nodes = bf.slice();
      [].slice.call(best.querySelectorAll(BTN)).filter(vis).forEach(function (b) {
        var t = (b.innerText || b.value || b.title || '').trim();
        if (ACT.test(t)) nodes.push(b);
      });
      var top = nodes[0].parentElement || nodes[0];
      nodes.forEach(function (n) { while (top && !top.contains(n)) top = top.parentElement; });
      if (!top || top === document.documentElement) return 'none';
      if (W.__nkTop === top && W.__nkCnt === bf.length) return 'same';
      restore();
      var cur = top;
      while (cur && cur !== document.documentElement) {
        var p = cur.parentElement;
        if (!p) break;
        [].slice.call(p.children).forEach(function (c) {
          if (c === cur) return;
          if (/^(SCRIPT|STYLE|LINK|META|NOSCRIPT|TEMPLATE|HEAD|TITLE)$/.test(c.tagName)) return;
          var cls = (typeof c.className === 'string' ? c.className : '') + ' ' + (c.id || '');
          if (KEEP.test(cls)) return;
          if (fields(c).length) return;
          c.setAttribute('data-nk-d', c.style.getPropertyValue('display') || '');
          c.setAttribute('data-nk-h', '1');
          c.style.setProperty('display', 'none', 'important');
        });
        cur = p;
      }
      W.__nkTop = top;
      W.__nkCnt = bf.length;
      try { W.scrollTo(0, 0); } catch (x) {}
      return 'ok';
    }
    W.__nkRun = run;
    if (!W.__nkTimer) {
      var n = 0;
      W.__nkTimer = setInterval(function () {
        if (++n > 60) { clearInterval(W.__nkTimer); return; }
        try { run(); } catch (e) {}
      }, 2500);
    }
    return run();
  } catch (e) {
    return 'err';
  }
})()
