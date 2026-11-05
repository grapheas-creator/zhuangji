/* ============================================================================
 * 旺财装机店 · 游戏内音乐播放器（独立文件，不改游戏主代码）
 * ----------------------------------------------------------------------------
 * 功能：右下角一个唱片按钮 → 打开播放器面板
 *       ⏮ 上一曲   ▶/⏸ 播放暂停   ⏭ 下一曲
 *       模式键循环切换：🔁 列表循环 → 🔀 随机播放 → 🔂 单曲循环
 *       进度条可点（跳转），显示 当前/总时长
 *       剧情（#plotEvent、#storyPop）弹出时自动暂停，剧情结束后自动接着放
 *
 * 音乐不内联进单文件，作为资源包加载：music/ 目录 + music/manifest.js 清单，
 * 和 art1.js / photos.js 那套图片资源的思路一致（清单用 <script> 加载，
 * 这样 file:// 双击打开也不会撞跨域）。
 *
 * ── 整合三步 ────────────────────────────────────────────────────────────────
 * 1. 把 music/ 整个目录 和 本文件 music-player.js 放到 装机生意.html 同一目录
 * 2. 在 装机生意.html 的 </body> 前面加一行：
 *        <script src="music-player.js" defer></script>
 *    （只加这一行，游戏主代码一个字都不用动）
 * 3. 完事。要换曲子，改 music/manifest.js 就行，别动这个文件
 *
 * ── 可选配置（放在本文件之前）──────────────────────────────────────────────
 *    <script>
 *      window.MUSIC_PLAYER_OPTIONS = {
 *        pack:  'music/manifest.js',  // 曲目清单
 *        dir:   'music/',             // 音频文件目录
 *        volume: 0.55,
    allow: null,                 // 只放这些文件（null=全部）；留声机用                // 默认音量 0~1
 *        plotSelector: '#plotEvent,#storyPop', // 这些元素出现时视为「剧情中」
 *        resumeAfterPlot: true,       // 剧情结束后是否自动续播
 *        zIndex: 9400
 *      };
 *    </script>
 *
 * ── 与游戏原有 BGM 的关系 ──────────────────────────────────────────────────
 * 播放器一开播，会把游戏自带的 BGM（music.ogg 或合成的 Am7-F-C-G）暂停；
 * 播放器暂停/关闭时再把它接回来（如果游戏没被静音）。两边永远不会同时响。
 *
 * ── 单文件版说明 ──────────────────────────────────────────────────────────
 * 单文件版不含 music/，这个脚本加载失败就静默退出，游戏照常跑，按钮不会出现。
 * ========================================================================== */
