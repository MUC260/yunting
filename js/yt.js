/* =========================================================================
   云听 YUNTING —— 框架层（yt.js）
   存档 / 门禁 / 分级提示 / Web Audio 合成音 / 波形 / 摩斯 / 小工具
   零音频文件：所有声音实时合成
   ========================================================================= */
window.YT = (function () {
  'use strict';

  var KEY = 'yunting_v1';

  var DEF = {
    entered: false,     // 是否完成"免费听力自测"（翻面）
    done: [],           // 已完成的工单 id
    letters: {},        // id -> 摩斯字母
    wrote: '',          // 第 7 单写的祭文
    name: '',           // 听道编号
    ended: '',          // 'good' | 'bad'
    visited: 0,         // 访问次数（元恐怖）
    since: 0            // 首次进入时间戳
  };

  var state = load();

  function load() {
    var s = {}, k;
    for (k in DEF) { s[k] = DEF[k]; }
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        for (k in DEF) { if (o[k] !== undefined) { s[k] = o[k]; } }
      }
    } catch (e) {}
    if (!s.since) { s.since = Date.now(); }
    return s;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------------- 小工具 ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (html != null) { e.innerHTML = html; }
    return e;
  }
  var toastTimer = null;
  function toast(msg, ms) {
    var t = document.getElementById('toast');
    if (!t) { return; }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('on'); }, ms || 2200);
  }

  /* ---------------- 声音（Web Audio 实时合成） ---------------- */
  var ctx = null, master = null;

  function ac() {
    if (ctx) { return ctx; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) { return null; }
    try {
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function unlock() {
    var c = ac();
    if (c && c.state === 'suspended') { c.resume(); }
  }
  function tone(freq, dur, vol, type, delay) {
    var c = ac(); if (!c) { return; }
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.1, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, lp) {
    var c = ac(); if (!c) { return; }
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * (1 - i / len); }
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp || 900;
    var g = c.createGain(); g.gain.value = vol || 0.08;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  var MORSE = {
    A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',
    K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',
    U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
    '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
  };

  /* 单个字母的摩斯（可带延迟基线，用于串播） */
  function morse(ch, at, unit) {
    var code = MORSE[String(ch).toUpperCase()];
    if (!code) { return at || 0; }
    var u = unit || 0.09;
    var t = at || 0;
    for (var i = 0; i < code.length; i++) {
      var d = code[i] === '.' ? u : u * 3;
      tone(660, d * 0.9, 0.16, 'sine', t);
      t += d + u;
    }
    return t + u * 2;
  }
  function playLetters(str) {
    unlock();
    var t = 0;
    for (var i = 0; i < str.length; i++) { t = morse(str[i], t, 0.09); }
  }

  /* 工单环境音：低频底噪 + 偶发脉冲 */
  function ambience(sec) {
    unlock();
    noise(Math.min(sec || 6, 8), 0.05, 420);
    tone(55, Math.min(sec || 6, 8), 0.03, 'sine');
  }
  function beep() { unlock(); tone(880, 0.09, 0.10, 'sine'); }
  function buzz() { unlock(); tone(120, 0.35, 0.10, 'square'); }
  function ring() { unlock(); tone(440, 0.25, 0.12, 'sine'); tone(480, 0.25, 0.10, 'sine', 0.3); }
  function hiss() { unlock(); noise(1.2, 0.10, 2400); }

  /* ---------------- 波形（每个字母一条，用于"听力档案"） ---------------- */
  function drawWave(canvas, ch, solved) {
    if (!canvas) { return; }
    var w = canvas.width = 68, h = canvas.height = 52;
    var g = canvas.getContext('2d');
    g.clearRect(0, 0, w, h);
    if (!solved) {
      g.strokeStyle = '#cfd8e2'; g.beginPath();
      g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      return;
    }
    var seed = String(ch).charCodeAt(0) || 65;
    g.strokeStyle = '#1668c4'; g.lineWidth = 1.5; g.beginPath();
    for (var x = 0; x < w; x++) {
      var amp = (Math.sin((x + seed) * 0.55) * 0.5 + Math.sin((x + seed) * 0.17) * 0.5) * (h * 0.34);
      var y = h / 2 + amp * (0.4 + ((seed % 7) / 10));
      if (x === 0) { g.moveTo(x, y); } else { g.lineTo(x, y); }
    }
    g.stroke();
  }

  /* ---------------- 分级提示（答错 3 次 / 5 次逐级给） ---------------- */
  var HINTS = {
    0: ['先看看借书卡……不，先看看这一单的委托备注。',
        '委托备注里写了要做什么，工单上那三个开关是干什么的？',
        '把「电源」「电量」「左右耳」三个开关都点开。'],
    1: ['四条频段线要接到耳廓图上对应的位置。',
        '左边是频段，右边是耳廓上的点位，名字对得上就能接。',
        '点左边一个、再点右边一个，四对都接上即可。'],
    2: ['这一单不需要你动手，只需要你别动。',
        '保持二十秒不移动鼠标、不按键。',
        '把手离开键盘和鼠标，等计时器走完。'],
    3: ['碑侧还有一列字，被挡住了。',
        '把取景框拖窄一点，挡住的部分就会露出来。',
        '拖动取景框右边缘，把宽度收到一半左右。'],
    4: ['刻字里藏着一个频率数字。',
        '把想读的那一行滚到中间的红色基准线上，停住。',
        '滚动或拖动滚轴，让目标行对准红线并保持一秒。'],
    5: ['增益要推到绿区，但不能过。',
        '按住不放会一直涨，松手就停。',
        '按住，让指针停进绿色区间，再松手。连续三次。'],
    6: ['这一单要你替家属写祭文。',
        '守则说：请用自己的话写，不要复述逝者原话。',
        '写满二十个字以上，且不要连续照抄录音里的六字以上。'],
    7: ['引路符要一笔画完。',
        '从左上起笔，顺时针绕一圈，中间一竖收尾。',
        '按住不放，一笔画出一个闭合的圈加一竖。'],
    8: ['这一单要你离开。',
        '守夜期间不要守着屏幕。',
        '切到别的标签页或锁屏，满六十秒再回来。'],
    9: ['碑上的名字刻错了。',
        '这一页上的字，其实你是可以改的。',
        '按 F12 打开开发者工具，把碑文里那个错字改对。'],
    10:['这一单要两台终端同时对时。',
        '验配端会出一个六位口令。',
        '另开一个标签页打开「联合调试」，把口令填进去。'],
    11:['这一单不需要你做什么。',
        '公司让你别听，你就别听。',
        '点「摘下耳机」。']
  };

  function hint(id, level) {
    var h = HINTS[id] || ['……'];
    return h[Math.min(level, h.length - 1)];
  }

  /* ---------------- 元恐怖数据 ---------------- */
  function bumpVisit() {
    state.visited = (state.visited || 0) + 1;
    save();
  }
  function minutesInside() {
    return Math.max(0, Math.round((Date.now() - (state.since || Date.now())) / 60000));
  }
  function deviceName() {
    /* 浏览器能读到的输出设备：优先用 UA 里的平台信息，读不到就退回"未识别" */
    var ua = navigator.userAgent || '';
    if (/Windows/.test(ua)) { return 'Windows 音频设备（默认）'; }
    if (/Mac OS X/.test(ua)) { return 'Mac 音频设备（默认）'; }
    if (/Android/.test(ua)) { return 'Android 音频设备（默认）'; }
    if (/iPhone|iPad/.test(ua)) { return 'iOS 音频设备（默认）'; }
    return '未识别输出设备';
  }

  return {
    state: state,
    save: save,
    $: $, $$: $$, esc: esc, el: el, toast: toast,
    audio: {
      unlock: unlock, tone: tone, noise: noise, beep: beep, buzz: buzz,
      ring: ring, hiss: hiss, ambience: ambience, morse: morse,
      playLetters: playLetters
    },
    drawWave: drawWave,
    hint: hint,
    bumpVisit: bumpVisit,
    minutesInside: minutesInside,
    deviceName: deviceName,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
