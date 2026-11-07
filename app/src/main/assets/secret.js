(function () {
  var V = __VALUE__, PROBE = __PROBE__;
  try {
    function vis(e) {
      var r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    }
    var ins = [].slice.call(document.querySelectorAll('input[type=password]')).filter(function (e) {
      return vis(e) && !e.disabled && !e.readOnly && !e.value;
    });
    if (PROBE) return String(ins.length);
    if (!V) return 'ok:0';
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    ins.forEach(function (e) {
      setter.call(e, V);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
      e.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    return 'ok:' + ins.length;
  } catch (e) {
    return 'err';
  }
})()
