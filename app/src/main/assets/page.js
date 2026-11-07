(function () {
  try {
    function vis(e) {
      var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    }
    var pw = [].slice.call(document.querySelectorAll('input[type=password]')).filter(function (e) {
      return vis(e) && !e.disabled && !e.readOnly && !e.value;
    }).length;
    var login = false, reg = false;
    [].slice.call(document.querySelectorAll('a,button')).filter(vis).forEach(function (e) {
      var t = (e.innerText || '').trim().toLowerCase();
      if (!t || t.length > 25) return;
      if (/^(log ?in|sign ?in|user login|citizen login)$/.test(t)) login = true;
      if (/^(register|sign ?up|new user|create account|new registration|registration|user registration)$/.test(t)) reg = true;
    });
    var human = [].slice.call(document.querySelectorAll('input')).some(function (e) {
      if (!vis(e) || e.disabled || e.value) return false;
      var m = ((e.name || '') + ' ' + (e.id || '') + ' ' + (e.placeholder || '') + ' ' + (e.getAttribute('aria-label') || '')).toLowerCase();
      return /captcha|\botp\b|verification code|security code/.test(m);
    });
    var order = [
      ['signature', /sign|हस्ताक्षर/i],
      ['aadhaar', /aadh?aa?r|आधार|\buid\b/i],
      ['pan', /\bpan\b|पैन/i],
      ['certificate', /marksheet|mark sheet|certificate|10th|12th|matric|degree|qualification|प्रमाण|अंकपत्र/i],
      ['photo', /photo|picture|image|passport size|\bpic\b|फोटो|तस्वीर/i]
    ];
    function classify(t) {
      for (var i = 0; i < order.length; i++) if (order[i][1].test(t)) return order[i][0];
      return null;
    }
    function own(el) {
      var t = [el.name, el.id, el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('placeholder'), el.getAttribute('data-label')].join(' ');
      try { if (el.labels) for (var i = 0; i < el.labels.length; i++) t += ' ' + (el.labels[i].innerText || ''); } catch (x) {}
      return t;
    }
    function near(el) {
      var p = el.parentElement, h = 0;
      while (p && h < 3) {
        var tx = (p.innerText || '').replace(/\s+/g, ' ').trim();
        if (tx && tx.length < 160) return tx;
        p = p.parentElement; h++;
      }
      return '';
    }
    var kinds = [];
    [].slice.call(document.querySelectorAll('input[type=file]')).forEach(function (el) {
      if (el.disabled || el.getAttribute('data-narad-up') === '1' || (el.files && el.files.length)) return;
      var k = classify(own(el)) || classify(near(el));
      if (k && kinds.indexOf(k) < 0) kinds.push(k);
    });
    return JSON.stringify({ pw: pw, login: login, reg: reg, human: human, files: kinds });
  } catch (e) {
    return '{}';
  }
})()
