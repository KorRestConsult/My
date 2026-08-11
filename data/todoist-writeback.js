(function(){
  const TOKEN_KEY='life_os_todoist_token';
  const LOCAL_DONE_KEY='life_os_todoist_done_v2';
  const API_V1='https://api.todoist.com/api/v1';
  const REST_V2='https://api.todoist.com/rest/v2';
  const SYNC_V9='https://api.todoist.com/sync/v9/sync';

  function installTokenFromHash(){
    const raw=String(location.hash||'');
    const match=raw.match(/todoist-token=([A-Fa-f0-9]{32,128})/);
    if(!match)return false;
    localStorage.setItem(TOKEN_KEY,match[1]);
    history.replaceState(null,'',location.pathname+location.search+'#home');
    try{if(typeof showView==='function')showView('home')}catch(_){ }
    return true;
  }

  function token(){return localStorage.getItem(TOKEN_KEY)||''}
  function authHeaders(extra){return Object.assign({},extra||{},{Authorization:'Bearer '+token()})}

  async function request(url,options){
    if(!token())throw new Error('TOKEN_MISSING');
    const opts=Object.assign({mode:'cors'},options||{});
    opts.headers=authHeaders(opts.headers);
    return fetch(url,opts);
  }

  function todayIso(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function rawDueDate(task){
    const due=task&&task.due;
    if(!due)return'';
    return String(due.date||due.datetime||'').slice(0,10);
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

  async function closeViaEndpoint(base,taskId){
    const res=await request(base+'/tasks/'+encodeURIComponent(taskId)+'/close',{method:'POST'});
    if(res.ok)return true;
    let text='';try{text=await res.text()}catch(_){ }
    throw new Error(base+' '+res.status+(text?' '+text.slice(0,120):''));
  }

  async function closeViaSync(taskId){
    const uuid=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():(Date.now().toString(16)+'-'+Math.random().toString(16).slice(2));
    const body=new URLSearchParams();
    body.set('commands',JSON.stringify([{type:'item_close',uuid:uuid,args:{id:String(taskId)}}]));
    const res=await request(SYNC_V9,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:body.toString()});
    if(!res.ok)throw new Error('sync '+res.status);
    const data=await res.json();
    if(data&&data.sync_status&&data.sync_status[uuid]==='ok')return true;
    throw new Error('sync rejected');
  }

  async function completeTodoistTask(taskId){
    if(!taskId)throw new Error('TASK_ID_MISSING');
    if(!token())throw new Error('TOKEN_MISSING');
    const errors=[];
    for(const base of [API_V1,REST_V2]){
      try{if(await closeViaEndpoint(base,taskId))return true}catch(error){errors.push(String(error&&error.message||error))}
    }
    try{if(await closeViaSync(taskId))return true}catch(error){errors.push(String(error&&error.message||error))}
    throw new Error(errors.join(' | ')||'Todoist close failed');
  }

  async function getTask(taskId){
    const errors=[];
    for(const base of [API_V1,REST_V2]){
      try{
        const res=await request(base+'/tasks/'+encodeURIComponent(taskId));
        if(res.status===404)return {missing:true};
        if(res.ok)return {task:await res.json()};
        errors.push(base+' '+res.status);
      }catch(error){errors.push(String(error&&error.message||error))}
    }
    throw new Error(errors.join(' | ')||'Todoist get failed');
  }

  async function refreshTodoistCompletionState(){
    if(!token())return;
    const items=currentItems();
    if(!items.length)return;
    const today=todayIso();
    let changed=false;
    await Promise.all(items.map(async ref=>{
      if(ref.item.done)return;
      try{
        const result=await getTask(ref.id);
        let done=!!result.missing;
        if(result.task){
          const dueDate=rawDueDate(result.task);
          if(dueDate&&dueDate!==today)done=true;
          if(result.task.checked===true||result.task.is_completed===true)done=true;
        }
        if(done){
          ref.item.done=true;
          rememberDone(ref.kind,ref.id);
          try{if(typeof window.lifeOsArchiveCompletedItem==='function')window.lifeOsArchiveCompletedItem(ref.kind,ref.item)}catch(_){ }
          changed=true;
        }
      }catch(error){console.warn('Todoist status check failed',ref.id,error)}
    }));
    if(changed){
      try{if(typeof renderHome==='function')renderHome()}catch(_){ }
      try{if(typeof window.renderLifeCommandBlock==='function')window.renderLifeCommandBlock()}catch(_){ }
    }
  }

  installTokenFromHash();

  window.lifeOsCompleteTodoist=completeTodoistTask;
  window.lifeOsRefreshTodoist=refreshTodoistCompletionState;
  window.lifeOsHasTodoistToken=()=>!!token();

  const oldRefresh=window.refreshLifeOsToday;
  if(typeof oldRefresh==='function'){
    window.refreshLifeOsToday=async function(){
      const result=await oldRefresh.apply(this,arguments);
      await refreshTodoistCompletionState();
      return result;
    };
  }

  window.addEventListener('load',()=>{
    setTimeout(refreshTodoistCompletionState,700);
    setInterval(refreshTodoistCompletionState,30000);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshTodoistCompletionState,120)});
})();