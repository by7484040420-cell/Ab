(function () {
  var N = (window.__narad = window.__narad || {});
  var P0 = __DATA__, SPEED0 = __SPEED__;
  N.paused = false; N.stop = false;
  var B0 = window.NaradBridge;
  function vis(e) { return e.getClientRects && e.getClientRects().length > 0; }

  // Dobara chalne layak: naya page / naya field aane par phir se dekhta hai
  N.run = async function () {
    if (N.running) { N.again = true; return; }
    N.running = true;
    try { await main(P0, SPEED0); } catch (e) { try { B0.status('AI me dikkat: ' + e.message); } catch (x) {} }
    N.running = false;
    if (N.again && !N.stop) { N.again = false; setTimeout(N.run, 800); }
  };

  async function main(P, SPEED) {
  N.sawOtp = false;
  var B = B0;
  var report = [];
  var missing = [];   // is page par jo cheezein nahi mili - report me ek hi line me

  function say(m) { try { B.status(m); } catch (e) {} }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function add(k, st, msg) { report.push({ k: k, st: st, msg: msg }); }
  function finish() { try { B.report(JSON.stringify(report)); } catch (e) {} }
  function clean(s) {
    return (s || '').toString()
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-.\[\]:]+/g, ' ')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function shown(el) {
    if (!el.getClientRects || el.getClientRects().length === 0) return false;
    var cs = window.getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function labelOf(el) {
    var t = [];
    if (el.labels) for (var i = 0; i < el.labels.length; i++) t.push(el.labels[i].innerText);
    var al = el.getAttribute('aria-labelledby');
    if (al) al.split(' ').forEach(function (id) { var n = document.getElementById(id); if (n) t.push(n.innerText); });
    return t.join(' ');
  }
  // sirf tab jab container me ek hi field ho - warna padosi field ka text galat mil sakta hai
  function nearOf(el) {
    var p = el.parentElement;
    for (var up = 0; p && up < 3; up++, p = p.parentElement) {
      var n = p.querySelectorAll('input:not([type=hidden]), select, textarea').length;
      if (n === 1) return clean((p.innerText || '').slice(0, 80));
      if (n > 1) return '';
    }
    return '';
  }
  function strongOf(el) {
    return clean([labelOf(el), el.placeholder, el.getAttribute('aria-label'), el.title].join(' '));
  }
  function weakOf(el) { return clean([el.name, el.id].join(' ')); }

  // ---------- Payment / card page par kabhi nahi ----------
  var all = Array.prototype.slice.call(document.querySelectorAll('input, textarea, select'));
  var pay = /card ?(no|number)|cvv|cvc|upi id|vpa|net ?banking/;
  for (var a = 0; a < all.length; a++) {
    var ac = (all[a].getAttribute('autocomplete') || '').toLowerCase();
    if (/^cc-/.test(ac) || pay.test(strongOf(all[a])) || pay.test(weakOf(all[a]))) {
      add('all', 'bad', 'Payment page lag raha hai. AI yahan kuch nahi bharega - aap khud bharein.');
      say('Payment page: AI ruk gaya.');
      finish(); return;
    }
  }

  var skipTypes = ['hidden', 'password', 'file', 'checkbox', 'submit', 'button', 'image', 'reset', 'range', 'color'];
  var danger = /captcha|\botp\b|verification code|password|passcode|\bcvv\b|\bcvc\b|a{1,2}dh?a{1,2}r|आधार|\buid\b|\bvid\b|virtual id|enrol|account|\bifsc\b|security|\bpin ?no\b.*atm|\bmpin\b|\bupi\b|debit|credit card|net ?banking|\bpan ?(no|number|card)\b/;
  var fields = all.filter(function (el) {
    var t = (el.type || 'text').toLowerCase();
    if (skipTypes.indexOf(t) >= 0 || !shown(el)) return false;
    var m = strongOf(el) + ' ' + weakOf(el);
    if (/captcha|otp|verification code/.test(m)) { N.sawOtp = true; return false; }
    if (danger.test(m)) return false;
    return true;
  });

  var hasChoiceCtl = all.some(function (e) {
    var t = (e.type || '').toLowerCase();
    return (t === 'checkbox' || t === 'radio') && shown(e);
  });
  if (fields.length === 0 && !hasChoiceCtl) {
    add('all', 'warn', document.querySelectorAll('iframe').length > 0
      ? 'Form iframe ke andar hai, AI nahi bhar sakta. Aap khud bharein.'
      : 'Is page par bharne layak form nahi mila.');
    try { B.needs('[]'); } catch (e) {}
    finish(); return;
  }

  // ---------- Rules: pos = match, neg = bilkul nahi ----------
  var RULES = [
    { k: 'naam', n: 'Naam', types: 'text',
      pos: /\b(full name|name|naam|applicant|candidate)\b|नाम/,
      neg: /father|pita|mother|mata|spouse|husband|wife|guardian|parent|first|middle|last|sur ?name|nominee|school|college|board|bank|branch|account|company|organi[sz]ation|institution|city|state|district|village|user ?name|login|nick|hint|document|certificate|reference|referee|पिता|माता|पति|पत्नी|संरक्षक|उपनाम/ },
    { k: 'pita', n: 'Pita ka naam', types: 'text',
      pos: /father|pita|guardian|पिता|संरक्षक/,
      neg: /mother|mata|spouse|husband|wife|mobile|phone|contact|occupation|income|address|e ?mail|aadh|\bage\b|माता/ },
    { k: 'mata', n: 'Mata ka naam', types: 'text',
      pos: /mother|mata|माता/,
      neg: /father|pita|spouse|mobile|phone|contact|occupation|income|address|e ?mail|aadh|\bage\b|पिता/ },
    { k: 'janm', n: 'Janm tithi', types: 'date',
      pos: /\b(dob|d o b|date of birth|birth date|birth|born|janm)\b|जन्म/,
      neg: /place|state|district|city|village|country|certificate|registration|\btime\b|proof|\bage\b|father|mother/ },
    { k: 'mobile', n: 'Mobile', types: 'text',
      pos: /mobile|phone|contact|\bmob\b|\bcell\b|मोबाइल|फोन/,
      neg: /alternat|\balt\b|secondary|emergency|landline|\bstd\b|office|otp|father|mother|parent|guardian|spouse|confirm|re ?enter|verify|country|code/ },
    { k: 'email', n: 'Email', types: 'text',
      pos: /e ?mail|ईमेल/,
      neg: /alternat|confirm|re ?enter|retype|parent|father|mother|verify|otp|office/ },
    { k: 'pincode', n: 'Pincode', types: 'text',
      pos: /pin ?code|postal|zip|पिन/,
      neg: /otp|security|atm|card/ },
    { k: 'pata', n: 'Pata', types: 'text',
      pos: /address|\baddr\b|\bpata\b|पता/,
      neg: /e ?mail|proof|type|\bip\b|web|line ?2|second|office|district|state|city|\bpin\b|post office|ईमेल/ }
  ];

  function score(el, r) {
    var strong = strongOf(el), weak = weakOf(el), near = nearOf(el);
    if (r.neg.test(strong) || r.neg.test(weak) || (near && r.neg.test(near))) return 0;
    var s = 0;
    if (r.pos.test(strong)) s += 3;
    if (r.pos.test(weak)) s += 2;
    if (near && r.pos.test(near)) s += 1;
    return s;
  }
  function typeOk(el, r) {
    var t = (el.type || 'text').toLowerCase();
    if (el.tagName === 'SELECT') return false;
    if (r.k === 'janm') return ['text', 'date', 'tel', 'number'].indexOf(t) >= 0;
    if (r.k === 'email') return ['text', 'email'].indexOf(t) >= 0;
    if (r.k === 'mobile' || r.k === 'pincode') return ['text', 'tel', 'number'].indexOf(t) >= 0;
    if (r.k === 'pata') return el.tagName === 'TEXTAREA' || t === 'text';
    return t === 'text';
  }

  // ---------- Candidates ----------
  var cands = [];
  fields.forEach(function (el) {
    var best = 0, keys = [];
    RULES.forEach(function (r) {
      if (!typeOk(el, r)) return;
      var s = score(el, r);
      if (s >= 3) {
        if (s > best) { best = s; keys = [r]; } else if (s === best) { keys.push(r); }
      }
    });
    // ek field ke liye do key barabar - galat bharne se behtar hai chhod do
    if (keys.length === 1) cands.push({ el: el, r: keys[0], s: best });
    else if (keys.length > 1 && P[keys[0].k]) { add(keys[0].k, 'warn', 'Ek field kai cheezon se mil raha hai. Khud bharein.'); markWarn(el); }
  });

  function markWarn(el) { el.style.outline = '3px solid #FB8C00'; el.style.backgroundColor = '#FFF3E0'; }
  function markOk(el) { el.style.outline = '3px solid #43A047'; el.style.backgroundColor = '#F1F8E9'; }
  function markBad(el) { el.style.outline = '3px solid #E53935'; el.style.backgroundColor = '#FFEBEE'; }

  function setVal(el, v) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  }
  function digits(s) { return (s || '').replace(/\D/g, ''); }
  function same(k, got, want) {
    if (k === 'mobile' || k === 'pincode' || k === 'janm') return digits(got) === digits(want);
    return clean(got) === clean(want);
  }
  function dobText(el, isoStr) {
    var iso = (isoStr || P.janm).split('-'); // YYYY-MM-DD
    var t = (el.type || '').toLowerCase();
    if (t === 'date') return { v: isoStr || P.janm, sure: true };
    var ph = clean([el.placeholder, labelOf(el)].join(' ')).replace(/ /g, '');
    var sep = (el.placeholder || '').match(/[\/\-.]/);
    sep = sep ? sep[0] : '/';
    if (/yyyy.?mm.?dd/.test(ph)) return { v: [iso[0], iso[1], iso[2]].join(sep), sure: true };
    if (/mm.?dd.?yyyy/.test(ph)) return { v: [iso[1], iso[2], iso[0]].join(sep), sure: true };
    if (/dd.?mm.?yyyy/.test(ph)) return { v: [iso[2], iso[1], iso[0]].join(sep), sure: true };
    return { v: [iso[2], iso[1], iso[0]].join(sep), sure: false };
  }

  async function typeInto(el, k, text) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(400);
    el.focus();
    for (var c = 1; c <= text.length; c++) {
      while (N.paused && !N.stop) await sleep(200);
      if (N.stop) return false;
      setVal(el, text.slice(0, c));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(SPEED);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    await sleep(250);
    return true;
  }

  // ---------- Text fields: har key me sabse achha ek ----------
  var filled = {};
  for (var ri = 0; ri < RULES.length; ri++) {
    var r = RULES[ri];
    if (!P[r.k]) continue;
    var list = cands.filter(function (c) { return c.r.k === r.k; })
      .sort(function (x, y) { return y.s - x.s; });
    if (list.length === 0) continue;
    if (list.length > 1 && list[0].s - list[1].s < 1) {
      add(r.k, 'warn', r.n + ': form me 2 jagah mil raha hai. Sahi wali aap chunein.');
      markWarn(list[0].el); markWarn(list[1].el);
      continue;
    }
    if (N.stop) { say('AI ruk gaya.'); add('all', 'warn', 'Beech me roka gaya.'); finish(); return; }
    var el = list[0].el;
    var text = P[r.k], sure = true;
    if (r.k === 'janm') { var d = dobText(el); text = d.v; sure = d.sure; }
    if (el.readOnly || el.disabled) { add(r.k, 'warn', r.n + ': ye field lock ya date-picker hai. Aap khud chunein.'); markWarn(el); continue; }
    if (el.maxLength > 0 && text.length > el.maxLength) { add(r.k, 'warn', r.n + ': field chhota hai, aap khud bharein.'); markWarn(el); continue; }
    if (el.value && el.value.length > 0) {
      if (same(r.k, el.value, text)) { add(r.k, 'ok', r.n + ': pehle se sahi bhara tha.'); markOk(el); }
      else { add(r.k, 'warn', r.n + ': pehle se kuch bhara hai, maine nahi badla. Check karein.'); markWarn(el); }
      continue;
    }
    say(r.n + ' bhar raha hai...');
    el.style.outline = '3px solid #FFC107';
    var okType = await typeInto(el, r.k, text);
    if (!okType) { say('AI ruk gaya.'); add('all', 'warn', 'Beech me roka gaya.'); finish(); return; }
    // bharne ke baad padh kar check
    if (!same(r.k, el.value, text)) {
      markBad(el);
      add(r.k, 'bad', r.n + ': form ne value badal di (' + (el.value || 'khali') + '). Khud theek karein.');
    } else if (!sure) {
      markWarn(el);
      add(r.k, 'warn', r.n + ': bhar diya, par tareekh ka format form me check karein (DD/MM/YYYY maana).');
    } else {
      markOk(el);
      add(r.k, 'ok', r.n + ': bhar diya.');
    }
    filled[r.k] = true;
    await sleep(200);
  }

  // ---------- Janm tithi dropdowns (din / mahina / saal) ----------
  if (P.janm && !filled.janm) {
    var sels = all.filter(function (e) { return e.tagName === 'SELECT' && shown(e); });
    var iso = P.janm.split('-');
    var Y = parseInt(iso[0], 10), M = parseInt(iso[1], 10), D = parseInt(iso[2], 10);
    var mnames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    function pick(sel, test) {
      for (var i = 0; i < sel.options.length; i++) {
        if (test(sel.options[i])) { sel.selectedIndex = i; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); return true; }
      }
      return false;
    }
    var got = 0, wasDob = 0;
    sels.forEach(function (s) {
      var m = strongOf(s) + ' ' + weakOf(s);
      if (!/dob|birth|janm|जन्म/.test(m) || /place|state|district|city/.test(m)) return;
      if (/year|yyyy|साल|वर्ष/.test(m)) { wasDob++; if (pick(s, function (o) { return parseInt(o.value || o.text, 10) === Y || parseInt(o.text, 10) === Y; })) { got++; markOk(s); } }
      else if (/month|\bmm\b|माह|महीना/.test(m)) { wasDob++; if (pick(s, function (o) { var t = clean(o.text); return parseInt(o.value, 10) === M || parseInt(o.text, 10) === M || t.indexOf(mnames[M - 1]) === 0; })) { got++; markOk(s); } }
      else if (/day|\bdd\b|\bdate\b|दिन/.test(m)) { wasDob++; if (pick(s, function (o) { return parseInt(o.value, 10) === D || parseInt(o.text, 10) === D; })) { got++; markOk(s); } }
    });
    if (wasDob > 0) add('janm', got === wasDob ? 'ok' : 'warn', got === wasDob ? 'Janm tithi: dropdown chun liye.' : 'Janm tithi: kuch dropdown nahi chun paya. Khud dekhein.');
  }

  // ---------- Dropdown / radio: AI khud chunega ----------
  function norm(s) {
    s = (s || '').toString().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z\u0900-\u097f ]/g, ' ').replace(/\s+/g, ' ').trim();
    var alias = { 'orissa': 'odisha', 'uttaranchal': 'uttarakhand', 'nct of delhi': 'delhi', 'national capital territory of delhi': 'delhi', 'gurgaon': 'gurugram', 'pondicherry': 'puducherry' };
    return alias[s] || s;
  }
  var CAT = {
    general: /^(general|gen|ur|unreserved|open|unr)\b|^general/,
    obc: /\bobc\b|other backward|backward class/,
    sc: /^(sc|scheduled caste)\b|scheduled caste/,
    st: /^(st|scheduled tribe)\b|scheduled tribe/,
    ews: /\bews\b|economically weaker/
  };
  var GEN = { male: /^(male|m|man|boy|purush|पुरुष)$/, female: /^(female|f|woman|girl|mahila|महिला)$/, other: /^(other|others|o|transgender|third gender|अन्य)$/ };
  var MAR = { single: /^(single|unmarried|never married|avivahit|अविवाहित)$/, married: /^(married|vivahit|विवाहित)$/ };
  var CHOICES = [
    { k: 'gender', n: 'Gender', pos: /gender|\bsex\b|\bling\b|लिंग/, neg: /certificate|proof/,
      test: function (v) { return function (t) { return GEN[v].test(t); }; } },
    { k: 'marital', n: 'Marital status', pos: /marital|marriage|vaivahik|वैवाहिक/, neg: /certificate|proof/,
      test: function (v) { return function (t) { return MAR[v].test(t); }; } },
    { k: 'category', n: 'Category', pos: /categor|caste|\bclass\b|वर्ग|श्रेणी|जाति/, neg: /sub ?categor|document|certificate|number|\bno\b|exam|post|course|income|horizontal|special|disab|\bpwd\b|ex ?serviceman/,
      test: function (v) { return function (t) { return CAT[v].test(t); }; } },
    { k: 'rajya', n: 'Rajya (State)', pos: /\bstate\b|rajya|राज्य|province/, neg: /birth|place|board|exam|centre|center|bank|school|domicile|college|\bcity\b|union/,
      test: function (v) { var w = norm(v); return function (t) { return norm(t) === w; }; } },
    { k: 'jila', n: 'Jila (District)', pos: /district|\bjila\b|जिला|zila/, neg: /birth|place|exam|centre|center|bank|school|college|domicile/,
      test: function (v) { var w = norm(v); return function (t) { return norm(t) === w; }; } }
  ];
  function optIndexes(sel, test) {
    var hits = [];
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      if (test(clean(o.text)) || test(clean(o.value)) || test(norm(o.text))) hits.push(i);
    }
    return hits;
  }
  function cscore(el, c) {
    var strong = strongOf(el), weak = weakOf(el), near = nearOf(el);
    if (c.neg.test(strong) || c.neg.test(weak) || (near && c.neg.test(near))) return 0;
    var s = 0;
    if (c.pos.test(strong)) s += 3;
    if (c.pos.test(weak)) s += 2;
    if (near && c.pos.test(near)) s += 1;
    return s;
  }
  function pretty(el) {
    var t = (labelOf(el) || el.getAttribute('aria-label') || el.placeholder || el.name || el.id || '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 40) || 'ye field';
  }
  var handledSel = [];

  // ---------- Website kya maang rahi hai jo AI ke paas nahi? ----------
  var xid = N.xid = N.xid || 0;
  function findRadioGroup(ch) {
    var rd = all.filter(function (e) { return (e.type || '').toLowerCase() === 'radio' && shown(e); });
    var gs = {};
    rd.forEach(function (e) { if (e.name) (gs[e.name] = gs[e.name] || []).push(e); });
    var ks = Object.keys(gs);
    for (var i = 0; i < ks.length; i++) {
      var g = gs[ks[i]];
      var gm = clean(ks[i]) + ' ' + clean(g[0].id);
      var fs = g[0].closest('fieldset');
      if (fs && fs.querySelector('legend')) gm += ' ' + clean(fs.querySelector('legend').innerText);
      var pr = g[0].parentElement && g[0].parentElement.parentElement;
      if (pr) gm += ' ' + clean((pr.innerText || '').slice(0, 40));
      if (ch.pos.test(gm) && !ch.neg.test(gm)) return g;
    }
    return null;
  }
  function buildNeeds() {
    var needs = [], seenK = {}, known = [];
    // Zaroori hai ya optional? required attribute, aria-required ya label me * ho to zaroori
    function isReq(e) {
      try {
        return !!(e.required || e.getAttribute('aria-required') === 'true' || /\*/.test(labelOf(e) || '') || /\*/.test(nearOf(e) || ''));
      } catch (x) { return true; }
    }
    cands.forEach(function (c) {
      known.push(c.el);
      if (P[c.r.k]) return;
      var rq = isReq(c.el);
      if (seenK[c.r.k]) {
        if (rq) needs.forEach(function (n) { if (n.key === c.r.k) n.req = true; });
        return;
      }
      seenK[c.r.k] = 1;
      needs.push({ key: c.r.k, label: c.r.n, kind: 'known', req: rq });
    });
    CHOICES.forEach(function (ch) {
      if (P[ch.k] || seenK[ch.k]) return;
      var chReq = false;
      var hasSel = all.some(function (e) {
        if (e.tagName === 'SELECT' && shown(e) && cscore(e, ch) >= 3) { known.push(e); chReq = isReq(e); return true; }
        return false;
      });
      var grp = hasSel ? null : findRadioGroup(ch);
      if (grp) chReq = grp.some(isReq);
      if (hasSel || grp) { seenK[ch.k] = 1; needs.push({ key: ch.k, label: ch.n, kind: 'known', req: chReq }); }
    });
    var extra = 0;
    all.forEach(function (e) {
      if (extra >= 8 || !shown(e) || e.disabled || e.readOnly) return;
      var t = (e.type || 'text').toLowerCase();
      if (skipTypes.indexOf(t) >= 0 || t === 'radio') return;
      if (known.indexOf(e) >= 0) return;
      var m = strongOf(e) + ' ' + weakOf(e);
      if (danger.test(m) || /captcha|otp|verification code/.test(m)) return;
      var empty = e.tagName === 'SELECT' ? e.selectedIndex <= 0 : !(e.value && e.value.length);
      if (!empty) return;
      var req = e.required || e.getAttribute('aria-required') === 'true' || /\*/.test(labelOf(e) || '');
      if (!req) return;
      var id = e.getAttribute('data-narad-id');
      if (!id) { id = 'x' + (++N.xid); e.setAttribute('data-narad-id', id); }
      var n = { id: id, label: pretty(e), kind: e.tagName === 'SELECT' ? 'select' : (t === 'date' ? 'date' : 'text') };
      if (e.tagName === 'SELECT') {
        n.options = [];
        for (var i = 0; i < e.options.length && n.options.length < 40; i++) {
          var ot = (e.options[i].text || '').replace(/\s+/g, ' ').trim();
          if (ot && i > 0) n.options.push(ot.slice(0, 40));
        }
      }
      markWarn(e); extra++;
      needs.push(n);
    });
    try { B.needs(JSON.stringify(needs)); } catch (e) {}
  }
  if (P.__scan) { buildNeeds(); return; }

  for (var ci = 0; ci < CHOICES.length; ci++) {
    var ch = CHOICES[ci];
    var want = P[ch.k];
    if (!want) continue;
    if (N.stop) { say('AI ruk gaya.'); add('all', 'warn', 'Beech me roka gaya.'); finish(); return; }
    var test = ch.test(want);
    var disp = ch.n;
    var done = false;

    // 1) dropdown
    var selC = all.filter(function (e) { return e.tagName === 'SELECT' && shown(e) && handledSel.indexOf(e) < 0; })
      .map(function (e) { return { el: e, s: cscore(e, ch) }; })
      .filter(function (x) { return x.s >= 3; })
      .sort(function (x, y) { return y.s - x.s; });
    if (selC.length > 1 && selC[0].s - selC[1].s < 1) {
      add(ch.k, 'warn', disp + ': 2 dropdown mile. Sahi wala aap chunein.');
      markWarn(selC[0].el); markWarn(selC[1].el); done = true;
    } else if (selC.length > 0) {
      var sel = selC[0].el;
      handledSel.push(sel);
      // state chunne ke baad jila list der se aati hai - intezaar
      var waited = 0;
      while (optIndexes(sel, test).length === 0 && waited < 4000 && (ch.k === 'jila')) { await sleep(300); waited += 300; }
      var hits = optIndexes(sel, test);
      if (sel.disabled) { add(ch.k, 'warn', disp + ': dropdown band hai. Pehle upar ka dropdown chunein.'); markWarn(sel); }
      else if (hits.length === 1) {
        sel.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await sleep(300);
        sel.selectedIndex = hits[0];
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(600);
        if (sel.selectedIndex === hits[0]) { markOk(sel); add(ch.k, 'ok', disp + ': "' + sel.options[hits[0]].text.trim() + '" chun liya.'); }
        else { markBad(sel); add(ch.k, 'bad', disp + ': form ne chuna hua badal diya. Khud chunein.'); }
      } else if (hits.length > 1) {
        add(ch.k, 'warn', disp + ': ek se zyada option match hue. Sahi wala aap chunein.'); markWarn(sel);
      } else {
        add(ch.k, 'warn', disp + ': list me "' + (ch.k === 'rajya' || ch.k === 'jila' ? want : disp) + '" nahi mila. Aap khud chunein.'); markWarn(sel);
      }
      done = true;
    }

    // 2) radio
    if (!done) {
      var radios = all.filter(function (e) { return (e.type || '').toLowerCase() === 'radio' && shown(e); });
      var groups = {};
      radios.forEach(function (e) { if (e.name) (groups[e.name] = groups[e.name] || []).push(e); });
      var gk = Object.keys(groups);
      for (var gi = 0; gi < gk.length && !done; gi++) {
        var grp = groups[gk[gi]];
        var gmeta = clean(gk[gi]) + ' ' + clean(grp[0].id);
        var fs = grp[0].closest('fieldset');
        if (fs && fs.querySelector('legend')) gmeta += ' ' + clean(fs.querySelector('legend').innerText);
        var pr = grp[0].parentElement && grp[0].parentElement.parentElement;
        if (pr) gmeta += ' ' + clean((pr.innerText || '').slice(0, 40));
        if (!ch.pos.test(gmeta) || ch.neg.test(gmeta)) continue;
        var found = [];
        grp.forEach(function (rd) {
          var lt = clean(labelOf(rd) || (rd.nextSibling && rd.nextSibling.textContent) || rd.value);
          if (test(lt) || test(clean(rd.value))) found.push(rd);
        });
        if (found.length === 1) {
          found[0].click();
          await sleep(300);
          if (found[0].checked) { markOk(found[0].parentElement || found[0]); add(ch.k, 'ok', disp + ': chun liya.'); }
          else { add(ch.k, 'bad', disp + ': chun nahi paya. Khud chunein.'); }
        } else {
          add(ch.k, 'warn', disp + ': sahi option pakka nahi mila. Aap chunein.');
          grp.forEach(function (rd) { markWarn(rd.parentElement || rd); });
        }
        done = true;
      }
    }
    if (!done && ['gender', 'marital', 'category', 'rajya', 'jila'].indexOf(ch.k) >= 0) {
      missing.push(ch.n);
    }
  }

  // ---------- Tick boxes ----------
  var boxes = all.filter(function (e) { return (e.type || '').toLowerCase() === 'checkbox' && shown(e); });
  var SAME = /same as|sama as|is same|same address|present address same|permanent address same|correspondence address same|वही|समान/;
  var LEGAL = /declar|i agree|\bagree\b|consent|terms|undertak|certify|hereby|i accept|\baccept\b|सहमत|घोषणा|स्वीकार|शपथ/;
  var ROBOT = /robot|captcha|human/;
  for (var bi = 0; bi < boxes.length; bi++) {
    var bx = boxes[bi];
    var bt = clean(labelOf(bx) || (bx.nextSibling && bx.nextSibling.textContent) || nearOf(bx) || strongOf(bx));
    if (ROBOT.test(bt) || ROBOT.test(weakOf(bx))) {
      markWarn(bx.parentElement || bx); add('otp', 'warn', 'CAPTCHA wala box aap khud tick karein.'); continue;
    }
    var kind = SAME.test(bt) ? 'same' : (LEGAL.test(bt) ? 'legal' : '');
    if (!kind) continue;
    if (bx.disabled) continue;
    if (bx.checked) { markOk(bx.parentElement || bx); continue; }
    if (kind === 'legal' && !P.__declare) {
      markWarn(bx.parentElement || bx);
      add('declare', 'warn', 'Declaration / terms ka box: pehle form ki baatein padh kar aap khud tick karein.');
      continue;
    }
    bx.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(300);
    bx.click();
    await sleep(300);
    if (bx.checked) { markOk(bx.parentElement || bx); add(kind === 'same' ? 'tick' : 'declare', 'ok', kind === 'same' ? 'Box tick kar diya ("same address").' : 'Declaration box aapki ijazat se tick kiya.'); }
    else { markBad(bx.parentElement || bx); add(kind === 'same' ? 'tick' : 'declare', 'bad', 'Box tick nahi ho paya. Khud karein.'); }
  }

  // ---------- User ne website ke naye sawaalon ke jo jawab diye ----------
  if (P.__extra) {
    var exIds = Object.keys(P.__extra);
    for (var xi = 0; xi < exIds.length; xi++) {
      if (N.stop) break;
      var xel = document.querySelector('[data-narad-id="' + exIds[xi] + '"]');
      var xv = String(P.__extra[exIds[xi]] || '');
      if (!xel || !xv) continue;
      var xl = pretty(xel);
      if (xel.tagName === 'SELECT') {
        var want = norm(xv), hit = [];
        for (var oi = 0; oi < xel.options.length; oi++) { if (norm(xel.options[oi].text) === want || norm(xel.options[oi].value) === want) hit.push(oi); }
        if (hit.length === 0) {
          for (var oj = 0; oj < xel.options.length; oj++) { if (want && norm(xel.options[oj].text).indexOf(want) >= 0) hit.push(oj); }
        }
        if (hit.length === 1) {
          xel.selectedIndex = hit[0];
          xel.dispatchEvent(new Event('input', { bubbles: true })); xel.dispatchEvent(new Event('change', { bubbles: true }));
          await sleep(500);
          markOk(xel); add('extra', 'ok', xl + ': "' + xv + '" chun liya.');
        } else { markWarn(xel); add('extra', 'warn', xl + ': sahi option pakka nahi mila. Khud chunein.'); }
      } else {
        var xt = (xel.type || '').toLowerCase() === 'date' ? xv : (/^\d{4}-\d{2}-\d{2}$/.test(xv) ? dobText(xel, xv).v : xv);
        if (xel.maxLength > 0 && xt.length > xel.maxLength) { markWarn(xel); add('extra', 'warn', xl + ': field chhota hai. Khud bharein.'); continue; }
        var okx = await typeInto(xel, 'extra', xt);
        if (!okx) break;
        if (clean(xel.value).replace(/\D/g, '') === clean(xt).replace(/\D/g, '') && clean(xel.value) !== '' ) { markOk(xel); add('extra', 'ok', xl + ': bhar diya.'); }
        else { markBad(xel); add('extra', 'bad', xl + ': form ne value badal di. Khud theek karein.'); }
      }
    }
  }

  // ---------- Jahan AI ko pakka nahi pata: user ko saaf bataye kya karna hai ----------
  var guide = 0;
  all.forEach(function (e) {
    if (guide >= 5 || !shown(e) || e.disabled) return;
    var t = (e.type || '').toLowerCase();
    if (e.tagName === 'SELECT' && handledSel.indexOf(e) < 0 && (e.required || e.getAttribute('aria-required') === 'true') && e.selectedIndex <= 0) {
      markWarn(e); guide++;
      add('guide', 'warn', 'Dropdown "' + pretty(e) + '": apni jaankari ke hisaab se khud chunein.');
    } else if (t === 'checkbox' && e.required && !e.checked && e.style.outline.indexOf('251, 140') < 0 && e.style.outline.indexOf('rgb(251') < 0) {
      markWarn(e.parentElement || e); guide++;
      add('guide', 'warn', 'Box "' + pretty(e) + '": zaroori hai. Padh kar khud tick karein.');
    }
  });

  // ---------- Jo baaki hai wo user ko dikhao ----------
  var asked = {};
  report.forEach(function (x) { asked[x.k] = true; });
  // Naam do tukdo (First / Last) me ho to AI andaza nahi lagata
  if (P.naam && !asked.naam) {
    var splitF = fields.filter(function (e) {
      return /first name|given name|last name|sur ?name|middle name|पहला नाम|उपनाम/.test(strongOf(e) + ' ' + weakOf(e));
    });
    if (splitF.length) {
      splitF.forEach(markWarn);
      add('naam', 'warn', 'Naam: form me First / Last name alag-alag hain. AI andaza nahi lagata, aap khud bharein.');
      asked.naam = true;
    }
  }
  RULES.forEach(function (r) {
    if (P[r.k] && !asked[r.k]) missing.push(r.n);
  });
  if (missing.length) add('skip', 'skip', 'Is page par nahi mile (agle page par ho sakte hain): ' + missing.join(', ') + '.');
  var rem = 0;
  fields.forEach(function (e) {
    if (e.required && !e.value && (e.type || '').toLowerCase() !== 'radio') { markWarn(e); rem++; }
  });
  if (rem > 0) add('baaki', 'warn', rem + ' zaroori field khali hain (orange). Khud bharein.');
  if (N.sawOtp) add('otp', 'warn', 'CAPTCHA / OTP aap khud bharein.');

  var ok = report.filter(function (x) { return x.st === 'ok'; }).length;
  if (ok > 0) say(ok + ' field bhare. Report dekhein, phir khud Submit karein.');
  finish();
  buildNeeds();
  }

  // ---------- Page me naya field aaye to AI khud dobara dekhe ----------
  if (!N.watching) {
    N.watching = true; N.runs = 0;
    var sig = function () {
      return Array.prototype.slice.call(document.querySelectorAll('input,select,textarea')).filter(vis)
        .map(function (e) { return e.name || e.id || e.type; }).join('|');
    };
    var last = sig(), tmr = null;
    new MutationObserver(function () {
      if (N.stop) return;
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        var now = sig();
        if (now !== last && N.runs < 25) { last = now; N.runs++; N.run(); }
      }, 1500);
    }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
  N.run();
})();
