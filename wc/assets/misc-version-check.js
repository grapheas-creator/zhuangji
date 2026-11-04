
/* ===== 自动更新 =====
   1) 打开页面先拿 version.json（no-store 绕过缓存）比对版本
   2) 不一致 → 显示「发现新版本，正在更新…」→ 换带 ?v= 的地址重载
   3) 重载后弹出「游戏已更新到 vX」提示条，几秒后自动消失 */
(function(){
  try{
    var cur=(typeof APP_BUILD==='string')?APP_BUILD:'';
    if(!cur)return;
    var KEY='wczj_reloaded_for', DONEFLAG='wczj_updated_to';

    /* ---- 刚更新完：给一条提示 ---- */
    try{
      var done=sessionStorage.getItem(DONEFLAG);
      if(done&&done===cur){
        sessionStorage.removeItem(DONEFLAG);
        setTimeout(function(){
          /* 不要用游戏自带的 toast（那是深棕色），统一走下面这套奶油樱花样式 */
          var t=document.createElement('div');
          t.textContent='游戏已更新到 v'+cur;
          t.style.cssText='position:fixed;left:50%;top:13%;transform:translateX(-50%);z-index:100000;'+
            'padding:11px 22px;border-radius:14px;background:linear-gradient(180deg,#fffdfa,#fdf2e7);'+
            'color:#8c4351;font:400 14px/1.5 "WCCute","PingFang SC",sans-serif;letter-spacing:.5px;'+
            'box-shadow:0 14px 30px -16px rgba(160,90,110,.6);'+
            'border:1px solid rgba(242,138,164,.55);'+
            'pointer-events:none;opacity:0;transition:opacity .3s ease';
          document.body.appendChild(t);
          requestAnimationFrame(function(){t.style.opacity='1';});
          setTimeout(function(){t.style.opacity='0';setTimeout(function(){try{t.remove();}catch(e){}},400);},2600);
        },1200);
      }
    }catch(e){}

    /* ---- 检查新版本（可重复调用） ---- */
    var checking=false;
    function checkVersion(){
      if(checking)return;checking=true;
      fetch('version.json?ts='+Date.now(),{cache:'no-store'}).then(function(r){
      if(!r.ok)throw 0;return r.json();
    }).then(function(d){
      var remote=d&&String(d.build||'');
      if(!remote||remote===cur){try{sessionStorage.setItem('wczj_try','0');}catch(e){}return;}
      /* 正在玩（开局之后）不自动刷新：中途刷新会让剧情从头再来一遍。
         等回到标题页或下次打开再生效。 */
      if(window.__inGame){ try{sessionStorage.setItem('wczj_pending',remote);}catch(e){} return; }
      /* 允许多次重试直到拿到最新：万一 Reload 拿到的还是 CDN 里的中间版本，
         下轮会换个随机参数再来，最多 5 次，避免卡在旧版本或死循环。 */
      let tries=0;
      try{ tries=parseInt(sessionStorage.getItem('wczj_try')||'0',10)||0; }catch(e){}
      if(tries>=5){try{sessionStorage.setItem('wczj_try','0');}catch(e){}return;}
      try{ sessionStorage.setItem('wczj_try',String(tries+1)); }catch(e){}
      try{sessionStorage.setItem(DONEFLAG,remote);}catch(e){}
      /* 先给个提示，再刷新 */
      try{
        var b=document.createElement('div');
        b.textContent='发现新版本 v'+remote+'，正在更新…';
        b.style.cssText='position:fixed;left:50%;top:13%;transform:translateX(-50%);z-index:100000;'+
          'padding:11px 22px;border-radius:14px;background:linear-gradient(180deg,#fffdfa,#fdf2e7);'+
          'color:#8c4351;font:400 14px/1.5 "WCCute","PingFang SC",sans-serif;letter-spacing:.5px;'+
          'box-shadow:0 14px 30px -16px rgba(160,90,110,.6);'+
          'border:1px solid rgba(242,138,164,.55);pointer-events:none';
        document.body.appendChild(b);
      }catch(e){}
      setTimeout(function(){
        var u=location.pathname+'?v='+encodeURIComponent(remote)+'&r='+Date.now().toString(36);
        try{ location.replace(u); }catch(e){ location.href=u; }
      },900);
      }).catch(function(){checking=false;});
    }
    checkVersion();
    /* 页面一直开着也能收到更新：每 3 分钟查一次，回到前台再查一次 */
    try{ setInterval(checkVersion,180000); }catch(e){}
    try{
      document.addEventListener('visibilitychange',function(){
        if(document.visibilityState==='visible'){checking=false;checkVersion();}
      });
    }catch(e){}
  }catch(e){}
})();
