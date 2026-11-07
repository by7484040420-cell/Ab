(function () {
  var KIND = __KIND__, NAME = __NAME__, MIME = __MIME__, PROBE = __PROBE__;
  try {
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
    function ownOf(el) {
      var t = [el.name, el.id, el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('placeholder'), el.getAttribute('data-label')].join(' ');
      try { if (el.labels) for (var i = 0; i < el.labels.length; i++) t += ' ' + (el.labels[i].innerText || ''); } catch (e) {}
      return t;
    }
    function nearOf(el) {
      var p = el.parentElement, hops = 0;
      while (p && hops < 3) {
        var tx = (p.innerText || '').replace(/\s+/g, ' ').trim();
        if (tx && tx.length < 160) return tx;
        p = p.parentElement; hops++;
      }
      return '';
    }
    var ext = NAME.split('.').pop().toLowerCase();
    var mime = MIME.toLowerCase();
    function acceptOk(el) {
      var acc = (el.getAttribute('accept') || '').toLowerCase().replace(/\s/g, '');
      if (!acc) return true;
      return acc.split(',').some(function (a) {
        if (!a || a === '*/*') return true;
        if (a.slice(-2) === '/*') return mime.indexOf(a.slice(0, -1)) === 0;
        if (a.charAt(0) === '.') return a.slice(1) === ext || (a === '.jpg' && ext === 'jpeg') || (a === '.jpeg' && ext === 'jpg');
        return a === mime;
      });
    }
    var inputs = document.querySelectorAll('input[type=file]');
    var target = null;
    for (var k = 0; k < inputs.length; k++) {
      var el = inputs[k];
      if (el.disabled || el.getAttribute('data-narad-up') === '1') continue;
      if (el.files && el.files.length) continue;
      var own = ownOf(el);
      var kd = classify(own) || classify(nearOf(el));
      if (kd !== KIND) continue;
      if (!acceptOk(el)) continue;
      target = el; break;
    }
    if (!target) return 'none';
    if (PROBE) return 'found';
    var b64 = window.__nb || '';
    window.__nb = '';
    if (!b64) return 'nodata';
    var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n);
    for (var j = 0; j < n; j++) u8[j] = bin.charCodeAt(j);
    var file = new File([u8], NAME, { type: MIME });
    var dt = new DataTransfer();
    dt.items.add(file);
    target.files = dt.files;
    target.setAttribute('data-narad-up', '1');
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    var lab = (ownOf(target) + ' ' + nearOf(target)).replace(/\s+/g, ' ').trim().slice(0, 40);
    return 'ok:' + lab;
  } catch (e) {
    window.__nb = '';
    return 'err:' + String((e && e.message) || e).slice(0, 60);
  }
})()
