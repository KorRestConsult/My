from pathlib import Path

p=Path('index.html')
s=p.read_text()

css_old=""".life-command-future{margin-top:7px;padding-top:8px;border-top:1px dashed rgba(116,91,57,.18)}
.life-command-future-title{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(112,96,78,.62);margin-bottom:1px}
"""
css_new=""".life-command-future{margin-top:7px;padding-top:8px;border-top:1px dashed rgba(116,91,57,.18)}
.life-command-future-title{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(112,96,78,.62);margin-bottom:1px}
.life-command-progress{margin:7px 0 3px;padding:9px 0 7px;display:grid;grid-template-columns:1fr auto;gap:7px 10px;align-items:center}
.life-command-progress-label{font-size:9px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:rgba(112,96,78,.7)}
.life-command-progress-value{font-size:10px;font-weight:800;color:var(--gold2);font-variant-numeric:tabular-nums}
.life-command-progress-track{grid-column:1/-1;height:5px;border-radius:99px;background:rgba(116,91,57,.10);overflow:hidden}
.life-command-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--green2),#86b596);transition:width .45s cubic-bezier(.2,.8,.2,1)}
.life-command-completed{margin-top:9px;padding-top:9px;border-top:1px dashed rgba(63,143,101,.22)}
.life-command-completed-title{font-size:9px;font-weight:750;letter-spacing:.10em;text-transform:uppercase;color:rgba(50,112,77,.72);margin-bottom:2px}
.life-command-row{transition:background .28s ease,border-color .28s ease,opacity .28s ease,transform .22s ease,box-shadow .28s ease}
.life-command-row .os-check{position:relative;transition:background .2s ease,border-color .2s ease,transform .2s cubic-bezier(.2,.9,.25,1.35),box-shadow .2s ease}
.life-command-row.is-completing{margin-left:-7px;margin-right:-7px;padding-left:7px;padding-right:7px;border-radius:10px;background:linear-gradient(145deg,rgba(63,143,101,.15),rgba(255,250,242,.78));box-shadow:0 5px 18px rgba(63,143,101,.08);transform:translateY(-1px)}
.life-command-row.is-completing .os-check,.life-command-row.is-completed .os-check{background:var(--green2)!important;border-color:var(--green2)!important;transform:scale(1.08);box-shadow:0 0 0 4px rgba(63,143,101,.10)}
.life-command-row.is-completing .os-check:after,.life-command-row.is-completed .os-check:after{content:\"\";width:10px;height:6px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg);margin-top:-2px}
.life-command-row.is-completed{opacity:.66;background:linear-gradient(145deg,rgba(63,143,101,.07),rgba(255,250,242,.35));border-radius:9px;padding-left:5px;padding-right:5px}
.life-command-row.is-completed .life-command-row-title{text-decoration:line-through;text-decoration-thickness:1px;text-decoration-color:rgba(63,86,72,.45);color:rgba(60,67,61,.70)}
.life-command-row.is-completed .life-command-row-time{color:rgba(63,112,79,.65)}
.life-command-row.is-completed .life-command-overdue{display:none}
.life-command-done-tag{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(63,143,101,.10);border:1px solid rgba(63,143,101,.18);color:rgba(42,110,70,.72);font:600 7.5px/1.15 Inter,system-ui,sans-serif;vertical-align:2px}
.life-command-sync{display:inline-block;margin-left:6px;font:600 7.5px/1.15 Inter,system-ui,sans-serif;color:rgba(42,110,70,.72);vertical-align:2px}
.life-command-row.is-sync-error{margin-left:-7px;margin-right:-7px;padding-left:7px;padding-right:7px;border-radius:10px;background:linear-gradient(145deg,rgba(182,86,77,.15),rgba(255,250,242,.76));animation:lifeSyncShake .28s ease}
.life-command-row.is-sync-error .life-command-sync{color:#a64036}
@keyframes lifeSyncShake{0%,100%{transform:translateX(0)}30%{transform:translateX(-3px)}65%{transform:translateX(3px)}}
"""
if css_old not in s:
    raise SystemExit('CSS anchor not found')
s=s.replace(css_old,css_new,1)

