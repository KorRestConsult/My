(function(){
  const ENDPOINT='https://ilya-life-os.netlify.app/api/todoist-complete';

  async function completeTodoistTask(taskId){
    if(!taskId)return;
    try{
      await fetch(ENDPOINT,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify({taskId:String(taskId)})
      });
    }catch(error){
      console.warn('Todoist writeback failed',error);
    }
  }

  document.addEventListener('click',function(event){
    const button=event.target.closest('#lifeCommandCard .os-check');
    if(!button)return;
    const row=button.closest('.life-command-row');
    if(!row)return;
    const title=(row.querySelector('.life-command-row-title')?.childNodes?.[0]?.textContent||'').trim();
    if(!title||typeof todayDay!=='function')return;
    const day=todayDay();
    const all=[...(day.habits||[]),...(day.tasks||[])];
    const match=all.find(item=>String(item.title||'').replace(/^\s*\d{1,2}:\d{2}\s*[·•-]?\s*/,'').trim()===title);
    const taskId=match&&match.rawTodoistId;
    if(taskId)completeTodoistTask(taskId);
  },true);

  window.lifeOsCompleteTodoist=completeTodoistTask;
})();
