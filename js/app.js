/* =========================================================================
   云听 YUNTING —— 应用层（app.js）
   hash 路由 + 伪装层渲染 + 工作台 + 12 张工单 + 结局
   ========================================================================= */
(function () {
  'use strict';
  var Y = window.YT, CH = window.CH;
  var ORDERS = window.YT_ORDERS || [];
  var SITE = window.YT_SITE || { pages: {}, notices: [] };
  var app = document.getElementById('app');
  var cleanup = null;

  /* ---------------- 页头 / 页脚 ---------------- */
  function clockText() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function renderHead() {
    var who = Y.state.entered ? ('听道 ' + (Y.state.name || 'A-037')) : '访客';
    document.getElementById('clock').textContent = clockText();
    document.getElementById('who').textContent = who;
  }

  /* ---------------- 路由 ---------------- */
  var ROUTES = {};
  function go(h) { location.hash = h; }
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/');
    var name = parts[0] || 'home';
    var arg = parts[1] || '';
    var fn = ROUTES[name] || ROUTES.notfound;
    window.scrollTo(0, 0);
    fn(arg);
    renderHead();
    highlightNav(name);
  }
  function highlightNav(name) {
    Y.$$('.nav a').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('data-r') === name);
    });
  }
  function crumb(txt) {
    document.getElementById('crumb').innerHTML = '当前位置：<b>' + txt + '</b>';
  }

  /* ---------------- 伪装层页面 ---------------- */
  function sitePage(key, crumbTxt) {
    var p = (SITE.pages || {})[key];
    if (!p) { return ROUTES.notfound(); }
    document.title = p.title + '｜云听';
    crumb(crumbTxt || p.title);
    app.innerHTML = '<div class="panel"><div class="panel-h">' + Y.esc(p.title) + '</div>' +
      '<div class="panel-b"><div class="doc-body">' + (p.html || '') + '</div></div></div>';
    /* 页面里的 data-go 链接 */
    Y.$$('[data-go]', app).forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(a.getAttribute('data-go')); });
    });
  }

  ROUTES.home = function () {
    var p = SITE.pages.home || { title: '云听', html: '' };
    document.title = '云听｜听见，是一种陪伴';
    crumb('首页');
    var n = SITE.notices || [];
    var notices = n.map(function (x) {
      var alert = x.id === 'n5' ? ' class="alert"' : '';
      return '<li' + alert + '><a href="#/news">' + Y.esc(x.title) + '</a><span class="d">' + Y.esc(x.date) + '</span></li>';
    }).join('');
    var side = [
      ['听力检测', '#/fitting'], ['助听器验配', '#/fitting'], ['耳模制作', '#/fitting'],
      ['售后维护', '#/fitting'], ['代客祭扫', '#/memorial'], ['夜间值守', '#/memorial'],
      ['迁坟服务', '#/memorial'], ['代读祭文', '#/memorial']
    ].map(function (x) { return '<li><a href="' + x[1] + '">' + x[0] + '</a></li>'; }).join('');
    app.innerHTML =
      '<div class="layout">' +
        '<div class="side">' +
          '<div class="box"><div class="box-h">业务分类</div><div class="box-b tight"><ul class="sidelist">' + side + '</ul></div></div>' +
          '<div class="box"><div class="box-h">扫码关注</div><div class="box-b" style="text-align:center">' +
            '<div style="width:92px;height:92px;margin:0 auto;border:1px solid #999;background:repeating-conic-gradient(#1a1a1a 0 25%, #fff 0 50%) 0 0/10px 10px"></div>' +
            '<div style="font-size:11.5px;color:#666;margin-top:5px">云听服务号</div></div></div>' +
        '</div>' +
        '<div class="main-col">' +
          '<div class="box"><div class="box-h">通知公告<span class="more"><a href="#/news">更多 &gt;&gt;</a></span></div>' +
            '<div class="box-b tight"><div class="scroll-box"><div class="scroll-inner">' +
              '<ul class="noticelist">' + notices + notices + '</ul>' +
            '</div></div></div></div>' +
          '<div class="box"><div class="box-h">公司简介</div><div class="box-b"><div class="doc-body">' + p.html + '</div></div></div>' +
          '<div class="box"><div class="box-h">业务办理</div><div class="box-b"><div class="biz">' +
            '<div class="biz-card"><h3>云听 · 验配</h3><p>免费在线听力自测，约 6 分钟。需佩戴耳机。结果仅供参考，不作为诊断依据。</p>' +
              '<a class="btn primary" href="#/selftest">开始自测</a>　<a class="btn" href="#/fitting">了解验配</a></div>' +
            '<div class="biz-card"><h3>云听 · 代祭</h3><p>清明、冬至、忌日，代您上香、代您焚化、代您说话。全流程录音，可申请调阅。</p>' +
              '<a class="btn" href="#/memorial">查看服务</a>　<a class="btn" href="#/price">价格表</a></div>' +
          '</div></div></div>' +
          '<div class="box"><div class="box-h">平台数据</div><div class="box-b" style="padding:0"><div class="statbar">' +
            '<div>合作门店 <b>2,847</b> 家</div>' +
            '<div>注册验配师 <b>1,206</b> 人</div>' +
            '<div>累计服务 <b>3,281,9' + (Y.state.visited % 10) + '4</b> 人次</div>' +
            '<div>在线听道 <b>1,247</b> 条</div>' +
          '</div></div></div>' +
        '</div>' +
        '<div class="side2">' +
          '<div class="box"><div class="box-h">服务热线</div><div class="box-b" style="text-align:center">' +
            '<div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#c00;font-weight:700;letter-spacing:.02em">400-XXX-XXXX</div>' +
            '<div style="font-size:11.5px;color:#666;margin-top:3px">工作日 9:00—17:30</div></div></div>' +
          '<div class="box"><div class="box-h">常用链接</div><div class="box-b tight"><ul class="sidelist">' +
            '<li><a href="#/selftest">免费在线听力自测</a></li>' +
            '<li><a href="#/spec">代祭服务规范</a></li>' +
            '<li><a href="#/rules">听道守则</a></li>' +
            '<li><a href="#/price">服务价格表</a></li>' +
            '<li><a href="#/help">常见问题</a></li>' +
            '<li><a href="#/stores">门店查询</a></li>' +
          '</ul></div></div>' +
          '<div class="box"><div class="box-h">访客统计</div><div class="box-b" style="text-align:center;font-size:11.5px;color:#666">' +
            '您是本站第 <b style="color:#c00;font-family:Arial,Helvetica,sans-serif">' + (3281904 + (Y.state.visited || 0)) + '</b> 位访客' +
          '</div></div>' +
        '</div>' +
      '</div>';
  };

  ROUTES.about = function () { sitePage('about', '关于云听'); };
  ROUTES.fitting = function () { sitePage('fitting', '云听·验配'); };
  ROUTES.memorial = function () { sitePage('memorial', '云听·代祭'); };
  ROUTES.spec = function () { sitePage('spec', '代祭服务规范'); };
  ROUTES.price = function () { sitePage('price', '服务价格表'); };
  ROUTES.help = function () { sitePage('help', '帮助中心'); };
  ROUTES.stores = function () { sitePage('stores', '门店查询'); };
  ROUTES.news = function () { sitePage('news', '新闻公告'); };
  ROUTES.rules = function () { sitePage('rules', '听道守则'); };

  ROUTES.notfound = function () {
    document.title = '404｜云听';
    crumb('页面不存在');
    app.innerHTML = '<div class="panel"><div class="panel-b" style="text-align:center;padding:40px 0;color:#5b6672">' +
      '<div style="font-size:40px;color:#c3ccd5;font-family:monospace">404</div>' +
      '<p>您访问的页面不存在，或已被删除。</p>' +
      '<!-- order-07-raw 仍然存在 -->' +
      '<p><a href="#/">返回首页</a></p></div></div>';
  };

  /* ---------------- 自测（翻面） ---------------- */
  ROUTES.selftest = function () {
    document.title = '免费在线听力自测｜云听';
    crumb('云听·验配 ＞ 免费在线听力自测');
    var step = 0, freqs = [1000, 2000, 4000, 8000, 500, 250, 125, 20];
    app.innerHTML = '<div class="panel"><div class="panel-h">在线听力自测（约 6 分钟）</div><div class="panel-b">' +
      '<p class="tip">请佩戴耳机，音量调至舒适。听到声音即按「听到了」，未听到按「没听到」。每段只播放一次。</p>' +
      '<div class="ring" id="st-ring">' + 1 + ' / 8</div>' +
      '<p class="tip" id="st-t">第 1 组　频率 ' + freqs[0] + ' Hz</p>' +
      '<p><button class="btn" id="b-hear">听到了</button>　<button class="btn ghost" id="b-no">没听到</button></p>' +
      '<p class="tip" id="st-r"></p></div></div>';
    function next() {
      step++;
      if (step >= 8) { finish(); return; }
      Y.$('#st-ring').textContent = (step + 1) + ' / 8';
      Y.$('#st-t').textContent = '第 ' + (step + 1) + ' 组　频率 ' + freqs[step] + ' Hz';
      if (freqs[step] >= 60) { Y.audio.tone(freqs[step], 0.5, 0.06, 'sine'); }
      else { Y.audio.tone(30, 0.6, 0.0, 'sine'); }
    }
    function finish() {
      Y.state.entered = true;
      if (!Y.state.name) { Y.state.name = 'A-037'; }
      Y.save();
      Y.$('#st-r').innerHTML = '标定完成 · 听道编号 <b>' + Y.esc(Y.state.name) + '</b><br>' +
        '您已加入云听·代祭 志愿听道名录，可承接代祭试听任务。<br><br>' +
        '<a class="btn" href="#/desk">进入代祭工作台</a>';
      Y.$('#b-hear').disabled = true; Y.$('#b-no').disabled = true;
      Y.audio.beep();
    }
    Y.$('#b-hear').addEventListener('click', function () {
      Y.audio.unlock();
      if (step === 7) { Y.$('#st-r').textContent = '……（这一组没有声音。你按了「听到了」。）'; setTimeout(finish, 1400); return; }
      Y.audio.tone(freqs[step], 0.4, 0.06, 'sine');
      next();
    });
    Y.$('#b-no').addEventListener('click', function () { Y.audio.unlock(); next(); });
    Y.audio.tone(freqs[0], 0.5, 0.06, 'sine');
  };

  /* ---------------- 工作台 ---------------- */
  ROUTES.desk = function () {
    document.title = '代祭工作台｜云听';
    crumb('代祭工作台');
    if (!Y.state.entered) {
      app.innerHTML = '<div class="box"><div class="box-h">提示</div><div class="box-b">' +
        '<div class="doc-body"><p class="doc-p">该页面仅向已登记的听道开放。请先完成听力自测。</p></div>' +
        '<p style="margin-top:8px"><a class="btn primary" href="#/selftest">开始自测</a></p></div></div>';
      return;
    }
    var rows = ORDERS.map(function (o, i) {
      var done = Y.state.done.indexOf(o.id) !== -1;
      var prev = i === 0 || Y.state.done.indexOf(ORDERS[i - 1].id) !== -1;
      var st = done ? '<span class="st-done">已归档</span>' : (prev ? '<span class="st-wait">待接</span>' : '<span class="st-lock">未派</span>');
      var title = (done || prev) ? ('<a href="#/order/' + o.id + '">' + Y.esc(o.title) + '</a>') : Y.esc(o.title);
      return '<tr class="' + (done || prev ? '' : 'locked') + '">' +
        '<td>' + Y.esc(o.code || '——') + '</td>' +
        '<td>' + title + '</td>' +
        '<td>' + Y.esc(o.client || '—') + '</td>' +
        '<td>' + Y.esc((o.grave || '—').replace(/\s+/g, ' ')) + '</td>' +
        '<td>' + st + '</td></tr>';
    }).join('');
    var mins = Y.minutesInside();
    app.innerHTML =
      '<div class="desk">' +
        '<div class="desk-title"><span>云听代祭业务管理系统 v2.1</span><span class="btns">_ □ ×</span></div>' +
        '<div class="desk-menu"><span>工单(F)</span><span>录音(R)</span><span>档案(A)</span><span>工具(T)</span><span>帮助(H)</span></div>' +
        '<div class="desk-tool">' +
          '<button class="btn" type="button">刷新</button>' +
          '<button class="btn" type="button">归档</button>' +
          '<button class="btn" type="button">打印</button>' +
          '<span style="margin-left:10px;color:#555">在岗：' + Y.esc(Y.state.name || 'A-037') + '</span>' +
        '</div>' +
        '<div class="desk-body">' +
          '<table class="tickets">' +
            '<thead><tr><th style="width:110px">工单号</th><th>服务项目</th><th style="width:120px">委托人</th>' +
            '<th style="width:190px">服务墓区</th><th style="width:70px">状态</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
          '<div style="margin-top:8px;font-size:11.5px;color:#555">' +
            '说明：本平台录音均为现场设备采集。若录音中出现非现场声音，请照常勾选「已送达」，不要中断工单。' +
          '</div>' +
        '</div>' +
        '<div class="desk-status">' +
          '<span><i class="led on"></i>线路正常</span>' +
          '<span><i class="led on"></i>录音机 转动中</span>' +
          '<span><i class="led"></i>载波 待机</span>' +
          '<span style="margin-left:auto">已值班 ' + mins + ' 分钟</span>' +
          '<span><a href="#/profile">听力档案</a></span>' +
        '</div>' +
      '</div>';
  };

  /* ---------------- 工单页 ---------------- */
  ROUTES.order = function (id) {
    var o = null;
    for (var i = 0; i < ORDERS.length; i++) { if (String(ORDERS[i].id) === String(id)) { o = ORDERS[i]; } }
    if (!o) { return ROUTES.notfound(); }
    var idx = ORDERS.indexOf(o);
    var prev = idx === 0 || Y.state.done.indexOf(ORDERS[idx - 1].id) !== -1;
    if (!prev && Y.state.done.indexOf(o.id) === -1) { return ROUTES.notfound(); }

    document.title = o.title + '｜云听代祭';
    crumb('代祭工作台 ＞ ' + (o.code || '临时加派') + '　' + o.title);

    var rec = (o.record || []).map(function (r) {
      var warn = r.s.indexOf('（') === 0 ? ' warn' : '';
      return '<div><span class="t">' + Y.esc(r.t) + '</span><span class="s' + warn + '">' + Y.esc(r.s) + '</span></div>';
    }).join('');

    var done = Y.state.done.indexOf(o.id) !== -1;
    app.innerHTML =
      '<div class="order-head"><h2>' + Y.esc(o.title) + '</h2>' +
        '<span class="code">' + Y.esc(o.code || '——') + '　' + Y.esc(o.date || '') + '</span></div>' +
      '<table class="meta">' +
        '<tr><th>服务内容</th><td>' + Y.esc(o.service || '—') + '</td><th>状　态</th><td>' + (done ? '已归档' : '待接') + '</td></tr>' +
        '<tr><th>委托人</th><td>' + Y.esc(o.client || '—') + '</td><th>服务墓区</th><td>' + Y.esc(o.grave || '—') + '</td></tr>' +
        '<tr><th>逝者</th><td colspan="3">' + Y.esc(o.deceased || '—') + '</td></tr>' +
      '</table>' +
      (o.memo ? '<div class="panel"><div class="panel-h">委托备注</div><div class="panel-b"><div class="doc-body"><p class="doc-p">' + Y.esc(o.memo) + '</p></div></div></div>' : '') +
      '<div class="panel"><div class="panel-h">现场录音（转录）</div><div class="panel-b"><div class="record">' + rec + '</div>' +
        '<p class="tip"><button class="btn ghost small" id="play-rec">播放环境音</button></p></div></div>' +
      '<div class="task" id="task"></div>' +
      '<div class="hintline"><a href="#" id="hintBtn">需要帮助？</a><div class="hint-box" id="hintBox" hidden></div></div>' +
      '<p style="margin-top:16px"><a href="#/desk">← 返回工单列表</a></p>';

    Y.$('#play-rec').addEventListener('click', function () { Y.audio.ambience(5); });

    /* 分级提示 */
    var hl = 0, tries = 0;
    Y.$('#hintBtn').addEventListener('click', function (e) {
      e.preventDefault();
      var box = Y.$('#hintBox');
      box.hidden = false;
      hl = Math.min(hl, 2);
      box.innerHTML = '<b>提示 ' + (hl + 1) + ' / 3</b><br>' + Y.esc(Y.hint(o.id - 1, hl)) +
        (hl < 2 ? '<div style="margin-top:6px"><a href="#" id="hintMore">再具体一点</a></div>' : '');
      var m = Y.$('#hintMore');
      if (m) { m.addEventListener('click', function (ev) { ev.preventDefault(); hl++; tries++; Y.$('#hintBtn').click(); }); }
    });

    /* 挂载章节 */
    if (done) {
      Y.$('#task').innerHTML = '<h3>本单已归档</h3><p class="tip">' + Y.esc(o.receipt || '') + '</p>' +
        (idx + 1 < ORDERS.length ? '<p><a class="btn" href="#/order/' + ORDERS[idx + 1].id + '">下一单 →</a></p>' : '<p><a class="btn" href="#/profile">查看听力档案</a></p>');
      return;
    }
    var mod = CH[o.id];
    if (!mod) { Y.$('#task').innerHTML = '<h3>（本单无需操作）</h3><p class="tip">' + Y.esc(o.receipt || '') + '</p>'; return; }

    var api = {
      done: function () {
        if (Y.state.done.indexOf(o.id) === -1) {
          Y.state.done.push(o.id);
          if (o.letter) { Y.state.letters[o.id] = o.letter; }
          Y.save();
        }
        Y.toast('工单已归档');
        Y.$('#task').innerHTML = '<h3>已归档</h3><p class="tip">' + Y.esc(o.receipt || '') + '</p>' +
          (idx + 1 < ORDERS.length
            ? '<p><a class="btn" href="#/order/' + ORDERS[idx + 1].id + '">下一单 →</a></p>'
            : '<p><a class="btn" href="#/profile">查看听力档案</a></p>');
      },
      ending: function (kind) {
        Y.state.ended = kind; Y.save();
        go('#/ending/' + kind);
      }
    };
    mod.render(Y.$('#task'), o, api);
    cleanup = mod._cleanup || null;
  };

  /* ---------------- 对端（第 11 章） ---------------- */
  ROUTES.pair = function () {
    document.title = '联合调试｜云听';
    crumb('联合调试');
    var want = '';
    try { want = localStorage.getItem('yunting_pair_code') || ''; } catch (e) {}
    app.innerHTML = '<div class="panel"><div class="panel-h">联合调试 · 对端</div><div class="panel-b">' +
      '<p class="tip">请输入验配端显示的口令，然后确认。两端须同时在线。</p>' +
      '<p><input id="pc" type="text" maxlength="6" style="font-family:monospace;font-size:18px;padding:8px;width:140px" placeholder="六位口令">　' +
      '<button class="btn" id="pb">确认对时</button></p>' +
      '<p class="tip" id="pr"></p></div></div>';
    Y.$('#pb').addEventListener('click', function () {
      var v = (Y.$('#pc').value || '').trim();
      if (v && v === want) {
        try { localStorage.setItem('yunting_pair_ok', v); } catch (e) {}
        Y.$('#pr').textContent = '对时完成。可以关掉这个标签页了。';
        Y.audio.beep();
      } else {
        Y.$('#pr').textContent = '口令不对。两端相差 11 分 07 秒。';
        Y.audio.buzz();
      }
    });
  };

  /* ---------------- 听力档案 ---------------- */
  ROUTES.profile = function () {
    document.title = '我的听力档案｜云听';
    crumb('我的听力档案');
    var cells = ORDERS.map(function (o) {
      var l = Y.state.letters[o.id] || '';
      return '<div class="wave-cell' + (l ? '' : ' empty') + '" data-l="' + l + '">' +
        '<canvas></canvas><div class="lb">' + (l || '—') + '</div></div>';
    }).join('');
    var str = ORDERS.map(function (o) { return Y.state.letters[o.id] || ''; }).join('');
    app.innerHTML =
      '<div class="panel"><div class="panel-h">听力档案 · ' + Y.esc(Y.state.name || 'A-037') + '</div><div class="panel-b">' +
        '<p class="tip">每完成一单，档案里会多一段波形。十二段连起来放，是一句话。</p>' +
        '<div class="wave-row" id="waves">' + cells + '</div>' +
        '<p><button class="btn" id="pw">连起来播放</button>　<span class="tip" id="pl">' + (str ? '' : '（还没收齐）') + '</span></p>' +
        '<hr style="border:0;border-top:1px solid #e6eaee;margin:18px 0">' +
        '<div class="doc-body">' +
          '<div class="doc-title">听力图（左耳）</div>' +
          '<table class="doc-table"><thead><tr><th>频率</th><th>125</th><th>250</th><th>500</th><th>1k</th><th>2k</th><th>4k</th><th>8k</th><th>16k</th></tr></thead>' +
          '<tbody><tr><td>阈值 dB</td><td>15</td><td>20</td><td>25</td><td>20</td><td>30</td><td>35</td><td>——</td><td>——</td></tr></tbody></table>' +
          '<p class="doc-note">注：8 kHz 以上无对应测试记录。该段曲线为系统自动补全。</p>' +
          (Y.state.wrote ? '<div class="doc-title">你写的祭文（第 7 单）</div><p class="doc-p">' + Y.esc(Y.state.wrote) + '</p>' : '') +
        '</div>' +
        '<p style="margin-top:14px"><a class="btn ghost small" href="#/desk">返回工作台</a></p>' +
      '</div></div>';
    Y.$$('#waves .wave-cell').forEach(function (c) {
      Y.drawWave(c.querySelector('canvas'), c.getAttribute('data-l'), !!c.getAttribute('data-l'));
    });
    Y.$('#pw').addEventListener('click', function () {
      if (!str) { Y.toast('还没有可播的波形'); return; }
      Y.audio.playLetters(str);
      Y.$('#pl').textContent = '（摩斯电码，共 ' + str.length + ' 段）';
    });
  };

  /* ---------------- 结局 ---------------- */
  ROUTES.ending = function (kind) {
    document.title = '（结局）｜云听';
    crumb('归档结果');
    if (kind === 'good') {
      app.innerHTML = '<div class="ending"><h2>线路已释放</h2>' +
        '<div class="big">听道注销申请　已受理<br>编号 ' + Y.esc(Y.state.name || 'A-037') + '<br>' +
        '注销时间 ' + clockText() + '<br>备注：该听道 8 kHz 以上频段已回收。</div>' +
        '<p class="tip">此后网页再放 8 kHz 以上的音，你按「听到了」，系统回：未检测到。</p>' +
        '<p><a class="btn ghost" href="#/">返回首页</a></p></div>';
    } else {
      app.innerHTML = '<div class="ending"><h2>值班继续</h2>' +
        '<div class="big">听道 ' + Y.esc(Y.state.name || 'A-037') + '　状态：在线<br>' +
        '在线听道：1,249 条<br>待办任务：1 单（收件人：' + Y.esc(Y.state.name || 'A-037') + '）</div>' +
        '<p class="tip">首页公告位换成了：本平台已停止受理新用户。</p>' +
        '<p><a class="btn ghost" href="#/desk">回到工作台</a></p></div>';
    }
    Y.audio.hiss();
  };

  /* ---------------- 启动 ---------------- */
  Y.bumpVisit();
  Y.audio.unlock = Y.audio.unlock;
  document.addEventListener('pointerdown', function once() { Y.audio.unlock(); document.removeEventListener('pointerdown', once); });
  window.addEventListener('hashchange', route);
  route();

  /* 元恐怖：超过 20 分钟提示 */
  setTimeout(function () {
    if (Y.minutesInside() >= 20) {
      Y.toast('本次值班已持续 ' + Y.minutesInside() + ' 分钟 · 建议休息');
    }
  }, 20000);

  /* 供其他脚本调用 */
  window.YT_GO = go;
})();