old=""" function row(a){var cls=a.kind==='habit'?'kind-habit':'kind-task';var overdue=a.time!=null&&a.time<nowMin()&&!a.done;var overdueTag=overdue?'<span class=\"life-command-overdue\">просрочено</span>':'';return '<div class=\"life-command-row'+(overdue?' is-overdue':'')+'\"><button class=\"os-check\" type=\"button\" onclick=\"toggleDayItem(\\''+a.kind+'\\','+a.index+');setTimeout(window.renderLifeCommandBlock,0)\" aria-label=\"Выполнено\"></button><div><div class=\"life-command-row-title\">'+esc(a.title)+'<span class=\"life-command-kind '+cls+'\">'+esc(a.type)+'</span>'+overdueTag+'</div></div><div class=\"life-command-row-time\">'+(a.time!=null?esc(fmt(a.time)):'')+'</div></div>'}
 function render(){if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}var pending=actionRows(day,false);var used={};(m.actions||[]).concat(m.carry||[]).forEach(function(a){used[a.kind+':'+a.index]=true});var future=pending.filter(function(a){return !used[a.kind+':'+a.index]});var rows=m.actions.length?m.actions.map(row).join(''):'<div class=\"life-command-empty\">В этом блоке ничего не осталось.</div>';var carry=m.carry&&m.carry.length?'<div class=\"life-command-carry\"><div class=\"life-command-carry-title\">Просрочено · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';var futureRows=future.length?'<div class=\"life-command-future\"><div class=\"life-command-future-title\">Дальше сегодня · '+future.length+'</div>'+future.map(row).join('')+'</div>':'';var nx=m.next?'<div class=\"life-command-next\">Следующий блок в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';card.innerHTML='<div class=\"life-command-head\"><div><div class=\"life-command-kicker\">'+esc(m.mode)+'</div><div class=\"life-command-time\">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class=\"life-command-title\">'+esc(m.title)+'</div>'+(m.meta?'<div class=\"life-command-meta\">'+esc(m.meta)+'</div>':'')+'</div><div class=\"life-command-clock\">'+esc(fmt(nowMin()))+'</div></div><div class=\"life-command-actions\">'+rows+carry+futureRows+'</div>'+nx}
"""

