(function(){
  const BRIDGE='https://ilya-life-os.netlify.app';
  const LOCAL_DONE_KEY='life_os_todoist_done_v2';
  window.LIFE_OS_TODOIST_BRIDGE_ACTIVE=true;

  function todayIso(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function rememberDone(kind,id){
    try{
      const all=JSON.parse(localStorage.getItem(LOCAL_DONE_KEY)||'{}');
      const day=todayIso();
      all[day]=all[day]||{};
      all[day][kind]=all[day][kind]||{};
      all[day][kind][String(id)]=true;
      localStorage.setItem(LOCAL_DONE_KEY,JSON.stringify(all));
    }catch(_){ }
  }

  function currentItems(){
    if(typeof todayDay!=='function')return[];
    const day=todayDay();
    const out=[];
    (day.habits||[]).forEach((item,index)=>{if(item&&item.source==='Todoist'&&item.rawTodoistId)out.push({kind:'habit',index,item,id:String(item.rawTodoistId)})});
    (day.tasks||[]).forEach((item,index)=>{if(item&&item.source==='Todoist'&&item.rawTodoistId)out.push({kind:'task',index,item,id:String(item.rawTodoistId)})});
    return out;
  }

  function toSiteItem(task,kind){
    const time=String(task.time||'');
    return {
      id:'todo-'+kind+'-'+String(task.id),
      title:(time?time+' · ':'')+String(task.title||''),
      note:String(task.project||''),
      done:false,
      source:'Todoist',
      rawTodoistId:String(task.id||''),
      section:String(task.section||''),
      project:String(task.project||''),
      labels:Array.isArray(task.labels)?task.labels:[]
    };
  }

  async function bridge(path,options){
    const res=await fetch(BRIDGE+path,Object.assign({cache:'no-store',mode:'cors'},options||{}));
    if(!res.ok){
      let detail='';try{detail=await res.text()}catch(_){ }
      throw new Error('Life OS bridge '+res.status+(detail?' '+detail.slice(0,160):''));
    }
    return res;
  }

  async function completeTodoistTask(taskId){
    if(!taskId)throw new Error('TASK_ID_MISSING');
    await bridge('/api/todoist-complete',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({taskId:String(taskId)})
    });
    setTimeout(syncLiveTodoist,250);
    return true;
  }

  async function syncLiveTodoist(){
    if(typeof todayDay!=='function')return false;
    try{
      const res=await bridge('/api/todoist-today?date='+encodeURIComponent(todayIso()));
      const data=await res.json();
      const rows=Array.isArray(data&&data.tasks)?data.tasks:[];
      const ids=new Set(rows.map(x=>String(x.id||'')));
      const previous=currentItems();

      previous.forEach(ref=>{
        if(ids.has(ref.id))return;
        rememberDone(ref.kind,ref.id);
        try{if(typeof window.lifeOsArchiveCompletedItem==='function')window.lifeOsArchiveCompletedItem(ref.kind,ref.item)}catch(_){ }
      });

      const day=todayDay();
      day.habits=rows.filter(x=>x.type==='habit').map(x=>toSiteItem(x,'habit'));
      day.tasks=rows.filter(x=>x.type!=='habit').map(x=>toSiteItem(x,'task'));
      window.LIFE_OS_LIVE_ACTIVE=true;

      try{if(typeof renderHome==='function')renderHome()}catch(_){ }
      try{if(typeof window.renderLifeCommandBlock==='function')window.renderLifeCommandBlock()}catch(_){ }
      return true;
    }catch(error){
      console.warn('Life OS Todoist live sync failed',error);
      return false;
    }
  }

  window.lifeOsCompleteTodoist=completeTodoistTask;
  window.lifeOsRefreshTodoist=syncLiveTodoist;
  window.lifeOsSyncTodoistLive=syncLiveTodoist;
  window.lifeOsHasTodoistToken=()=>true;

  const oldRefresh=window.refreshLifeOsToday;
  if(typeof oldRefresh==='function'){
    window.refreshLifeOsToday=async function(){
      const result=await oldRefresh.apply(this,arguments);
      await syncLiveTodoist();
      return result;
    };
  }

  window.addEventListener('load',()=>{
    setTimeout(syncLiveTodoist,350);
    setInterval(syncLiveTodoist,10000);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(syncLiveTodoist,80)});
})();