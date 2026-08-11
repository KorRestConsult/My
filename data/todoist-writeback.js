(function(){
  const TOKEN_KEY='life_os_todoist_token';
  const LOCAL_DONE_KEY='life_os_todoist_done_v2';
  const API='https://api.todoist.com/api/v1';

  function installTokenFromHash(){
    const match=String(location.hash||'').match(/^#todoist-token=([A-Fa-f0-9]{32,128})$/);
    if(!match)return false;
    localStorage.setItem(TOKEN_KEY,match[1]);
    history.replaceState(null,'',location.pathname+location.search+'#home');
    try{if(typeof showView==='function')showView('home')}catch(_){ }
    return true;
  }

  function token(){return localStorage.getItem(TOKEN_KEY)||''}

  async function api(path,options){
    const t=token();
    if(!t)throw new Error('Todoist token is not installed');
    const opts=Object.assign({},options||{});
    opts.mode='cors';
    opts.headers=Object.assign({},opts.headers||{}, {Authorization:'Bearer '+t});
    return fetch(API+path,opts);
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
    (day.habits||[]).forEach((item,index)=>{if(item&&item.rawTodoistId)out.push({kind:'habit',index,item,id:String(item.rawTodoistId)})});
    (day.tasks||[]).forEach((item,index)=>{if(item&&item.rawTodoistId)out.push({kind:'task',index,item,id:String(item.rawTodoistId)})});
    return out;
  }

  async function completeTodoistTask(taskId){
    if(!taskId||!token())return false;
    const res=await api('/tasks/'+encodeURIComponent(taskId)+'/close',{method:'POST'});
    if(!res.ok)throw new Error('Todoist close failed: '+res.status);
    return true;
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
        const res=await api('/tasks/'+encodeURIComponent(ref.id));
        let done=false;
        if(res.status===404){done=true}
        else if(res.ok){
          const task=await res.json();
          const dueDate=rawDueDate(task);
          if(dueDate&&dueDate!==today)done=true;
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

  function taskFromRow(row){
    if(!row||typeof todayDay!=='function')return null;
    const title=(row.querySelector('.life-command-row-title')?.childNodes?.[0]?.textContent||'').trim();
    if(!title)return null;
    const day=todayDay();
    const all=[...(day.habits||[]).map(item=>({kind:'habit',item})),...(day.tasks||[]).map(item=>({kind:'task',item}))];
    return all.find(ref=>String(ref.item.title||'').replace(/^\s*\d{1,2}:\d{2}\s*[·•-]?\s*/,'').trim()===title)||null;
  }

  installTokenFromHash();

  document.addEventListener('click',function(event){
    const button=event.target.closest('#lifeCommandCard .os-check');
    if(!button||button.dataset.lifeosManaged==='1')return;
    const ref=taskFromRow(button.closest('.life-command-row'));
    const taskId=ref&&ref.item&&ref.item.rawTodoistId;
    if(!taskId)return;
    rememberDone(ref.kind,taskId);
    completeTodoistTask(taskId)
      .then(()=>setTimeout(refreshTodoistCompletionState,500))
      .catch(error=>console.warn('Todoist writeback failed',error));
  },true);

  const oldRefresh=window.refreshLifeOsToday;
  if(typeof oldRefresh==='function'){
    window.refreshLifeOsToday=async function(){
      const result=await oldRefresh.apply(this,arguments);
      await refreshTodoistCompletionState();
      return result;
    };
  }

  window.lifeOsCompleteTodoist=completeTodoistTask;
  window.lifeOsRefreshTodoist=refreshTodoistCompletionState;
  window.lifeOsHasTodoistToken=()=>!!token();

  window.addEventListener('load',()=>{
    setTimeout(refreshTodoistCompletionState,900);
    setInterval(refreshTodoistCompletionState,30000);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshTodoistCompletionState,150)});
})();
