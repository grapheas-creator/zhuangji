
/* ===== 调试面板：?debug=1 ===== */
(function(){
  try{
    if(location.search.indexOf('debug')<0)return;
    window.__errs=[];
    window.addEventListener('error',function(e){try{window.__errs.push(String(e.message||e.error).slice(0,90));}catch(x){}});
    const box=document.createElement('div');
    box.id='dbgPanel';
    box.style.cssText='position:fixed;left:6px;top:64px;z-index:100000;max-width:74vw;padding:8px 10px;'+
      'background:rgba(20,12,8,.94);color:#ffd9c8;font:11px/1.45 monospace;border-radius:8px;'+
      'white-space:pre-wrap;pointer-events:none;max-height:52vh;overflow:hidden';
    document.body.appendChild(box);
    /* 测试按钮：一键完成新手引导并跳到第 2 天（零元购剧情） */
    window.__DBG_FINISH_TUT=function(){
      try{
        if(!state)return;
        const cats=['mb','cpu','cooler','ram','disk','psu','case'];
        /* 先拼一台陈默的旧机存进客户档案，后面「升级单」要用 */
        const mk=function(cat){try{const q=tutPick(cat);return q?{part:q,paid:0,shop:'own'}:null;}catch(e){return null;}};
        const mach={case:mk('case'),psu:mk('psu'),mb:mk('mb'),cpu:mk('cpu'),cooler:mk('cooler'),
          gpu1:null,gpu2:null,rams:[mk('ram')],m2:[],sata:[mk('disk')],paste:true};
        state.customers=state.customers||{};
        state.customers['陈默']=state.customers['陈默']||{name:'陈默'};
        state.customers['陈默'].machine=mach;
        /* 引导标记完成 */
        state.tut=state.tut||{done:{}};
        state.tut.done={accept:true,buy:true,install:true,paste:true,deliver:true,close:true};
        state.tut.bought={};state.tut.parts={};
        cats.forEach(function(c){state.tut.bought[c]=true;state.tut.parts[c]=true;});
        state.tut.guideOff=true;state.tut.hidden=true;state.tut.onboarded=1;
        /* 教程单作废，清工作台 */
        state.jobs=(state.jobs||[]).filter(function(j){return !(j&&(j.id==='S1'||j.storyId==='c1d1'));});
        state.activeId=null;state.dayTotal=state.jobs.length;state.panel='jobs';
        try{build=newBuild();}catch(e){}
        /* 跳到第 2 天 */
        if((state.day||1)<2){
          const d=new Date((state.date||'2026-11-07')+'T12:00:00');
          d.setDate(d.getDate()+(2-(state.day||1)));
          state.day=2;
          state.date=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        }
        try{coachHide();}catch(e){}
        try{document.body.classList.remove('tut-run');}catch(e){}
        save();renderAll();
        try{__ARC.onNewDay();}catch(e){}
        try{toast('测试：新手引导已跳过，进入第 2 天');}catch(e){}
      }catch(e){}
    };
    const bar=document.createElement('div');
    bar.style.cssText='position:fixed;left:6px;bottom:74px;z-index:100002;display:flex;gap:6px;pointer-events:auto';
    const b1=document.createElement('button');
    b1.textContent='完成新手引导（测试）';
    b1.style.cssText='padding:9px 12px;border-radius:10px;border:1px solid #f0bfd0;background:#fffdfa;color:#8a3f57;font:12.5px/1.2 sans-serif;box-shadow:0 6px 16px -8px rgba(120,50,80,.5)';
    b1.onclick=function(){window.__DBG_FINISH_TUT();};
    bar.appendChild(b1);
    document.body.appendChild(bar);
    let force='-';
    setInterval(function(){
      try{
        var g=function(fn,d){try{return fn();}catch(e){return d+'!'+e.message;}};
        var stepK=g(function(){var s=coachStep();return s?s.k:'null';},'ERR');
        var tg=document.getElementById('tutGal');
        var T=g(function(){return state.tut?JSON.stringify({done:Object.keys(state.tut.done||{}).length,hidden:!!state.tut.hidden,off:!!state.tut.guideOff}):'无';},'?');
        var info=[
          'step: '+stepK,
          'panel: '+g(function(){return state.panel;},'?'),
          'tutGal: '+(tg?tg.className:'无'),
          'coachKey: '+g(function(){return String(_coachKey);},'?'),
          'dismissed: '+g(function(){return String(_coachDismissed);},'?'),
          'hold: '+g(function(){return Math.round(_coachHoldUntil-Date.now());},'?'),
          'opSeq: '+g(function(){return _openingSeq;},'?'),
          'chain: '+g(function(){return Scene.chain+'/'+Scene.playing;},'?'),
          'tut: '+T,
          'load: '+!!document.getElementById('startLoad'),
          'force: '+force,
          'errs: '+(window.__errs||[]).slice(-2).join(' | ')
        ];
        box.textContent=info.join('\n');
      }catch(e){box.textContent='dbg ERR '+e.message;}
    },700);
    /* 每 2 秒强行刷新一次引导，看是「没被调用」还是「调用也画不出」 */
    setInterval(function(){
      try{ coachRefresh(); force='called'; }catch(e){ force='ERR:'+e.message; }
    },2000);
  }catch(e){}
})();
