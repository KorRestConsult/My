from pathlib import Path
import re

p=Path('index.html')
text=p.read_text(encoding='utf-8')
start='<!-- LIFE_OS_COMMAND_BLOCK_START -->'
end='<!-- LIFE_OS_COMMAND_BLOCK_END -->'
if start not in text or end not in text:
    raise SystemExit('command markers not found')

block=r'''<!-- LIFE_OS_COMMAND_BLOCK_START -->
<style>
#home .life-primary-tasks{display:none!important}
#home .life-panel-blocks>.section-card:has(#homeCalendar){display:none!important}
#lifeCommandCard{padding:16px!important;border-radius:14px!important;background:linear-gradient(155deg,#fffdf8,#f5ecdd)!important;border:1px solid var(--line)!important;box-shadow:0 12px 32px rgba(62,43,22,.06);margin-bottom:14px}
.life-command-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.life-command-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--gold2);margin-bottom:6px}
.life-command-time{font-size:13px;font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}
.life-command-title{font:700 24px/1.08 Georgia,"Times New Roman",serif;color:var(--ink);margin-top:4px;max-width:620px}
.life-command-meta{font-size:11px;color:var(--muted);margin-top:6px}
.life-command-clock{min-width:52px;text-align:right;font-size:11px;font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}
.life-command-actions{border-top:1px solid var(--line);padding-top:8px;margin-top:12px}
.life-command-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(116,91,57,.11)}
.life-command-row:last-child{border-bottom:0}.life-command-row .os-check{width:23px;height:23px}.life-command-row-title{font-size:13px;line-height:1.25;color:var(--ink)}
.life-command-kind{display:inline-block;margin-left:7px;padding:2px 6px;border-radius:999px;font:500 8.5px/1.15 Inter,system-ui,sans-serif;letter-spacing:.01em;vertical-align:2px;border:1px solid transparent}
.life-command-kind.kind-habit{background:rgba(188,143,78,.10);border-color:rgba(188,143,78,.16);color:rgba(126,91,43,.72)}
.life-command-kind.kind-task{background:rgba(92,126,151,.09);border-color:rgba(92,126,151,.15);color:rgba(68,96,116,.72)}
.life-command-row-time{font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}
.life-command-empty{padding:9px 0 2px;color:var(--muted);font-size:12px}
.life-command-next{margin-top:10px;padding:10px 11px;border:1px solid rgba(183,119,36,.18);border-radius:10px;background:rgba(255,255,255,.38);font-size:11px;color:var(--muted)}.life-command-next b{color:var(--ink)}
.life-command-carry{margin-top:9px;padding-top:8px;border-top:1px dashed rgba(116,91,57,.18)}
.life-command-carry-title{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(112,96,78,.62);margin-bottom:1px}
.life-command-carry .life-command-row{opacity:.82}
@media(max-width:560px){#lifeCommandCard{padding:14px 12px!important}.life-command-title{font-size:22px}.life-command-row-title{font-size:13.5px}.life-command-head{margin-bottom:12px}.life-command-kind{font-size:8px;padding:2px 5px}}
</style>
<script>
(function(){
 const CMD_ID='lifeCommandCard';
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
 function hm(v){var m=String(v||'').match(/(?:^|\s)(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null}
 function fmt(min){if(min==null)return'';min=((min%1440)+1440)%1440;return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0')}
 function itemTime(item){return hm(item.note)||hm(item.time)||hm(item.start)||hm(item.title)}
 function cleanTitle(item){return String(item.title||'').replace(/^\s*\d{1,2}:\d{2}\s*[·•-]?\s*/,'').trim()}
 function durationFromTitle(title){var s=String(title||'').toLowerCase(),m=s.match(/(\d+(?:[.,]\d+)?)\s*(?:ч|час|часа|часов)\b/);if(m)return Math.round(Number(m[1].replace(',','.'))*60);m=s.match(/(\d+)\s*(?:мин|минута|минуты|минут)\b/);return m?Number(m[1]):null}
 function nowMin(){var d=new Date();return d.getHours()*60+d.getMinutes()}
 function actionRows(day,includeDone){var rows=[];(day.tasks||[]).forEach(function(x,i){if(includeDone||!x.done)rows.push({kind:'task',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Дело',done:!!x.done})});(day.habits||[]).forEach(function(x,i){if(includeDone||!x.done)rows.push({kind:'habit',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Привычка',done:!!x.done})});return rows.sort(function(a,b){return (a.time==null?99999:a.time)-(b.time==null?99999:b.time)})}
 function eventRows(day){return (day.events||[]).map(function(e,i){return{index:i,item:e,start:hm(e.start||e.time),end:hm(e.end),title:e.title||'Событие'}}).filter(function(e){return e.start!=null}).sort(function(a,b){return a.start-b.start})}
 function inferredBlock(schedule,now){var timed=schedule.filter(function(a){return a.time!=null}),active=null;for(var i=0;i<timed.length;i++){var a=timed[i];if(a.time>now)break;var dur=durationFromTitle(a.title),next=timed[i+1]&&timed[i+1].time,end=dur?Math.min(1440,a.time+dur):(next==null?Math.min(1440,a.time+60):next);if(now<end)active={start:a.time,end:end,title:a.title,source:a}}return active}
 function splitActions(pending,start,end){var current=pending.filter(function(a){return a.time!=null&&a.time>=start&&a.time<end}),carry=pending.filter(function(a){return a.time!=null&&a.time<start}),untimed=pending.filter(function(a){return a.time==null});return{current:current,carry:carry.concat(untimed)}}
 function model(day){
  var now=nowMin(),schedule=actionRows(day,true),pending=actionRows(day,false),events=eventRows(day);
  var activeEvent=events.find(function(e){return e.start<=now&&(e.end==null||now<e.end)});
  if(activeEvent){var ee=activeEvent.end==null?Math.min(1440,activeEvent.start+60):activeEvent.end,parts=splitActions(pending,activeEvent.start,ee),following=events.find(function(e){return e.start>=ee});return{mode:'Сейчас',start:activeEvent.start,end:ee,title:activeEvent.title,meta:activeEvent.item.place||activeEvent.item.category||'',actions:parts.current,carry:parts.carry,next:following?{time:following.start,title:following.title}:null}}
  var inferred=inferredBlock(schedule,now);
  if(inferred){var p=splitActions(pending,inferred.start,inferred.end),ne=events.find(function(e){return e.start>now}),ns=schedule.find(function(a){return a.time!=null&&a.time>=inferred.end}),next=null;if(ne&&(!ns||ne.start<=ns.time))next={time:ne.start,title:ne.title};else if(ns)next={time:ns.time,title:ns.title};return{mode:'Сейчас',start:inferred.start,end:inferred.end,title:inferred.title,meta:'',actions:p.current,carry:p.carry,next:next}}
  var nextEvent=events.find(function(e){return e.start>now}),nextAction=schedule.find(function(a){return a.time!=null&&a.time>now}),next=null;if(nextEvent&&(!nextAction||nextEvent.start<=nextAction.time))next={time:nextEvent.start,title:nextEvent.title};else if(nextAction)next={time:nextAction.time,title:nextAction.title};var end=next?next.time:1440,carry=pending.filter(function(a){return a.time==null||a.time<now});return{mode:'Сейчас',start:now,end:end,title:'Свободное время',meta:'',actions:[],carry:carry,next:next}
 }
 function row(a){var cls=a.kind==='habit'?'kind-habit':'kind-task';return '<div class="life-command-row"><button class="os-check" type="button" onclick="toggleDayItem(\''+a.kind+'\','+a.index+');setTimeout(window.renderLifeCommandBlock,0)" aria-label="Выполнено"></button><div><div class="life-command-row-title">'+esc(a.title)+'<span class="life-command-kind '+cls+'">'+esc(a.type)+'</span></div></div><div class="life-command-row-time">'+(a.time!=null?esc(fmt(a.time)):'')+'</div></div>'}
 function render(){if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}var rows=m.actions.length?m.actions.map(row).join(''):'<div class="life-command-empty">В этом блоке ничего не осталось.</div>';var carry=m.carry&&m.carry.length?'<div class="life-command-carry"><div class="life-command-carry-title">Осталось · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';var nx=m.next?'<div class="life-command-next">Дальше в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';card.innerHTML='<div class="life-command-head"><div><div class="life-command-kicker">'+esc(m.mode)+'</div><div class="life-command-time">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class="life-command-title">'+esc(m.title)+'</div>'+(m.meta?'<div class="life-command-meta">'+esc(m.meta)+'</div>':'')+'</div><div class="life-command-clock">'+esc(fmt(nowMin()))+'</div></div><div class="life-command-actions">'+rows+carry+'</div>'+nx}
 window.renderLifeCommandBlock=render;var old=window.refreshLifeOsToday;if(typeof old==='function')window.refreshLifeOsToday=async function(){var r=await old.apply(this,arguments);render();return r};window.addEventListener('load',function(){setTimeout(render,150);setInterval(render,60000)});document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(render,50)});setTimeout(render,50)
})();
</script>
<!-- LIFE_OS_COMMAND_BLOCK_END -->'''

pattern=re.escape(start)+r'.*?'+re.escape(end)
text2=re.sub(pattern,block,text,count=1,flags=re.S)
if text2==text:
    raise SystemExit('replacement failed')
p.write_text(text2,encoding='utf-8')
