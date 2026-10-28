/* =========================================================================
   云听 YUNTING —— 12 章交互模块（chapters.js）
   每章一个不同的玩家动作，互不重复；只有第 7 章需要打字。
   ========================================================================= */
window.CH = (function () {
  'use strict';
  var Y = window.YT;
  var CH = {};

  /* ---------- 1 开机：点三个开关 ---------- */
  CH[1] = {
    name: '开机',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 1 步　接入设备</h3>' +
        '<p class="tip">按《听道守则》第二条，报工时只说「云听，您好」。先把手上的设备接上。</p>' +
        '<div class="switch" id="sws">' +
          '<div class="sw" data-k="power"><div class="n">电源</div><div class="v">关</div></div>' +
          '<div class="sw" data-k="batt"><div class="n">电量</div><div class="v">—</div></div>' +
          '<div class="sw" data-k="ear"><div class="n">左右耳</div><div class="v">未接入</div></div>' +
        '</div>' +
        '<p class="tip" id="swtip">三个都要接上，缺一个，录音进不来。</p>';
      var on = {};
      Y.$$('#sws .sw', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-k');
          on[k] = !on[k];
          b.classList.toggle('on', on[k]);
          b.querySelector('.v').textContent =
            k === 'power' ? (on[k] ? '开' : '关') :
            k === 'batt' ? (on[k] ? '97%' : '—') :
            (on[k] ? '已接入' : '未接入');
          Y.audio.beep();
          if (on.power && on.batt && on.ear) {
            Y.$('#swtip', host).textContent = '设备已接入。录音开始。';
            Y.audio.ambience(4);
            setTimeout(api.done, 700);
          }
        });
      });
    }
  };

  /* ---------- 2 验配：把频段接到耳廓点位 ---------- */
  CH[2] = {
    name: '验配',
    render: function (host, order, api) {
      var L = [
        { k: '250Hz', n: '低频段　250 Hz' },
        { k: '1kHz', n: '中频段　1 kHz' },
        { k: '4kHz', n: '高频段　4 kHz' },
        { k: '8kHz', n: '极高频　8 kHz' }
      ];
      var R = [
        { k: '8kHz', n: '耳　垂' },
        { k: '250Hz', n: '耳甲腔' },
        { k: '4kHz', n: '耳　屏' },
        { k: '1kHz', n: '耳道口' }
      ];
      function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
      var LL = shuffle(L), RR = shuffle(R);
      host.innerHTML =
        '<h3>第 2 步　频段对位</h3>' +
        '<p class="tip">把四条频段线接到耳廓上对应的点位。先点左边一条，再点右边一个点。</p>' +
        '<div class="pairs">' +
          '<div class="col-l">' + LL.map(function (x) { return '<div class="pin" data-side="l" data-k="' + x.k + '">' + x.n + '</div>'; }).join('') + '</div>' +
          '<div class="col-r">' + RR.map(function (x) { return '<div class="pin" data-side="r" data-k="' + x.k + '">' + x.n + '<span style="color:#9aa4ae;font-size:11px">　' + x.k + '</span></div>'; }).join('') + '</div>' +
        '</div>' +
        '<p class="tip" id="p2tip">已接 0 / 4</p>';
      var sel = null, n = 0;
      Y.$$('.pin', host).forEach(function (p) {
        p.addEventListener('click', function () {
          if (p.classList.contains('done')) { return; }
          if (p.getAttribute('data-side') === 'l') {
            Y.$$('.pin[data-side="l"]', host).forEach(function (x) { x.classList.remove('sel'); });
            p.classList.add('sel'); sel = p; Y.audio.beep();
          } else if (sel) {
            if (sel.getAttribute('data-k') === p.getAttribute('data-k')) {
              sel.classList.remove('sel'); sel.classList.add('done'); p.classList.add('done');
              sel.textContent = sel.textContent + '　✓';
              n++; Y.audio.beep();
              Y.$('#p2tip', host).textContent = '已接 ' + n + ' / 4';
              if (n === 4) { Y.toast('对位完成'); setTimeout(api.done, 600); }
            } else {
              Y.audio.buzz();
              Y.$('#p2tip', host).textContent = '接错了。已接 ' + n + ' / 4';
            }
            sel = null;
          }
        });
      });
    }
  };

  /* ---------- 3 屏息：静止 20 秒 ---------- */
  CH[3] = {
    name: '屏息',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 3 步　静默</h3>' +
        '<p class="tip">代立于墓前，静默二十分钟（按比例折算二十秒）。开始之后，别点、别按键、别滚。</p>' +
        '<div class="ring" id="ring3">20</div>' +
        '<p class="tip" id="r3tip">点下面的按钮开始，然后别动。</p>' +
        '<p><button class="btn" id="b3">开 始 静 默</button></p>';
      var left = 20, timer = null, done = false, running = false;
      var px = null, py = null;
      function reset(msg) {
        left = 20;
        Y.$('#ring3', host).textContent = left;
        Y.$('#r3tip', host).textContent = msg || '重新开始。';
        Y.audio.buzz();
      }
      function onAct() {
        if (running && !done) { reset('你动了。计时清零。'); }
      }
      Y.$('#b3', host).addEventListener('click', function () {
        if (running) { return; }
        running = true; px = null; py = null; left = 20;
        Y.$('#b3', host).disabled = true;
        Y.$('#r3tip', host).textContent = '别动。';
        var t0 = Date.now(), played = false;
        timer = setInterval(function () {
          if (done) { return; }
          var el = (Date.now() - t0) / 1000;
          left = Math.max(0, 20 - Math.floor(el));
          var r = Y.$('#ring3', host);
          if (r) { r.textContent = left; r.classList.toggle('hot', left <= 5); }
          if (!played && el >= 8) { played = true; Y.audio.ambience(2); }
          if (el >= 20) {
            done = true; clearInterval(timer);
            Y.$('#r3tip', host).textContent = '风里有个人名，念了两遍。';
            setTimeout(api.done, 900);
          }
        }, 250);
      });
      document.addEventListener('pointerdown', onAct);
      document.addEventListener('keydown', onAct);
      document.addEventListener('wheel', onAct, { passive: true });
      this._cleanup = function () {
        clearInterval(timer);
        document.removeEventListener('pointerdown', onAct);
        document.removeEventListener('keydown', onAct);
        document.removeEventListener('wheel', onAct);
      };
    }
  };

  /* ---------- 4 侧碑：把取景框拖窄，露出被挡的一列 ---------- */
  CH[4] = {
    name: '侧碑',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 4 步　拓侧铭</h3>' +
        '<p class="tip">碑侧还有一列字，被水泥挡着。把取景框拖窄，挡住的部分会露出来。</p>' +
        '<div class="frame-demo"><div class="frame" id="frame4" style="width:100%">' +
          '<div>西关公墓　B 区 14 排 07 号</div>' +
          '<div>先妣 王秀兰 之墓</div>' +
          '<div style="color:#8a8478">生一九三八　卒二〇一九</div>' +
          '<div class="hidden-col"><span class="reveal">此处向北三十步，</span><span class="reveal">也有人听。</span></div>' +
        '</div></div>' +
        '<p class="tip">取景框宽度：<b id="w4">100%</b></p>' +
        '<input type="range" id="rng4" min="30" max="100" value="100" style="width:100%">';
      var hold = null;
      Y.$('#rng4', host).addEventListener('input', function (e) {
        var v = +e.target.value;
        var f = Y.$('#frame4', host);
        f.style.width = v + '%';
        Y.$('#w4', host).textContent = v + '%';
        f.classList.toggle('narrow', v <= 52 && v >= 38);
        if (v <= 52 && v >= 38) {
          if (!hold) {
            hold = setTimeout(function () {
              Y.$('.hidden-col', host).scrollIntoView({ block: 'nearest' });
              Y.audio.beep();
              api.done();
            }, 1200);
          }
        } else { clearTimeout(hold); hold = null; }
      });
    }
  };

  /* ---------- 5 对频：把刻字滚到基准线 ---------- */
  CH[5] = {
    name: '对频',
    render: function (host, order, api) {
      var lines = ['墓区广播　每日 06:30 起播', '第七排　西侧', '频段　——', '校正值　4 7 2 . 5', '本区已停播', '维护单位　云听代祭'];
      host.innerHTML =
        '<h3>第 5 步　校频</h3>' +
        '<p class="tip">把写着校正值的那一行，滚到中间的红色基准线上，停住一秒。</p>' +
        '<div class="strip-wrap"><div class="strip-holder" id="holder5">' +
          '<div class="strip" id="strip5">' + lines.map(function (s, i) { return '<div data-i="' + i + '">' + s + '</div>'; }).join('') + '</div>' +
        '</div><div class="center-line"></div></div>' +
        '<p class="tip" id="t5">—</p>';
      var holder = Y.$('#holder5', host), strip = Y.$('#strip5', host);
      var timer = null;
      function check() {
        var mid = holder.getBoundingClientRect().top + holder.clientHeight / 2;
        var target = null;
        Y.$$('div[data-i]', strip).forEach(function (d) {
          var r = d.getBoundingClientRect();
          if (Math.abs((r.top + r.height / 2) - mid) <= 9) { target = d; }
        });
        if (target && target.getAttribute('data-i') === '3') {
          Y.$('#t5', host).textContent = '已对准：' + target.textContent;
          if (!timer) {
            timer = setTimeout(function () { Y.audio.beep(); api.done(); }, 1000);
          }
        } else {
          clearTimeout(timer); timer = null;
          Y.$('#t5', host).textContent = target ? '对准了：' + target.textContent + '（不是这一行）' : '—';
        }
      }
      holder.addEventListener('scroll', check);
      setTimeout(function () { holder.scrollTop = 0; check(); }, 60);
    }
  };

  /* ---------- 6 增益：按住蓄力推到绿区 ---------- */
  CH[6] = {
    name: '增益',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 6 步　调增益</h3>' +
        '<p class="tip">按住不放会一直涨，松手就停。让指针停进绿区，连续三次。推过头会啸叫。</p>' +
        '<div class="meter" id="m6"><i></i><div class="zone" style="left:58%;width:30%"></div></div>' +
        '<p class="tip">成功 <b id="c6">0</b> / 3　当前 <b id="v6">0</b></p>' +
        '<div class="hold-area" id="hold6">按住这里</div>';
      var v = 0, up = false, n = 0, timer6 = null;
      var bar = Y.$('#m6 i', host);
      var t0 = 0;
      timer6 = setInterval(function () {
        if (up && t0) { v = Math.min(100, (Date.now() - t0) / 20); }
        bar.style.width = v + '%';
        Y.$('#v6', host).textContent = Math.round(v);
      }, 40);
      var area = Y.$('#hold6', host);
      function down(e) { e.preventDefault(); up = true; t0 = Date.now(); Y.audio.tone(220, 0.2, 0.05, 'sine'); }
      function upFn() {
        if (!up) { return; }
        up = false;
        if (v >= 58 && v <= 88) {
          n++; Y.audio.beep();
          Y.$('#c6', host).textContent = n;
          if (n >= 3) { clearInterval(timer6); Y.toast('增益已锁定'); api.done(); return; }
        } else if (v > 78) {
          Y.audio.tone(1400, 0.5, 0.12, 'sawtooth');
          Y.toast('啸叫了。重来。');
        } else {
          Y.audio.buzz();
        }
        v = 0;
      }
      area.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', upFn);
      window.addEventListener('pointercancel', upFn);
      this._cleanup = function () {
        clearInterval(timer6);
        window.removeEventListener('pointerup', upFn);
        window.removeEventListener('pointercancel', upFn);
      };
    }
  };

  /* ---------- 7 祭文：唯一需要打字的一章 ---------- */
  CH[7] = {
    name: '祭文',
    render: function (host, order, api) {
      var src = (order.record || []).map(function (r) { return r.s; }).join('');
      host.innerHTML =
        '<h3>第 7 步　代写祭文</h3>' +
        '<p class="tip">替家属写一段祭文。守则第五条：请用自己的话写，<b>不要复述逝者原话</b>。</p>' +
        '<textarea class="letter" id="ta7" placeholder="（在此书写）"></textarea>' +
        '<div class="counter"><span id="cn7">0</span> 字　·　至少 20 字</div>' +
        '<p class="tip" id="t7"></p>' +
        '<button class="btn" id="b7">上　达</button>';
      var ta = Y.$('#ta7', host);
      ta.addEventListener('input', function () { Y.$('#cn7', host).textContent = ta.value.trim().length; });
      Y.$('#b7', host).addEventListener('click', function () {
        var v = ta.value.trim();
        if (v.length < 20) { Y.$('#t7', host).textContent = '太短了。家属不会满意。'; Y.audio.buzz(); return; }
        /* 连续 6 字照抄检测 */
        var bad = false;
        for (var i = 0; i + 6 <= src.length; i++) {
          if (v.indexOf(src.substr(i, 6)) !== -1) { bad = true; break; }
        }
        if (bad) {
          Y.$('#t7', host).textContent = '这不像你自己写的。守则第五条：不要复述逝者原话。';
          Y.audio.buzz();
          return;
        }
        Y.state.wrote = v; Y.save();
        Y.$('#t7', host).textContent = '已上达。';
        Y.audio.beep();
        setTimeout(api.done, 600);
      });
    }
  };

  /* ---------- 8 引路：一笔画符 ---------- */
  CH[8] = {
    name: '引路',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 8 步　画引路符</h3>' +
        '<p class="tip">照老规矩，一笔画完：一个闭合的圈，加一竖。按住不放，一笔画成。</p>' +
        '<canvas id="ink" width="600" height="300"></canvas>' +
        '<p class="tip" id="t8">笔画数：0</p>' +
        '<button class="btn ghost small" id="clr8">重画</button>';
      var cv = Y.$('#ink', host), g = cv.getContext('2d');
      var drawing = false, strokes = 0, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      function pos(e) {
        var r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height };
      }
      function reset() {
        g.clearRect(0, 0, cv.width, cv.height); strokes = 0;
        minX = 1e9; maxX = -1e9; minY = 1e9; maxY = -1e9;
        Y.$('#t8', host).textContent = '笔画数：0';
      }
      cv.addEventListener('pointerdown', function (e) {
        if (strokes >= 1) { Y.$('#t8', host).textContent = '已经画过一笔了。要一笔画完。'; Y.audio.buzz(); reset(); }
        drawing = true; strokes = 1;
        var p = pos(e); g.beginPath(); g.moveTo(p.x, p.y);
        g.strokeStyle = '#1f2328'; g.lineWidth = 3; g.lineCap = 'round';
        cv.setPointerCapture(e.pointerId);
        Y.$('#t8', host).textContent = '笔画数：1';
      });
      cv.addEventListener('pointermove', function (e) {
        if (!drawing) { return; }
        var p = pos(e);
        g.lineTo(p.x, p.y); g.stroke();
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      });
      cv.addEventListener('pointerup', function () {
        if (!drawing) { return; }
        drawing = false;
        var w = maxX - minX, h = maxY - minY;
        if (w > cv.width * 0.35 && h > cv.height * 0.45) {
          Y.$('#t8', host).textContent = '符已画成。';
          Y.audio.beep();
          setTimeout(api.done, 600);
        } else {
          Y.$('#t8', host).textContent = '太小了，再画大一点，画满一点。';
          Y.audio.buzz();
          setTimeout(reset, 400);
        }
      });
      Y.$('#clr8', host).addEventListener('click', reset);
    }
  };

  /* ---------- 9 代守：必须离开 ---------- */
  CH[9] = {
    name: '代守',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 9 步　守夜</h3>' +
        '<p class="tip">本单需静候六十分钟（按比例折算六十秒）。<b>期间请勿守候屏幕</b>——切走，去做别的。</p>' +
        '<div class="ring" id="r9">0</div>' +
        '<p class="tip" id="t9">已离开：0 秒</p>' +
        '<p class="tip">（如不便切走，可点下面这块，闭眼守满十五秒。）</p>' +
        '<div class="hold-area" id="hold9">闭眼守夜（点一下开始，十五秒）</div>';
      var acc = 0, hiddenAt = 0, holdStart = 0, holdTimer = null;
      function render() {
        Y.$('#r9', host).textContent = Math.min(60, Math.floor(acc));
        Y.$('#t9', host).textContent = '已离开：' + Math.min(60, Math.floor(acc)) + ' 秒';
        if (acc >= 60) {
          Y.$('#t9', host).textContent = '你不在的时候，供品的位置变了。';
          Y.audio.ambience(3);
          api.done();
        }
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { hiddenAt = Date.now(); }
        else if (hiddenAt) { acc += (Date.now() - hiddenAt) / 1000; hiddenAt = 0; render(); }
      });
      var h = Y.$('#hold9', host);
      var running = false;
      h.addEventListener('click', function () {
        if (running) { return; }
        running = true;
        var left = 15;
        Y.$('#t9', host).textContent = '闭眼：0 / 15 秒（请勿睁眼）';
        holdTimer = setInterval(function () {
          left--;
          Y.$('#t9', host).textContent = '闭眼：' + (15 - left) + ' / 15 秒（请勿睁眼）';
          if (left <= 0) {
            clearInterval(holdTimer); running = false;
            acc += 60; render();
          }
        }, 1000);
      });
      this._cleanup = function () { clearInterval(holdTimer); };
    }
  };

  /* ---------- 10 正名：改 DOM ---------- */
  CH[10] = {
    name: '正名',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 10 步　校碑</h3>' +
        '<p class="tip">家属来信说，碑上名字刻错了一个字。这一页上的字，其实你是可以改的。</p>' +
        '<div class="frame-demo"><div class="frame" style="width:100%;text-align:center;line-height:2.4">' +
          '先妣　王秀<span id="nm10" style="border-bottom:1px solid #b4232a">蓝</span>　之墓<br>' +
          '<span style="font-size:13px;color:#8a8478">云听代祭　代校</span>' +
        '</div></div>' +
        '<p class="tip" id="t10">当前碑文：王秀蓝</p>' +
        '<button class="btn ghost small" id="alt10">我改不了（跳过）</button>';
      var nm = Y.$('#nm10', host);
      var clicks = 0;
      /* 正常解法：玩家在 F12 里改这个节点 */
      var ob = new MutationObserver(function () {
        var v = (nm.textContent || '').trim();
        if (v === '兰') {
          Y.$('#t10', host).textContent = '碑文已更正：王秀兰';
          Y.audio.beep();
          ob.disconnect();
          setTimeout(api.done, 700);
        }
      });
      ob.observe(nm, { childList: true, characterData: true, subtree: true });
      /* 降级：连点五次 */
      nm.addEventListener('click', function () {
        clicks++;
        if (clicks >= 5) {
          nm.textContent = '兰';
          Y.toast('你亲手把那个字改了过来。');
        }
      });
      Y.$('#alt10', host).addEventListener('click', function () {
        Y.$('#t10', host).textContent = '（你请了同事代改。碑文已更正：王秀兰）';
        nm.textContent = '兰';
      });
      this._cleanup = function () { ob.disconnect(); };
    }
  };

  /* ---------- 11 双端：双标签页握手 ---------- */
  CH[11] = {
    name: '双端',
    render: function (host, order, api) {
      var code = String(Math.floor(100000 + Math.random() * 899999));
      try { localStorage.setItem('yunting_pair_code', code); localStorage.removeItem('yunting_pair_ok'); } catch (e) {}
      host.innerHTML =
        '<h3>第 11 步　联合调试</h3>' +
        '<p class="tip">验配端与祭扫端要同时对时。口令：<b style="font-family:monospace;font-size:16px">' + code + '</b></p>' +
        '<p class="tip">另开一个标签页，打开 <b>#/pair</b>，把口令填进去。两边要同时对时。</p>' +
        '<p class="tip" id="t11">等待对端…</p>' +
        '<a class="btn ghost small" href="#/pair" target="_blank">打开对端（新标签页）</a>';
      var timer = setInterval(function () {
        var ok = null;
        try { ok = localStorage.getItem('yunting_pair_ok'); } catch (e) {}
        if (ok === code) {
          clearInterval(timer);
          Y.$('#t11', host).textContent = '对时完成。两端相差 11 分 07 秒，已校正。';
          Y.audio.beep();
          api.done();
        }
      }, 800);
      this._cleanup = function () { clearInterval(timer); };
    }
  };

  /* ---------- 12 不听：终局 ---------- */
  CH[12] = {
    name: '不听',
    render: function (host, order, api) {
      host.innerHTML =
        '<h3>第 12 步　临时加派</h3>' +
        '<p class="tip">公司临时加派一单。没有工单号，没有委托人，没有墓区。<br>' +
        '备注只有一行：<b>「不用去了。听听就好。」</b></p>' +
        '<p class="tip">通话已经接进来了。你要不要继续听？</p>' +
        '<div class="hold-area" id="listen12">正在收听…（不要点这里）</div>' +
        '<p class="tip"><button class="btn" id="off12">摘下耳机</button></p>';
      Y.audio.ambience(8);
      Y.$('#off12', host).addEventListener('click', function () {
        Y.audio.hiss();
        api.ending('good');
      });
      var t = setTimeout(function () {
        Y.audio.tone(300, 2.4, 0.06, 'sine');
        Y.toast('……有人在念你写的那段祭文。');
      }, 5000);
      this._cleanup = function () { clearTimeout(t); };
    }
  };

  return CH;
})();
