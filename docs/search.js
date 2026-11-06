// NaradSearch - apna search engine (browser me chalta hai, koi server nahi)
(function (root) {
  // Hinglish / galat spelling -> asli shabd
  var SYN = {
    bharti: ['recruitment', 'vacancy', 'भर्ती', 'notification'], bharty: ['recruitment', 'vacancy', 'भर्ती'],
    vacancy: ['recruitment', 'vacancy', 'भर्ती'], vacancies: ['vacancy', 'recruitment'],
    job: ['recruitment', 'vacancy', 'भर्ती'], jobs: ['recruitment', 'vacancy', 'भर्ती'],
    naukri: ['recruitment', 'vacancy', 'भर्ती'], recruitment: ['recruitment', 'vacancy', 'भर्ती'], भर्ती: ['भर्ती', 'recruitment', 'vacancy'],
    result: ['result', 'परिणाम', 'रिजल्ट'], results: ['result', 'परिणाम'], parinam: ['result', 'परिणाम'],
    parinaam: ['result', 'परिणाम'], rijalt: ['result', 'रिजल्ट'], रिजल्ट: ['रिजल्ट', 'result', 'परिणाम'], परिणाम: ['परिणाम', 'result'],
    admit: ['admit', 'प्रवेश', 'एडमिट'], admitcard: ['admit card', 'एडमिट कार्ड'], hallticket: ['hall ticket', 'admit card'],
    एडमिट: ['एडमिट', 'admit'], sipahi: ['constable', 'सिपाही'], सिपाही: ['सिपाही', 'constable'], constable: ['constable', 'सिपाही'],
    grup: ['group'], gropu: ['group'], railway: ['railway', 'rrb', 'रेलवे'], रेलवे: ['रेलवे', 'railway', 'rrb'],
    rrb: ['rrb', 'railway'], police: ['police', 'पुलिस'], पुलिस: ['पुलिस', 'police'], teacher: ['teacher', 'शिक्षक', 'tet'],
    shikshak: ['teacher', 'शिक्षक'], शिक्षक: ['शिक्षक', 'teacher']
  };
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i], best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function daysAgo(iso, now) {
    if (!iso) return 999;
    var t = Date.parse(iso + 'T00:00:00Z');
    return isNaN(t) ? 999 : Math.floor((now - t) / 86400000);
  }
  // ek query-shabd (aur uske samaanarthi) title me kitna milta hai
  function tokenScore(forms, text, words) {
    var best = 0, i, f, w;
    for (i = 0; i < forms.length; i++) {
      f = forms[i];
      if (text.indexOf(f) >= 0) {
        var s = 3;
        for (w = 0; w < words.length; w++) { if (words[w].indexOf(f) === 0) { s = 4; break; } }
        if (s > best) best = s;
      } else if (f.length >= 4 && /^[a-z0-9]+$/.test(f)) {
        var max = f.length >= 7 ? 2 : 1;
        for (w = 0; w < words.length; w++) {
          if (words[w].length >= 4 && lev(f, words[w], max) <= max) { if (best < 2) best = 2; break; }
        }
      }
    }
    return best;
  }
  function search(items, query, kind, now) {
    now = now || Date.now();
    var toks = norm(query).split(' ').filter(Boolean);
    var groups = toks.map(function (t) { return [t].concat(SYN[t] || []).map(norm); });
    var out = [];
    items.forEach(function (it) {
      if (kind && kind !== 'all' && it.kind !== kind) return;
      var age = daysAgo(it.first_seen, now);
      var score = 0;
      if (groups.length) {
        var text = norm(it.title), words = text.split(' '), src = norm(it.source);
        for (var g = 0; g < groups.length; g++) {
          var s = tokenScore(groups[g], text, words);
          if (!s) s = tokenScore(groups[g], src, src.split(' ')) ? 1 : 0;
          if (!s) return; // har shabd milna chahiye
          score += s;
        }
      }
      score += age <= 3 ? 1.5 : age <= 14 ? 0.5 : 0;
      out.push({ it: it, score: score, age: age });
    });
    out.sort(function (a, b) { return b.score - a.score || (a.it.first_seen < b.it.first_seen ? 1 : -1); });
    return out;
  }
  root.NaradSearch = { search: search, norm: norm, lev: lev, daysAgo: daysAgo };
  if (typeof module !== 'undefined') module.exports = root.NaradSearch;
})(typeof window !== 'undefined' ? window : globalThis);
