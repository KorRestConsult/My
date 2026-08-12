(function(){
  const LOCAL_DONE_KEY='life_os_todoist_done_v2';
  const BRIDGE='https://ilya-todoist-bridge.netlify.app/todoist';
  const HABITS_PROJECT='6h9M43R7RWC7JcC5';
  const TASKS_PROJECT='6h9M43XMVgmVRRhm';
  const ALLOWED_PROJECTS=new Set([HABITS_PROJECT,TASKS_PROJECT]);

  try{localStorage.removeItem('life_os_todoist_token')}catch(_){ }

  async function bridgeRequest(url,options){
    const opts=Object.assign({mode:'cors',cache:'no-store'},options||{});
    const res=await fetch(url,opts);
    let data=null;
    try{data=await res.json()}catch(_){ }
    if(!res.ok||!data||data.ok!==true){
      const detail=data&&data.error?String(data.error):('HTTP_'+res.status);
      throw new Error(detail);
    }
    return data;
  }

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

  function dueTime(task){
    const due=task&&task.due||{};
    const raw=due.datetime||((String(due.date||'').includes('T'))?due.date:'');
    if(!raw)return'';
    const d=new Date(raw);
    if(!Number.isFinite(d.getTime()))return'';
    return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  }

  function toSiteItem(task){
    const projectId=String(task.project_id||'');
    const kind=projectId===TASKS_PROJECT?'task':'habit';
    const time=dueTime(task);
    return {
      id:'todo-'+kind+'-'+String(task.id),
      title:(time?time+' · ':'')+String(task.content||''),
      note:projectId===TASKS_PROJECT?'Дела':'Привычки',
      done:false,
      source:'Todoist',
      rawTodoistId:String(task.id||''),
      section:String(task.section_id||''),
      project:projectId===TASKS_PROJECT?'Дела':'Привычки',
      labels:Array.isArray(task.labels)?task.labels:[]
    };
  }

  async function completeTodoistTask(taskId){
    if(!taskId)throw new Error('TASK_ID_MISSING');
    await bridgeRequest(BRIDGE,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'complete',taskId:String(taskId)})
    });
    setTimeout(syncLiveTodoist,150);
    setTimeout(syncLiveTodoist,900);
    return true;
  }

  async function fetchTodayRows(){
    const data=await bridgeRequest(BRIDGE+'?action=today');
    const rows=Array.isArray(data.results)?data.results:[];
    return rows.filter(x=>ALLOWED_PROJECTS.has(String(x.project_id||'')));
  }

  async function syncLiveTodoist(){
    if(typeof todayDay!=='function')return false;
    try{
      const rows=await fetchTodayRows();
      const ids=new Set(rows.map(x=>String(x.id||'')));
      const previous=currentItems();

      previous.forEach(ref=>{
        if(ids.has(ref.id))return;
        rememberDone(ref.kind,ref.id);
        try{if(typeof window.lifeOsArchiveCompletedItem==='function')window.lifeOsArchiveCompletedItem(ref.kind,ref.item)}catch(_){ }
      });

      const day=todayDay();
      day.habits=rows.filter(x=>String(x.project_id||'')===HABITS_PROJECT).map(toSiteItem);
      day.tasks=rows.filter(x=>String(x.project_id||'')===TASKS_PROJECT).map(toSiteItem);
      window.LIFE_OS_LIVE_ACTIVE=true;
      window.LIFE_OS_TODOIST_DIRECT_ACTIVE=false;
      window.LIFE_OS_TODOIST_BRIDGE_ACTIVE=true;
      window.LIFE_OS_TODOIST_LAST_ERROR='';

      try{if(typeof renderHome==='function')renderHome()}catch(_){ }
      try{if(typeof window.renderLifeCommandBlock==='function')window.renderLifeCommandBlock()}catch(_){ }
      return true;
    }catch(error){
      window.LIFE_OS_TODOIST_LAST_ERROR=String(error&&error.message||error);
      console.warn('Life OS Todoist bridge sync failed',error);
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
    setTimeout(syncLiveTodoist,180);
    setInterval(syncLiveTodoist,10000);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(syncLiveTodoist,50)});
})();