new=""" const COMPLETED_KEY='life_os_completed_today_v1';
 function localDayKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function rawActionId(a){return a&&a.item&&a.item.rawTodoistId?String(a.item.rawTodoistId):''}
 function actionArchiveKey(a){return rawActionId(a)||[a.kind,a.time==null?'':a.time,a.title].join('|')}
 function readArchive(){try{var all=JSON.parse(localStorage.getItem(COMPLETED_KEY)||'{}');return Array.isArray(all[localDayKey()])?all[localDayKey()]:[]}catch(_){return[]}}
 function archiveCompleted(a){
   try{
     var all=JSON.parse(localStorage.getItem(COMPLETED_KEY)||'{}'),day=localDayKey(),list=Array.isArray(all[day])?all[day]:[];
     var key=actionArchiveKey(a),now=new Date();
     var rec={key:key,id:rawActionId(a),kind:a.kind,title:a.title,type:a.type,time:a.time,completedAt:String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')};
     var pos=list.findIndex(function(x){return x.key===key});if(pos>=0)list[pos]=rec;else list.push(rec);
     all[day]=list;localStorage.setItem(COMPLETED_KEY,JSON.stringify(all));
   }catch(_){ }
 }
 function markLocalTodoistDone(a){
   var id=rawActionId(a);if(!id)return;
   try{var key='life_os_todoist_done_v2',saved=JSON.parse(localStorage.getItem(key)||'{}'),day=localDayKey();saved[day]=saved[day]||{task:{},habit:{}};saved[day][a.kind]=saved[day][a.kind]||{};saved[day][a.kind][id]=true;localStorage.setItem(key,JSON.stringify(saved))}catch(_){ }
 }
 function completedRows(day){
   var map={},out=[];
   actionRows(day,true).filter(function(a){return a.done}).forEach(function(a){var k=actionArchiveKey(a);if(map[k])return;map[k]=1;a.completedAt='';out.push(a)});
   readArchive().forEach(function(x){if(map[x.key])return;map[x.key]=1;out.push({kind:x.kind||'task',index:-1,item:{rawTodoistId:x.id||''},time:x.time,title:x.title,type:x.type||((x.kind==='habit')?'Привычка':'Дело'),done:true,archived:true,completedAt:x.completedAt||''})});
   return out.sort(function(a,b){return (a.time==null?99999:a.time)-(b.time==null?99999:b.time)});
 }
 window.lifeOsArchiveCompletedItem=function(kind,item){if(!item)return;archiveCompleted({kind:kind,index:-1,item:item,time:itemTime(item),title:cleanTitle(item),type:kind==='habit'?'Привычка':'Дело',done:true})};
 window.lifeOsCompleteFromCard=async function(kind,index,button){
   if(!button||button.disabled)return false;
   var day=todayDay(),list=day[kind==='habit'?'habits':'tasks']||[],item=list[index];if(!item||item.done)return false;
   var a={kind:kind,index:index,item:item,time:itemTime(item),title:cleanTitle(item),type:kind==='habit'?'Привычка':'Дело',done:false};
   var rowEl=button.closest('.life-command-row'),sync=rowEl&&rowEl.querySelector('.life-command-sync');
   button.disabled=true;if(rowEl)rowEl.classList.add('is-completing');if(sync)sync.textContent='сохраняю…';
   try{
     if(item.source==='Todoist'&&item.rawTodoistId){
       if(!window.lifeOsCompleteTodoist||!window.lifeOsHasTodoistToken||!window.lifeOsHasTodoistToken())throw new Error('Todoist недоступен');
       var ok=await window.lifeOsCompleteTodoist(String(item.rawTodoistId));if(!ok)throw new Error('Todoist не подтвердил выполнение');
     }
     archiveCompleted(a);markLocalTodoistDone(a);item.done=true;
     try{if(typeof save==='function')save()}catch(_){ }
     if(rowEl){rowEl.classList.remove('is-completing','is-overdue');rowEl.classList.add('is-completed')}
     if(sync)sync.textContent='готово';
     try{if(navigator.vibrate)navigator.vibrate(18)}catch(_){ }
     setTimeout(function(){try{if(typeof renderAll==='function')renderAll()}catch(_){ }render()},720);
   }catch(error){
     button.disabled=false;if(rowEl){rowEl.classList.remove('is-completing');rowEl.classList.add('is-sync-error')}
     if(sync)sync.textContent='не синхронизировано';
     setTimeout(function(){if(rowEl)rowEl.classList.remove('is-sync-error');if(sync)sync.textContent=''},1800);
     console.warn('Life OS completion failed',error);
   }
   return false;
 };
 function row(a){
   var cls=a.kind==='habit'?'kind-habit':'kind-task',done=!!a.done,overdue=a.time!=null&&a.time<nowMin()&&!done;
   var overdueTag=overdue?'<span class=\"life-command-overdue\">просрочено</span>':'',doneTag=done?'<span class=\"life-command-done-tag\">готово'+(a.completedAt?' · '+esc(a.completedAt):'')+'</span>':'';
   var click=done||a.index<0?'disabled data-lifeos-managed=\"1\"':'data-lifeos-managed=\"1\" onclick=\"return window.lifeOsCompleteFromCard(\\''+a.kind+'\\','+a.index+',this)\"';
   return '<div class=\"life-command-row'+(overdue?' is-overdue':'')+(done?' is-completed':'')+'\"><button class=\"os-check\" type=\"button\" '+click+' aria-label=\"'+(done?'Выполнено':'Отметить выполненным')+'\"></button><div><div class=\"life-command-row-title\">'+esc(a.title)+'<span class=\"life-command-kind '+cls+'\">'+esc(a.type)+'</span>'+overdueTag+doneTag+'<span class=\"life-command-sync\"></span></div></div><div class=\"life-command-row-time\">'+(a.time!=null?esc(fmt(a.time)):'')+'</div></div>';
 }
 function render(){
   if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;
   var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}
   var pending=actionRows(day,false),completed=completedRows(day),used={};(m.actions||[]).concat(m.carry||[]).forEach(function(a){used[a.kind+':'+a.index]=true});
   var future=pending.filter(function(a){return !used[a.kind+':'+a.index]});
   var total=pending.length+completed.length,doneCount=completed.length,pct=total?Math.round(doneCount/total*100):0;
   var progress='<div class=\"life-command-progress\"><div class=\"life-command-progress-label\">Прогресс дня</div><div class=\"life-command-progress-value\">'+doneCount+' / '+total+'</div><div class=\"life-command-progress-track\"><div class=\"life-command-progress-fill\" style=\"width:'+pct+'%\"></div></div></div>';
   var rows=m.actions.length?m.actions.map(row).join(''):'<div class=\"life-command-empty\">В этом блоке активных пунктов нет.</div>';
   var carry=m.carry&&m.carry.length?'<div class=\"life-command-carry\"><div class=\"life-command-carry-title\">Просрочено · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';
   var futureRows=future.length?'<div class=\"life-command-future\"><div class=\"life-command-future-title\">Дальше сегодня · '+future.length+'</div>'+future.map(row).join('')+'</div>':'';
   var completedHtml=completed.length?'<div class=\"life-command-completed\"><div class=\"life-command-completed-title\">Выполнено · '+completed.length+'</div>'+completed.map(row).join('')+'</div>':'';
   var nx=m.next?'<div class=\"life-command-next\">Следующий блок в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';
   card.innerHTML='<div class=\"life-command-head\"><div><div class=\"life-command-kicker\">'+esc(m.mode)+'</div><div class=\"life-command-time\">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class=\"life-command-title\">'+esc(m.title)+'</div>'+(m.meta?'<div class=\"life-command-meta\">'+esc(m.meta)+'</div>':'')+'</div><div class=\"life-command-clock\">'+esc(fmt(nowMin()))+'</div></div><div class=\"life-command-actions\">'+progress+rows+carry+futureRows+completedHtml+'</div>'+nx;
 }
"""
if old not in s:
    raise SystemExit('JS render anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
