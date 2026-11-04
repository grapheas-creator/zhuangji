
/* 统一看门狗（1.5s，三个合并成一个）：①加载页超时兜底 ②引导缺失重试/光圈对齐 */
try{
  setInterval(function(){
    try{
      const ld=document.getElementById('startLoad');
      if(ld){
        /* 没有场景在播却还挂着加载页：说明收尾回调丢了，直接揭开（至少 1.2 秒） */
        /* 链卡死（chain=true 但没有任何场景在播、且超过 4 秒）也要能揭开，
           否则玩家会永远停在“正在生火开张”这行字上。 */
        const _stuck=Scene.chain&&!Scene.playing&&Date.now()-(Scene.chainAt||0)>4000;
        /* 常规路径由开局流程负责撤加载页；这里只在「流程卡死」时兜底：
           超过 20 秒还没撤，且没有场景在播。 */
        if((!Scene.busy()||_stuck)&&!window.__booting&&Date.now()-(window.__loadAt||0)>20000){
          if(_stuck)Scene.chain=false;
          ld.style.opacity='0';
          setTimeout(()=>{try{ld.remove();}catch(e){}if(!Scene.busy())try{Scene.chrome(true);}catch(e){}
            /* 加载页一撤就立刻叫引导，别让玩家对着空页面等 */
            setTimeout(()=>{try{if(typeof coachRefresh==='function')coachRefresh();}catch(e){}},500);},420);
        }
        return;
      }
      if(!state||(state.day||1)!==1||(state.tut&&state.tut.guideOff))return;
      if(Scene.busy())return;
      const c=document.getElementById('coach');
      const st=(typeof coachStep==='function')?coachStep():null;
      if(!st){if(c&&c.classList.contains('on'))coachHide();return;}
      if(c&&c.classList.contains('on')&&st.sel){
        let want=null;try{want=st.sel();}catch(e){}
        if(want&&want!==_coachEl)try{if(positionCoach(want))_coachEl=want;}catch(e){}
        return;
      }
      if(typeof coachRefresh==='function')coachRefresh();
    }catch(e){}
  },1500);
}catch(e){}
setTimeout(function(){
  try{
    var t=document.getElementById('tVer');
    if(t&&!window.__BOOT_OK){
      t.textContent=(typeof APP_FULL==='string'?APP_FULL:'v0.12.0.x')+' · 脚本失败';
      t.style.color='#ff9f8f';
      var b=document.getElementById('tStart');
      if(b&&!b.__fallback){b.__fallback=1;b.onclick=function(){alert('脚本加载失败：请强制刷新页面（或换浏览器）');};}
    }else if(t&&window.__BOOT_OK){
      t.textContent=(typeof APP_VER_TXT==='string'?APP_VER_TXT:(typeof APP_FULL==='string'?APP_FULL:'v0.12.0.x'));
    }
  }catch(e){}
},1600);
