(function(){
  const TOKEN_KEY='life_os_todoist_token';
  const LOCAL_DONE_KEY='life_os_todoist_done_v2';
  const API='https://api.todoist.com/api/v1';
  const PROJECTS=[
    {id:'6h9M43R7RWC7JcC5',name:'Привычки',type:'habit'},
    {id:'6h9M43XMVgmVRRhm',name:'Дела',type:'task'}
  ];

  function installTokenFromHash(){
    const raw=String(location.hash||'');
    const match=raw.match(/todoist-token=([A-Fa-f0-9]{32,128})/);
    if(!match)return false;
    localStorage.setItem(TOKEN_KEY,match[1]);
    history.replaceState(null,'',location.pathname+location.search+'#home');
    try{if(typeof showView==='function')showView('home')}catch(_){ }
    return true;
  }

  installTokenFromHash();
  function token(){return localStorage.getItem(TOKEN_KEY)||''}
  window.LIFE_OS_TODOIST_BRIDGE_ACTIVE=!!token();

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

  async function api(path,options){
    const t=token();
    if(!t)throw new Error('TOKEN_MISSING');
    const opts=Object.assign({cache:'no-store',mode:'cors'},options||{});
    opts.headers=Object.assign({},opts.headers||{},{Authorization:'Bearer '+t});
    return fetch(API+path,opts);
  }

  function currentItems(){
    if(typeof todayDay!=='function')return[];
    const day=todayDay();
    const out=[];
    (day.habits||[]).forEach((item,index)=>{if(item&&item.source==='Todoist'&&item.rawTodoistId)out.push({kind:'habit',index,item,id:String(item.rawTodoistId)})});
    (day.tasks||[]).forEach((item,index)=>{if(item&&item.source==='Todoist'&&item.rawTodoistId)out.push({kind:'task',index,item,id:String(item.rawTodoistId)})});
    return out;
  }

  function dueDate(task){
    const raw=task&&((task.due&&task.due.date)||task.due_date||(task.due&&task.due.datetime)||task.due_datetime)||'';
    return String(raw).slice(0,10);
  }

  function dueTime(task){
    const raw=task&&((task.due&&task.due.datetime)||task.due_datetime)||'';
    if(raw){
      const d=new Date(String(raw));
      if(!Number.isNaN(d.getTime())){
        try{return new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)}catch(_){ }
      }
    }
    const text=String(task&&((task.due&&task.due.string)||task.due_string)||'');
    const m=text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
    return m?m[1].padStart(2,'0')+':'+m[2]:'';
  }

  async function loadProject(project){
    let cursor='';
    const all=[];
    do{
      const qs=new URLSearchParams({project_id:project.id,limit:'200'});
      if(cursor)qs.set('cursor',cursor);
      const res=await api('/tasks?'+qs.toString());
      if(!res.ok){
        let detail='';try{detail=await res.text()}catch(_){ }
        throw new Error('Todoist tasks '+res.status+(detail?' '+detail.slice(0,120):''));
      }
      const data=await res.json();
      const rows=Array.isArray(data)?data:(Array.isArray(data&&data.results)?data.results:[]);
      all.push(...rows);
      cursor=Array.isArray(data)?'':String(data&&data.next_cursor||'');
    }while(cursor);
    return all.map(task=>({task:task,project:project}));
  }

  function toSiteItem(ref){
    const task=ref.task,project=ref.project,time=dueTime(task);
    return {
      id:'todo-'+project.type+'-'+String(task.id||''),
      title:(time?time+' · ':'')+String(task.content||'').trim(),
      note:project.name,
      done:false,
      source:'Todoist',
      rawTodoistId:String(task.id||''),
      section:'',
      project:project.name,
      labels:Array.isArray(task.labels)?task.labels:[]
    };
  }

  async function syncLiveTodoist(){
    if(!token()||typeof todayDay!=='function')return false;
    window.LIFE_OS_TODOIST_BRIDGE_ACTIVE=true;
    try{
      const date=todayIso();
      const groups=await Promise.all(PROJECTS.map(loadProject));
      const refs=groups.flat().filter(ref=>dueDate(ref.task)===date&&ref.task&&ref.task.id);
      const ids=new Set(refs.map(ref=>String(ref.task.id)));
      const previous=currentItems();

      previous.forEach(ref=>{
        if(ids.has(ref.id))return;
        rememberDone(ref.kind,ref.id);
        try{if(typeof window.lifeOsArchiveCompletedItem==='function')window.lifeOsArchiveCompletedItem(ref.kind,ref.item)}catch(_){ }
      });

      const day=todayDay();
      day.habits=refs.filter(ref=>ref.project.type==='habit').map(toSiteItem);
      day.tasks=refs.filter(ref=>ref.project.type==='task').map(toSiteItem);
      window.LIFE_OS_LIVE_ACTIVE=true;
      try{if(typeof renderHome==='function')renderHome()}catch(_){ }
      try{if(typeof window.renderLifeCommandBlock==='function')window.renderLifeCommandBlock()}catch(_){ }
      return true;
    }catch(error){
      console.warn('Life OS Todoist live sync failed',error);
      return false;
    }
  }

  async function completeTodoistTask(taskId){
    if(!taskId)throw new Error('TASK_ID_MISSING');
    const res=await api('/tasks/'+encodeURIComponent(String(taskId))+'/close',{method:'POST'});
    if(!(res.status===200||res.status===204)){
      let detail='';try{detail=await res.text()}catch(_){ }
      throw new Error('Todoist close '+res.status+(detail?' '+detail.slice(0,160):''));
    }
    setTimeout(syncLiveTodoist,250);
    return true;
  }

  window.lifeOsCompleteTodoist=completeTodoistTask;
  window.lifeOsRefreshTodoist=syncLiveTodoist;
  window.lifeOsSyncTodoistLive=syncLiveTodoist;
  window.lifeOsHasTodoistToken=()=>!!token();

  const oldRefresh=window.refreshLifeOsToday;
  if(typeof oldRefresh==='function'){
    window.refreshLifeOsToday=async function(){
      const result=await oldRefresh.apply(this,arguments);
      if(token())await syncLiveTodoist();
      return result;
    };
  }

  window.addEventListener('load',()=>{
    if(!token())return;
    setTimeout(syncLiveTodoist,300);
    setInterval(syncLiveTodoist,10000);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token())setTimeout(syncLiveTodoist,80)});
})();