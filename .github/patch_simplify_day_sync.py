from pathlib import Path
import re

# 1) Fix Todoist completion using current Sync API item_close.
p = Path('data/todoist-writeback.js')
s = p.read_text()
pattern = r"  async function completeTodoistTask\(taskId\)\{.*?\n  \}\n\n  async function refreshTodoistCompletionState"
replacement = r'''  async function completeTodoistTask(taskId){
    if(!taskId||!token())return false;
    const uuid=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():(Date.now().toString(16)+'-'+Math.random().toString(16).slice(2));
    const commands=[{type:'item_close',uuid,args:{id:String(taskId)}}];
    const body=new URLSearchParams();
    body.set('commands',JSON.stringify(commands));
    const res=await api('/sync',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body:body.toString()
    });
    if(!res.ok)throw new Error('Todoist close failed: '+res.status);
    const data=await res.json();
    const status=data&&data.sync_status&&data.sync_status[uuid];
    if(status!=='ok')throw new Error('Todoist close rejected');
    return true;
  }

  async function refreshTodoistCompletionState'''
s2, n = re.subn(pattern, replacement, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('todoist completion function not found')
p.write_text(s2)

# 2) Simplify day view: one chronological list + completed, no three competing groups.
p = Path('index.html')
s = p.read_text()
s = s.replace("meta=active.item.place||active.item.category||''", "meta=active.item.place||''", 1)
s = s.replace("if(sync)sync.textContent='не синхронизировано';", "if(sync)sync.textContent='не удалось · повтори';", 1)

old_css = '''.life-command-progress{margin:7px 0 3px;padding:9px 0 7px;display:grid;grid-template-columns:1fr auto;gap:7px 10px;align-items:center}
.life-command-progress-label{font-size:9px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:rgba(112,96,78,.7)}
.life-command-progress-value{font-size:10px;font-weight:800;color:var(--gold2);font-variant-numeric:tabular-nums}
.life-command-progress-track{grid-column:1/-1;height:5px;border-radius:99px;background:rgba(116,91,57,.10);overflow:hidden}
.life-command-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--green2),#86b596);transition:width .45s cubic-bezier(.2,.8,.2,1)}'''
new_css = '''.life-command-progress{margin:7px 0 10px;padding:11px 12px 10px;display:grid;grid-template-columns:1fr auto;gap:7px 10px;align-items:center;border:1px solid rgba(63,143,101,.24);border-radius:11px;background:linear-gradient(145deg,rgba(63,143,101,.11),rgba(255,250,242,.70));box-shadow:inset 3px 0 0 rgba(63,143,101,.55)}
.life-command-progress-label{font-size:9px;font-weight:780;letter-spacing:.08em;text-transform:uppercase;color:rgba(46,103,70,.78)}
.life-command-progress-value{font-size:11px;font-weight:850;color:#2f6f4b;font-variant-numeric:tabular-nums}
.life-command-progress-track{grid-column:1/-1;height:6px;border-radius:99px;background:rgba(63,143,101,.12);overflow:hidden}
.life-command-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--green2),#86b596);transition:width .45s cubic-bezier(.2,.8,.2,1)}
.life-command-daylist{display:grid;gap:0}
.life-command-daylist .life-command-row:first-child{margin-top:0}'''
if old_css not in s:
    raise SystemExit('progress css not found')
s = s.replace(old_css, new_css, 1)

old_render = ''' function render(){
   if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;
   var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}
   var pending=actionRows(day,false),completed=completedRows(day),used={};(m.actions||[]).concat(m.carry||[]).forEach(function(a){used[a.kind+':'+a.index]=true});
   var future=pending.filter(function(a){return !used[a.kind+':'+a.index]});
   var total=pending.length+completed.length,doneCount=completed.length,pct=total?Math.round(doneCount/total*100):0;
   var progress='<div class="life-command-progress"><div class="life-command-progress-label">Прогресс дня</div><div class="life-command-progress-value">'+doneCount+' / '+total+'</div><div class="life-command-progress-track"><div class="life-command-progress-fill" style="width:'+pct+'%"></div></div></div>';
   var rows=m.actions.length?m.actions.map(row).join(''):'<div class="life-command-empty">В этом блоке активных пунктов нет.</div>';
   var carry=m.carry&&m.carry.length?'<div class="life-command-carry"><div class="life-command-carry-title">Просрочено · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';
   var futureRows=future.length?'<div class="life-command-future"><div class="life-command-future-title">Дальше сегодня · '+future.length+'</div>'+future.map(row).join('')+'</div>':'';
   var completedHtml=completed.length?'<div class="life-command-completed"><div class="life-command-completed-title">Выполнено · '+completed.length+'</div>'+completed.map(row).join('')+'</div>':'';
   var nx=m.next?'<div class="life-command-next">Следующий блок в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';
   card.innerHTML='<div class="life-command-head"><div><div class="life-command-kicker">'+esc(m.mode)+'</div><div class="life-command-time">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class="life-command-title">'+esc(m.title)+'</div>'+(m.meta?'<div class="life-command-meta">'+esc(m.meta)+'</div>':'')+'</div><div class="life-command-clock">'+esc(fmt(nowMin()))+'</div></div><div class="life-command-actions">'+progress+rows+carry+futureRows+completedHtml+'</div>'+nx;
 }'''
new_render = ''' function render(){
   if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;
   var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}
   var pending=actionRows(day,false),completed=completedRows(day);
   var total=pending.length+completed.length,doneCount=completed.length,pct=total?Math.round(doneCount/total*100):0;
   var progress='<div class="life-command-progress"><div class="life-command-progress-label">Прогресс дня</div><div class="life-command-progress-value">'+doneCount+' / '+total+'</div><div class="life-command-progress-track"><div class="life-command-progress-fill" style="width:'+pct+'%"></div></div></div>';
   var dayRows=pending.length?'<div class="life-command-daylist">'+pending.map(row).join('')+'</div>':'<div class="life-command-empty">На сегодня активных пунктов не осталось.</div>';
   var completedHtml=completed.length?'<div class="life-command-completed"><div class="life-command-completed-title">Выполнено · '+completed.length+'</div>'+completed.map(row).join('')+'</div>':'';
   card.innerHTML='<div class="life-command-head"><div><div class="life-command-kicker">'+esc(m.mode)+'</div><div class="life-command-time">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class="life-command-title">'+esc(m.title)+'</div>'+(m.meta?'<div class="life-command-meta">'+esc(m.meta)+'</div>':'')+'</div><div class="life-command-clock">'+esc(fmt(nowMin()))+'</div></div><div class="life-command-actions">'+progress+dayRows+completedHtml+'</div>';
 }'''
if old_render not in s:
    raise SystemExit('render function not found')
s = s.replace(old_render, new_render, 1)
p.write_text(s)
