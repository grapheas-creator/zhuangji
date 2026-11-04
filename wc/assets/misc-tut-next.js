
try{
 document.addEventListener('click',e=>{
   const id=e.target&&e.target.id;
   if(id==='tutNext'){const b=document.getElementById('coachNext');if(b)b.click();}
   if(id==='tutSkip'){const b=document.getElementById('coachSkip');if(b)b.click();}
   if(id==='tutVoice'){const b=document.getElementById('coachVoice');if(b)b.click();}
 },true);
}catch(e){}
