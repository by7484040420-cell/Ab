(function () {
  try {
    var txt = (document.body ? document.body.innerText : '').replace(/\n{3,}/g, '\n\n').slice(0, 16000);
    var seen = {}, list = [];
    [].slice.call(document.querySelectorAll('a[href]')).forEach(function (a) {
      var u = a.href || '';
      if (u.indexOf('https://') !== 0 || seen[u]) return;
      seen[u] = 1;
      var t = (a.innerText || a.title || '').replace(/\s+/g, ' ').trim();
      var row = a.closest('tr,li,p,div');
      var c = row ? (row.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140) : '';
      var ctx = (t + ' ' + c).toLowerCase();
      var s = 0;
      if (/apply online|online apply|apply now|online application|application form|आवेदन|registration|apply/.test(ctx)) s += 5;
      if (/\.gov\.in|\.nic\.in/.test(u)) s += 2;
      if (/notification|advertisement|विज्ञापन|syllabus|result|admit|answer key|whatsapp|telegram|youtube|facebook|instagram|twitter/.test(ctx)) s -= 4;
      if (s > 0) list.push({ t: t.slice(0, 60), u: u, s: s });
    });
    list.sort(function (a, b) { return b.s - a.s; });
    return JSON.stringify({ text: txt, links: list.slice(0, 8) });
  } catch (e) {
    return JSON.stringify({ text: '', links: [] });
  }
})()