(function () {
  'use strict';

  var CFG = {
    pack: 'music/manifest.js',
    dir: 'music/',
    volume: 0.55,
    allow: null,                 // 只放这些文件（null=全部）；留声机用
    plotSelector: '#plotEvent,#storyPop',
    resumeAfterPlot: true,
    saveKey: 'wc_music_player',
    zIndex: 9400
  };
  if (window.MUSIC_PLAYER_OPTIONS) {
    for (var k in window.MUSIC_PLAYER_OPTIONS) {
      if (Object.prototype.hasOwnProperty.call(window.MUSIC_PLAYER_OPTIONS, k)) CFG[k] = window.MUSIC_PLAYER_OPTIONS[k];
    }
  }
  if (!CFG.dir || CFG.dir.charAt(CFG.dir.length - 1) !== '/') CFG.dir += '/';

  var MODES = ['list', 'shuffle', 'one'];
  var MODE_LABEL = { list: '列表循环', shuffle: '随机播放', one: '单曲循环' };

  // 图标用内联 SVG：不依赖 emoji 字体，安卓 WebView / 老系统上也不会变成方块。
  // 每个图形的可视范围都在 4~20 之间、左右留白对称，否则在按钮里看着就是歪的。
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + inner + '</svg>';
  }
  var ICON = {
    prev: svg('<rect x="4" y="5" width="2.6" height="14" rx=".6"/>'
      + '<path d="M20 6.05v11.9a.95.95 0 01-1.48.79L8.1 12.79a.95.95 0 010-1.58l10.42-5.95A.95.95 0 0120 6.05z"/>'),
    next: svg('<rect x="17.4" y="5" width="2.6" height="14" rx=".6"/>'
      + '<path d="M4 6.05v11.9a.95.95 0 001.48.79l10.42-5.95a.95.95 0 000-1.58L5.48 5.26A.95.95 0 004 6.05z"/>'),
    play: svg('<path d="M6.7 5.3v13.4c0 .8.87 1.28 1.55.86l10.1-6.7a1 1 0 000-1.72L8.25 4.44A1 1 0 006.7 5.3z"/>'),
    pause: svg('<rect x="6.4" y="5" width="4" height="14" rx="1.2"/>'
      + '<rect x="13.6" y="5" width="4" height="14" rx="1.2"/>'),
    note: svg('<path transform="translate(.8 .23)" d="M18.5 4.2v10.15a3.1 3.1 0 11-2-2.9V7.6l-6.4 1.35v7.4a3.1 3.1 0 11-2-2.9V6.9c0-.52.36-.97.87-1.08l8-1.7c.75-.16 1.53.42 1.53 1.08z"/>'),
    repeat: svg('<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'),
    shuffle: svg('<path d="M10.6 9.2L5.4 4 4 5.4l5.2 5.2 1.4-1.4zM14.5 4l2 2L4 18.6 5.4 20 18 7.5l2 2V4h-5.5zm.3 9.4l-1.4 1.4 3.1 3.1-2 2H20v-5.5l-2 2-3.2-3z"/>')
  };
  var MODE_ICON = { list: ICON.repeat, shuffle: ICON.shuffle, one: ICON.repeat };

  var S = {
    pack: null,      // {tracks:[...]}
    i: -1,           // 当前曲目下标
    mode: 'list',
    playing: false,
    plotHold: false, // 是否因剧情被暂停
    volume: CFG.volume,
    ui: null,
    el: null,        // <audio>
    open: false,
    ready: false
  };

  /* ---------- 小工具 ---------- */
  function $(sel) { return document.querySelector(sel); }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }
  function save() {
    try {
      localStorage.setItem(CFG.saveKey, JSON.stringify({ i: S.i, mode: S.mode, volume: S.volume }));
    } catch (e) {}
  }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(CFG.saveKey);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && MODES.indexOf(d.mode) >= 0) S.mode = d.mode;
      if (d && typeof d.i === 'number') S.i = d.i;
      if (d && typeof d.volume === 'number') S.volume = Math.max(0, Math.min(1, d.volume));
    } catch (e) {}
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- 剧情检测 ---------- */
  function plotBusy() {
    try { return !!document.querySelector(CFG.plotSelector); } catch (e) { return false; }
  }

  /* ---------- 和游戏自带 BGM 协商 ---------- */
  // 游戏里这些函数是顶层声明，直接按名字调用即可；没有就跳过（单文件版/旧版）
  function gameBgmStop() {
    try { if (typeof musStop === 'function') musStop(); } catch (e) {}
    try { if (typeof aeMusicStop === 'function') aeMusicStop(); } catch (e) {}
  }
  function gameBgmResume() {
    try {
      var muted = (typeof AE !== 'undefined' && AE && AE.muted);
      if (muted) return;
      if (typeof musStart === 'function') musStart();
      else if (typeof aeMusicStart === 'function') aeMusicStart();
    } catch (e) {}
  }

  /* ---------- 资源包加载 ---------- */
  function loadPack() {
    if (S.pack) return Promise.resolve(S.pack);
    if (window.__MUSIC_PACK && window.__MUSIC_PACK.tracks) {
      S.pack = window.__MUSIC_PACK;
      return Promise.resolve(S.pack);
    }
    return new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = CFG.pack;
      sc.async = true;
      sc.onload = function () {
        if (window.__MUSIC_PACK && window.__MUSIC_PACK.tracks) {
          S.pack = window.__MUSIC_PACK;
          res(S.pack);
        } else rej(new Error('manifest 里没有 window.__MUSIC_PACK'));
      };
      sc.onerror = function () { rej(new Error('加载不到 ' + CFG.pack)); };
      document.head.appendChild(sc);
    }).catch(function () {
      // 退一步：允许 manifest.json（线上部署更方便）
      return fetch(CFG.pack.replace(/\.js$/, '.json'))
        .then(function (r) { if (!r.ok) throw new Error('no json'); return r.json(); })
        .then(function (d) { S.pack = d; return d; });
    });
  }

  /* ---------- 音频元素 ---------- */
  function audio() {
    if (S.el) return S.el;
    var a = new Audio();
    a.preload = 'metadata';
    a.volume = S.volume;
    a.addEventListener('ended', function () { advance(true); });
    a.addEventListener('error', function () {
      toast('这首解不了（格式不支持），跳过');
      advance(true);
    });
    a.addEventListener('timeupdate', paintProgress);
    a.addEventListener('loadedmetadata', paintProgress);
    S.el = a;
    return a;
  }

  /* ---------- 播放控制 ---------- */
  function trackUrl(i) {
    var t = S.pack && S.pack.tracks[i];
    if (!t) return '';
    return CFG.dir + t.f;
  }

  function play(i, autoplay) {
    if (!S.ready) return;
    if (typeof autoplay !== 'boolean') autoplay = true;
    var n = S.pack.tracks.length;
    if (!n) return;
    if (typeof i !== 'number') i = S.i < 0 ? 0 : S.i;
    i = (i % n + n) % n;
    S.i = i;

    var a = audio();
    var url = trackUrl(i);
    if (a.getAttribute('data-src') !== url) {
      a.setAttribute('data-src', url);
      a.src = url;
    }
    paintMeta();
    if (plotBusy()) {                       // 剧情里点了也不放，等剧情结束
      S.plotHold = true;
      S.playing = false;
      paintState();
      toast('剧情播放中，结束后自动接着放');
      return;
    }
    if (autoplay) {
      var p = a.play();
      if (p && p.catch) p.catch(function () { toast('浏览器要求先点一下页面才能出声'); });
      S.playing = true;
      gameBgmStop();
    }
    paintState();
  }

  function pause() {
    if (S.el && !S.el.paused) S.el.pause();
    S.playing = false;
    S.plotHold = false;
    paintState();
    gameBgmResume();
  }

  function toggle() {
    if (!S.ready) { toast('曲目还在加载…'); return; }
    if (S.playing) pause();
    else play(S.i < 0 ? 0 : S.i, true);
  }

  function pickNext() {
    var n = S.pack.tracks.length;
    if (S.mode === 'shuffle' && n > 1) {
      var j = S.i;
      while (j === S.i) j = Math.floor(Math.random() * n);
      return j;
    }
    return (S.i + 1) % n;
  }

  // auto=true 表示是「播完自动往下」，这时单曲模式要重播自己
  function advance(auto) {
    if (!S.ready) return;
    if (auto && S.mode === 'one') { play(S.i, true); return; }
    play(pickNext(), true);
  }

  function next() { if (!S.ready) return; play(pickNext(), true); }
  function prev() {
    if (!S.ready) return;
    if (S.el && S.el.currentTime > 3) { S.el.currentTime = 0; return; }  // 播过 3 秒就回本曲开头
    play(S.i - 1, true);
  }

  function cycleMode() {
    var k = MODES.indexOf(S.mode);
    S.mode = MODES[(k + 1) % MODES.length];
    save();
    paintState();
    toast(MODE_LABEL[S.mode] + (S.mode === 'one' ? '：这首放完从头再来' : S.mode === 'shuffle' ? '：随机挑下一首' : '：整张放完回到第一首'));
  }

  function setVolume(v) {
    S.volume = Math.max(0, Math.min(1, v));
    if (S.el) S.el.volume = S.volume;
    save();
  }

  /* ---------- 剧情钩子 ---------- */
  var obs = null;
  function watchPlot() {
    if (obs) return;
    obs = new MutationObserver(function () {
      var busy = plotBusy();
      if (busy && S.playing) {          // 剧情来了 → 暂停，记住要回来
        S.plotHold = true;
        try { S.el.pause(); } catch (e) {}
        S.playing = false;
        paintState();
      } else if (!busy && S.plotHold) {  // 剧情结束 → 续播
        S.plotHold = false;
        if (CFG.resumeAfterPlot && !S.playing) play(S.i, true);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ---------- UI ---------- */
  var CSS = ''
    /* ── 悬浮按钮：樱花粉圆钮 ── */
    + '.wc-mp-fab{position:fixed;right:14px;bottom:calc(var(--navh, 60px) + 14px);z-index:' + CFG.zIndex + ';'
    + 'width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
    + 'background:linear-gradient(160deg,#fffdfa,#ffeef1);border:2px solid #f3c3cd;'
    + 'color:#e07a90;font-size:19px;line-height:1;cursor:pointer;'
    + 'box-shadow:0 8px 20px -8px rgba(214,120,140,.55),inset 0 0 0 3px #fff;'
    + 'transition:transform .16s,box-shadow .16s;user-select:none}'
    + '.wc-mp-fab:hover{transform:translateY(-2px) rotate(-6deg);box-shadow:0 12px 26px -8px rgba(214,120,140,.65),inset 0 0 0 3px #fff}'
    + '.wc-mp-fab.on{color:#d3566f;border-color:#ef9fb0}'
    + '.wc-mp-fab.empty{opacity:.55;filter:grayscale(.35)}'
    + '.wc-mp-fab.empty:hover{opacity:.8}'
    + '.wc-mp-fab svg{width:21px;height:21px;display:block;fill:currentColor}'
    + '.wc-mp-fab .ic{display:flex;align-items:center;justify-content:center;line-height:0}'
    + '.wc-mp-fab .dot{position:absolute;right:4px;top:4px;width:9px;height:9px;border-radius:50%;'
    + 'background:#ff9db0;border:2px solid #fff;opacity:0;transition:opacity .2s}'
    + '.wc-mp-fab.playing .dot{opacity:1;animation:wcMpPulse 1.8s ease-in-out infinite}'
    + '@keyframes wcMpPulse{0%,100%{opacity:.5;transform:scale(.85)}50%{opacity:1;transform:scale(1.18)}}'

    /* ── 面板：奶油白卡片 + 双层粉边（仿游戏对话框） ── */
    + '.wc-mp{position:fixed;right:14px;bottom:calc(var(--navh, 60px) + 72px);z-index:' + CFG.zIndex + ';'
    + 'width:min(318px,calc(100vw - 28px));box-sizing:border-box;padding:14px 15px 12px;'
    + 'border-radius:20px;background:linear-gradient(170deg,#fffdf9 0%,#fff7f4 55%,#fff2f3 100%);'
    + 'border:2px solid #f2c3cc;box-shadow:0 18px 42px -14px rgba(180,90,110,.42),'
    + 'inset 0 0 0 3px #fffdfb;'
    + 'color:#8a5a60;font:12px/1.5 system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;'
    + 'opacity:0;transform:translateY(10px) scale(.97);pointer-events:none;transform-origin:bottom right;'
    + 'transition:opacity .18s,transform .18s}'
    + '.wc-mp.on{opacity:1;transform:none;pointer-events:auto}'
    + '.wc-mp:before{content:"";position:absolute;inset:6px;border-radius:15px;'
    + 'border:1px solid rgba(240,190,200,.55);pointer-events:none}'
    + '.wc-mp .ttl{font-size:13.5px;font-weight:800;color:#b8546a;white-space:nowrap;overflow:hidden;'
    + 'text-overflow:ellipsis;letter-spacing:.3px;margin-bottom:2px}'
    + '.wc-mp .sub{font-size:10.5px;color:#c39aa2;display:flex;justify-content:space-between;gap:8px}'
    + '.wc-mp .seek{margin:10px 0 4px;height:6px;border-radius:99px;background:#f6dfe3;'
    + 'cursor:pointer;position:relative;overflow:hidden;box-shadow:inset 0 1px 2px rgba(190,120,135,.18)}'
    + '.wc-mp .seek i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;'
    + 'background:linear-gradient(90deg,#ffc2ce,#ff8fa8);box-shadow:0 0 8px rgba(255,150,175,.6)}'
    + '.wc-mp .time{display:flex;justify-content:space-between;font-size:10px;color:#c2a0a6;'
    + 'font-variant-numeric:tabular-nums}'
    + '.wc-mp .row{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:9px}'
    + '.wc-mp button{appearance:none!important;background:#fff!important;'
    + 'background-image:none!important;border:1.5px solid #f3cdd5!important;'
    + 'color:#cf7386!important;border-radius:13px!important;height:36px!important;'
    + 'min-width:42px!important;width:auto!important;padding:0 10px!important;font-size:13px!important;'
    + 'cursor:pointer;display:inline-flex!important;align-items:center;justify-content:center;line-height:1;'
    + 'box-shadow:0 3px 8px -4px rgba(200,120,140,.35)!important;'
    + 'transition:background .15s,border-color .15s,transform .1s}'
    + '.wc-mp button:hover{background:#fff5f7!important;border-color:#eab0bc!important}'
    + '.wc-mp button:active{transform:scale(.94)}'
    + '.wc-mp button.play{width:50px!important;min-width:50px!important;height:50px!important;'
    + 'border-radius:50%!important;font-size:17px!important;'
    + 'background:linear-gradient(160deg,#ffd3dc,#ff9db2)!important;'
    + 'border-color:#ffb3c4!important;color:#fff!important;'
    + 'box-shadow:0 8px 18px -6px rgba(240,130,155,.65),inset 0 1px 0 rgba(255,255,255,.7)!important}'
    + '.wc-mp button.play:hover{background:linear-gradient(160deg,#ffdde4,#ffa7ba)!important}'
    + '.wc-mp .mode button{background:#fff!important;background-image:none!important}'
    + '.wc-mp button svg{width:15px;height:15px;display:block;fill:currentColor}'
    + '.wc-mp button.play svg{width:20px;height:20px}'
    + '.wc-mp .mode{margin-top:10px;display:flex;justify-content:center}'
    + '.wc-mp .mode button{font-size:11px;height:30px;border-radius:12px;display:inline-flex;'
    + 'align-items:center;gap:5px;color:#b8899a}'
    + '.wc-mp .mode button svg{width:13px;height:13px}'
    + '.wc-mp .toast{margin-top:7px;font-size:10.5px;color:#d97a90;text-align:center;min-height:14px;'
    + 'opacity:0;transition:opacity .2s}'
    + '.wc-mp .toast.on{opacity:1}'
    + '@media(max-width:860px){.wc-mp-fab{right:12px}.wc-mp{right:12px}}';

  var toastTimer = 0;
  function toast(msg) {
    if (!S.ui || !S.ui.toast) return;
    S.ui.toast.textContent = msg;
    S.ui.toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { S.ui.toast.classList.remove('on'); }, 2200);
  }

  function buildUI() {
    if (S.ui) return S.ui;
    var style = document.createElement('style');
    style.id = 'wc-mp-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var fab = document.createElement('div');
    fab.className = 'wc-mp-fab';
    fab.id = 'wcMpFab';
    fab.style.display = 'none';        /* 等白名单确定后再决定显不显示，避免先亮后灭 */
    fab.title = '音乐播放器';
    fab.innerHTML = '<span class="ic">' + ICON.note + '</span><i class="dot"></i>';

    var box = document.createElement('div');
    box.className = 'wc-mp';
    box.id = 'wcMp';
    box.innerHTML =
      '<div class="ttl" id="wcMpTtl">—</div>'
      + '<div class="sub"><span id="wcMpIdx">0 / 0</span><span id="wcMpModeTxt">列表循环</span></div>'
      + '<div class="seek" id="wcMpSeek"><i id="wcMpBar"></i></div>'
      + '<div class="time"><span id="wcMpCur">0:00</span><span id="wcMpDur">0:00</span></div>'
      + '<div class="row">'
      + '  <button id="wcMpPrev" title="上一曲"></button>'
      + '  <button class="play" id="wcMpPlay" title="播放"></button>'
      + '  <button id="wcMpNext" title="下一曲"></button>'
      + '</div>'
      + '<div class="mode"><button id="wcMpModeBtn" title="切换播放模式"></button></div>'
      + '<div class="toast" id="wcMpToast"></div>';

    document.body.appendChild(fab);
    document.body.appendChild(box);

    S.ui = {
      fab: fab,
      box: box,
      ttl: $('#wcMpTtl'),
      idx: $('#wcMpIdx'),
      modeTxt: $('#wcMpModeTxt'),
      modeBtn: $('#wcMpModeBtn'),
      seek: $('#wcMpSeek'),
      bar: $('#wcMpBar'),
      cur: $('#wcMpCur'),
      dur: $('#wcMpDur'),
      play: $('#wcMpPlay'),
      prev: $('#wcMpPrev'),
      next: $('#wcMpNext'),
      toast: $('#wcMpToast')
    };

    on(fab, 'click', function (e) { e.stopPropagation(); toggleOpen(); });
    S.ui.prev.innerHTML = ICON.prev;
    S.ui.next.innerHTML = ICON.next;
    paintState();
    on(S.ui.play, 'click', function (e) { e.stopPropagation(); toggle(); });
    on(S.ui.prev, 'click', function (e) { e.stopPropagation(); prev(); });
    on(S.ui.next, 'click', function (e) { e.stopPropagation(); next(); });
    on(S.ui.modeBtn, 'click', function (e) { e.stopPropagation(); cycleMode(); });
    on(S.ui.seek, 'click', function (e) {
      e.stopPropagation();
      if (!S.el || !isFinite(S.el.duration) || S.el.duration <= 0) return;
      var r = S.ui.seek.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      S.el.currentTime = p * S.el.duration;
    });
    on(box, 'click', function (e) { e.stopPropagation(); });
    on(document, 'click', function () { if (S.open) toggleOpen(false); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape' && S.open) toggleOpen(false); });

    return S.ui;
  }

  function toggleOpen(force) {
    buildUI();
    S.open = (typeof force === 'boolean') ? force : !S.open;
    S.ui.box.classList.toggle('on', S.open);
    S.ui.fab.classList.toggle('on', S.open);
  }

  function paintMeta() {
    if (!S.ui) return;
    var t = S.pack && S.pack.tracks[S.i];
    S.ui.ttl.textContent = t ? t.t : '—';
    S.ui.ttl.title = t ? t.t : '';
    S.ui.idx.textContent = (S.i + 1) + ' / ' + (S.pack ? S.pack.tracks.length : 0);
    if (S.ui.modeTxt) S.ui.modeTxt.textContent = (t && t.a) ? t.a : '';
  }

  function paintState() {
    if (!S.ui) return;
    S.ui.play.innerHTML = S.playing ? ICON.pause : ICON.play;
    S.ui.play.title = S.playing ? '暂停' : '播放';
    S.ui.modeBtn.innerHTML = MODE_ICON[S.mode] + '<span>' + MODE_LABEL[S.mode] + '</span>';
    S.ui.fab.classList.toggle('playing', S.playing);
    paintMeta();
  }

  function paintProgress() {
    if (!S.ui || !S.el) return;
    var d = S.el.duration, c = S.el.currentTime;
    if (!isFinite(d) || d <= 0) { S.ui.bar.style.width = '0%'; return; }
    S.ui.bar.style.width = (c / d * 100) + '%';
    S.ui.cur.textContent = fmt(c);
    S.ui.dur.textContent = fmt(d);
  }

  /* ---------- 白名单（留声机碟片） ---------- */
  function applyAllow(list) {
    CFG.allow = list;
    if (!S.pack || !S.packOriginal) {
      if (S.pack) S.packOriginal = S.pack.tracks.slice();
      else return;
    }
    var keep = S.packOriginal.filter(function (t) { return (list || []).indexOf(t.f) >= 0; });
    S.pack.tracks = keep;
    if (S.i >= keep.length) S.i = keep.length ? 0 : -1;
    if (!keep.length) {
      if (S.el) { try { S.el.pause(); } catch (e) {} }
      S.playing = false;
      if (S.ui) {
        S.ui.fab.style.display = 'none';       /* 没有碟：不显示音符 */
        S.ui.fab.classList.remove('empty');
        S.ui.box.style.display = 'none';
      }
      return;
    }
    if (S.ui) { S.ui.fab.style.display = ''; S.ui.fab.classList.remove('empty'); }
    try { paintState(); paintMeta(); } catch (e) {}
  }

  /* ---------- 启动 ---------- */
  function init() {
    loadSaved();
    buildUI();

    // 清单没到之前按钮是灰的，点了给提示；加载失败就整个撤退，不影响游戏
    loadPack().then(function (pack) {
      if (!pack || !pack.tracks || !pack.tracks.length) throw new Error('空清单');
      S.pack = pack;
      S.packOriginal = pack.tracks.slice();
      if (CFG.allow) applyAllow(CFG.allow);
      else if (S.ui) S.ui.fab.style.display = '';
      S.ready = true;
      if (S.i < 0 || S.i >= pack.tracks.length) S.i = 0;
      paintState();
      paintMeta();
      watchPlot();
      if (plotBusy()) S.plotHold = false;
    }).catch(function (err) {
      // 单文件版没有 music/，这里静默退出
      if (window.console && console.info) console.info('[音乐播放器] 未启用：' + err.message);
      if (S.ui) {
        S.ui.fab.style.display = 'none';
        S.ui.box.style.display = 'none';
      }
    });
  }

  // 对外小接口，方便在控制台里调
  window.MusicPlayer = {
    setAllow: function (list) { try { applyAllow(list || []); } catch (e) {} },
    play: function (i) { play(typeof i === 'number' ? i : undefined, true); },
    pause: pause,
    next: next,
    prev: prev,
    mode: function (m) { if (MODES.indexOf(m) >= 0) { S.mode = m; save(); paintState(); } },
    open: function () { toggleOpen(true); },
    close: function () { toggleOpen(false); },
    get state() { return S; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /* ===== 切到后台就静音，回前台接着放 =====
     不换曲、不改播放列表，只是暂停/继续。 */
  var _bgWasPlaying = false;
  function _onHide(){
    try{
      _bgWasPlaying = !!S.playing;
      if (S.el && !S.el.paused) S.el.pause();
      S.playing = false;
      paintState();
    }catch(e){}
  }
  function _onShow(){
    try{
      if (_bgWasPlaying && S.pack && S.pack.tracks && S.pack.tracks.length) {
        var a = audio();
        var p = a.play();
        if (p && p.catch) p.catch(function(){});
        S.playing = true;
        paintState();
      }
    }catch(e){}
    _bgWasPlaying = false;
  }
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) _onHide(); else _onShow();
  });
  window.addEventListener('pagehide', _onHide);
  window.addEventListener('pageshow', _onShow);

})();
