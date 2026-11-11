// Narad AI Injected Engine - Runs inside any real website in the in-app browser
(function () {
  console.log('[Narad AI] In-App Auto-Fill Engine active on:', window.location.href);

  // Default profile fallback if not passed via window
  var P = window.__naradProfile || {
    naam: 'Rahul Kumar Sharma',
    pita: 'Suresh Kumar Sharma',
    mata: 'Sunita Devi',
    janm: '1998-08-15',
    mobile: '9876543210',
    email: 'rahul.sharma@gmail.com',
    pata: 'Gram - Rampur, Post - Rampur Bazzar, Thana - Sadar',
    pincode: '800001',
    gender: 'male',
    rajya: 'Bihar',
    jila: 'Patna',
    category: 'obc',
    marital: 'single',
    education: 'Graduate (B.Sc Computer Science, 2020)',
    pan_number: 'ABCDE1234F',
    voter_id: 'BR0102312345',
    blood_group: 'B+',
    board_10th: 'BSEB Patna',
    roll_10th: '201402891',
    marks_10th: '82.4%',
    passing_year_10th: '2014',
    board_12th: 'BSEB Patna',
    roll_12th: '201604128',
    marks_12th: '79.6%',
    stream_12th: 'Science (PCM)',
    graduation_degree: 'B.Sc Computer Science',
    college_name: 'Patna Science College',
    vehicle_class: 'MCWG + LMV (Bike & Car)',
    rto_office: 'BR01 - Patna RTO',
    birth_place: 'Patna, Bihar'
  };

  // Listen to postMessage from parent app
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'NARAD_UPDATE_PROFILE') {
      P = Object.assign({}, P, e.data.profile);
    }
    if (e.data && e.data.type === 'NARAD_TRIGGER_AUTOFILL') {
      runAutoFill();
    }
  });

  // Create In-Page Floating HUD Bar
  function createHud() {
    if (document.getElementById('narad-ai-floating-hud')) return;

    var hud = document.createElement('div');
    hud.id = 'narad-ai-floating-hud';
    hud.style.cssText = [
      'position: fixed',
      'top: 10px',
      'right: 10px',
      'z-index: 2147483647',
      'background: #0B1B3F',
      'color: #ffffff',
      'padding: 10px 14px',
      'border-radius: 12px',
      'box-shadow: 0 10px 25px rgba(0,0,0,0.5)',
      'border: 2px solid #E53935',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 13px',
      'display: flex',
      'align-items: center',
      'gap: 10px',
      'transition: all 0.3s ease',
      'max-width: 95vw'
    ].join(';');

    hud.innerHTML = [
      '<div style="width:24px;height:24px;background:#e53935;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;">N</div>',
      '<div style="line-height:1.2;">',
        '<div style="font-weight:bold;font-size:12px;color:#fde047;">⚡ Narad AI Auto-Filler</div>',
        '<div style="font-size:10px;color:#94a3b8;" id="narad-hud-status">Original Website Connected</div>',
      '</div>',
      '<button id="narad-hud-btn" style="background:#22c55e;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-weight:bold;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(34,197,94,0.4);white-space:nowrap;">',
        '✨ Ek Click me Bharo',
      '</button>',
      '<button id="narad-hud-close" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 4px;">✕</button>'
    ].join('');

    document.body.appendChild(hud);

    document.getElementById('narad-hud-btn').onclick = function () {
      runAutoFill();
    };

    document.getElementById('narad-hud-close').onclick = function () {
      hud.style.display = 'none';
    };
  }

  function cln(s) {
    return (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, ' ');
  }

  function metaOf(el) {
    var lbl = '';
    if (el.labels) {
      for (var i = 0; i < el.labels.length; i++) lbl += ' ' + el.labels[i].innerText;
    }
    return cln([el.name, el.id, el.placeholder, el.title, el.getAttribute('aria-label'), lbl].join(' '));
  }

  async function runAutoFill() {
    var btn = document.getElementById('narad-hud-btn');
    var status = document.getElementById('narad-hud-status');
    if (btn) btn.innerText = '⚡ AI Soch Raha Hai...';
    if (status) status.innerText = 'Gemini AI API se fields analyze ho rahe hain...';

    var filledCount = 0;
    var skipPay = /card|cvv|cvc|upi|vpa|netbanking|atm/i;
    var skipSec = /captcha|otp|password|passcode/i;

    // Extract all visible form elements to send to Gemini API
    var elementsToSend = [];
    var allInputs = Array.prototype.slice.call(
      document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), textarea, select')
    );

    allInputs.forEach(function (el) {
      if (el.style.display === 'none' || el.disabled || el.readOnly) return;
      var m = metaOf(el);
      if (skipPay.test(m) || skipSec.test(m)) return;
      var key = el.id || el.name;
      if (!key) return;

      elementsToSend.push({
        id: key,
        name: el.name || '',
        tag: el.tagName.toLowerCase(),
        type: (el.type || el.tagName).toLowerCase(),
        placeholder: el.placeholder || '',
        label: metaOf(el),
        options: el.tagName === 'SELECT'
          ? Array.prototype.slice.call(el.options).map(function (o) { return o.text.trim(); }).filter(Boolean).slice(0, 30)
          : []
      });
    });

    // Try calling Gemini API via /api/ai-autofill
    var apiMapping = {};
    try {
      var apiRes = await fetch('/api/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: elementsToSend.slice(0, 40),
          profile: P,
          portalName: document.title
        })
      });
      if (apiRes.ok) {
        var resData = await apiRes.json();
        if (resData.mapping) {
          apiMapping = resData.mapping;
        }
      }
    } catch (e) {
      console.warn('[Narad AI] API mapping fetch fallback:', e);
    }

    // Apply Gemini API mappings first
    if (Object.keys(apiMapping).length > 0) {
      for (var fKey in apiMapping) {
        var targetEl = document.getElementById(fKey) || document.querySelector('[name="' + fKey + '"]');
        if (targetEl && !targetEl.disabled && !targetEl.readOnly) {
          var valToSet = apiMapping[fKey];
          if (targetEl.tagName === 'SELECT') {
            selectMatchingOption(targetEl, String(valToSet));
          } else if (targetEl.type === 'checkbox') {
            targetEl.checked = Boolean(valToSet);
            targetEl.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            targetEl.value = String(valToSet);
          }
          highlight(targetEl);
          filledCount++;
        }
      }
    }

    var rules = [
      { k: 'naam', val: P.naam, pos: /\b(full name|applicant name|candidate name|naam|name)\b|नाम/, neg: /father|mother|spouse|city|school|college/ },
      { k: 'pita', val: P.pita, pos: /father|pita|guardian|पिता/, neg: /mother|mobile|email|phone/ },
      { k: 'mata', val: P.mata, pos: /mother|mata|माता/, neg: /father|mobile|email/ },
      { k: 'mobile', val: P.mobile, pos: /mobile|phone|contact|मोबाइल/, neg: /alt|emergency|parent|father/ },
      { k: 'email', val: P.email, pos: /e?mail|ईमेल/, neg: /alt|parent|father/ },
      { k: 'pincode', val: P.pincode, pos: /pin ?code|zip|postal|पिन/, neg: /security|otp/ },
      { k: 'pata', val: P.pata, pos: /address|pata|resident|permanent address|पता/, neg: /email/ },
      { k: 'pan', val: P.pan_number, pos: /\bpan\b|pan number|permanent account/, neg: /father|mother/ },
      { k: 'voter', val: P.voter_id, pos: /voter|epic|matdata/, neg: /date/ },
      { k: 'blood', val: P.blood_group, pos: /blood ?group|rakht/, neg: /date/ },
      { k: 'roll10', val: P.roll_10th, pos: /10th roll|matric roll|high school roll/, neg: /year|mark/ },
      { k: 'marks10', val: P.marks_10th, pos: /10th mark|matric mark|high school percentage/, neg: /roll/ },
      { k: 'roll12', val: P.roll_12th, pos: /12th roll|inter roll|intermediate roll/, neg: /year/ },
      { k: 'degree', val: P.graduation_degree, pos: /degree|graduation|qualification/, neg: /roll/ },
      { k: 'college', val: P.college_name, pos: /college|university|institute/, neg: /roll/ },
      { k: 'vehicle', val: P.vehicle_class, pos: /vehicle|class of vehicle|cov/, neg: /number/ },
      { k: 'rto', val: P.rto_office, pos: /rto|licensing authority/, neg: /number/ },
      { k: 'bplace', val: P.birth_place, pos: /birth ?place|place of birth|janmasthan/, neg: /date/ }
    ];

    // 1. Process Text Inputs & Textareas
    var inputs = Array.prototype.slice.call(
      document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), textarea')
    );

    inputs.forEach(function (el) {
      if (el.style.display === 'none' || el.disabled || el.readOnly) return;
      var m = metaOf(el);
      if (skipPay.test(m) || skipSec.test(m)) return;

      // Handle DOB
      if (el.type === 'date' || /dob|birth|janm/.test(m)) {
        if (P.janm) {
          var parts = P.janm.split('-');
          el.value = el.type === 'date' ? P.janm : (parts[2] + '/' + parts[1] + '/' + parts[0]);
          highlight(el);
          filledCount++;
          return;
        }
      }

      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.val && r.pos.test(m) && !r.neg.test(m)) {
          el.value = r.val;
          highlight(el);
          filledCount++;
          break;
        }
      }
    });

    // 2. Process Select Dropdowns (State, District, Gender, Category)
    var selects = Array.prototype.slice.call(document.querySelectorAll('select'));
    selects.forEach(function (sel) {
      if (sel.style.display === 'none' || sel.disabled) return;
      var sm = metaOf(sel);

      // State
      if (/state|rajya/.test(sm) && P.rajya) {
        selectMatchingOption(sel, P.rajya);
        highlight(sel);
        filledCount++;
      }
      // District
      else if (/district|jila/.test(sm) && P.jila) {
        selectMatchingOption(sel, P.jila);
        highlight(sel);
        filledCount++;
      }
      // Gender
      else if (/gender|sex|ling/.test(sm) && P.gender) {
        var targetG = P.gender === 'male' ? 'male' : (P.gender === 'female' ? 'female' : 'other');
        selectMatchingOption(sel, targetG);
        highlight(sel);
        filledCount++;
      }
      // Category
      else if (/category|caste|varg/.test(sm) && P.category) {
        selectMatchingOption(sel, P.category);
        highlight(sel);
        filledCount++;
      }
      // Blood Group
      else if (/blood/.test(sm) && P.blood_group) {
        selectMatchingOption(sel, P.blood_group);
        highlight(sel);
        filledCount++;
      }
    });

    // 3. Process Radio buttons (Gender, Marital status)
    var radios = Array.prototype.slice.call(document.querySelectorAll('input[type=radio]'));
    radios.forEach(function (rd) {
      var rm = metaOf(rd);
      if (P.gender && /gender|sex/.test(rm)) {
        if ((P.gender === 'male' && /male|purush/.test(rm)) ||
            (P.gender === 'female' && /female|mahila/.test(rm))) {
          rd.checked = true;
          rd.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      }
    });

    // 4. Process Checkboxes (Same Address & Declaration)
    var checks = Array.prototype.slice.call(document.querySelectorAll('input[type=checkbox]'));
    checks.forEach(function (cb) {
      var cm = metaOf(cb);
      if (/same as|permanent same|correspondence/.test(cm)) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
      if (/agree|accept|declaration|consent|shapath/.test(cm) && !/captcha|robot/.test(cm)) {
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    });

    if (btn) btn.innerText = '✔ ' + filledCount + ' Fields Bhare!';
    if (status) status.innerText = filledCount + ' fields bhare. CAPTCHA & OTP khud dalein.';

    // Send result to parent window
    try {
      window.parent.postMessage({
        type: 'NARAD_AUTOFILL_COMPLETED',
        filledCount: filledCount,
        url: window.location.href
      }, '*');
    } catch (e) {}

    // Show top notification
    showToast(filledCount);
  }

  function highlight(el) {
    el.style.backgroundColor = '#dcfce7';
    el.style.border = '2px solid #22c55e';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function selectMatchingOption(sel, textToMatch) {
    var want = (textToMatch || '').toLowerCase().trim();
    for (var i = 0; i < sel.options.length; i++) {
      var optText = (sel.options[i].text || '').toLowerCase().trim();
      var optVal = (sel.options[i].value || '').toLowerCase().trim();
      if (optText.includes(want) || optVal.includes(want)) {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  function showToast(count) {
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position: fixed',
      'top: 60px',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 2147483647',
      'background: #0B1B3F',
      'color: #ffffff',
      'padding: 12px 20px',
      'border-radius: 14px',
      'box-shadow: 0 10px 30px rgba(0,0,0,0.5)',
      'border: 2px solid #22c55e',
      'font-family: sans-serif',
      'font-size: 13px',
      'text-align: center',
      'max-width: 90vw'
    ].join(';');

    toast.innerHTML = [
      '<div style="font-weight:bold;color:#4ade80;font-size:14px;margin-bottom:2px;">⚡ Narad AI Auto-Fill Complete!</div>',
      '<div>Asli website ke <strong>' + count + ' fields</strong> safaltapoorvak bhar diye gaye hain.</div>',
      '<div style="color:#fde047;font-size:11px;margin-top:4px;">Security Check: Bas Image CAPTCHA aur Mobile OTP khud verify karke submit karein.</div>'
    ].join('');

    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 6000);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHud);
  } else {
    createHud();
  }
})();
