from pathlib import Path
p=Path('index.html')
text=p.read_text(encoding='utf-8')
start='<!-- LIFE_OS_COMMAND_BLOCK_START -->'
end='<!-- LIFE_OS_COMMAND_BLOCK_END -->'
if start in text and end in text:
    a=text.index(start); b=text.index(end,a)+len(end)
    text=text[:a]+text[b:]
block='''
<!-- LIFE_OS_COMMAND_BLOCK_START -->
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
.life-command-actions{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}
.life-command-actions-title{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.life-command-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(116,91,57,.11)}
.life-command-row:last-child{border-bottom:0}.life-command-row .os-check{width:23px;height:23px}.life-command-row-title{font-size:13px;line-height:1.25;color:var(--ink)}
.life-command-row-meta{font-size:9px;color:var(--muted);margin-top:2px}.life-command-row-time{font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}
.life-command-empty{padding:10px 0 2px;color:var(--muted);font-size:12px}.life-command-next{margin-top:10px;padding:10px 11px;border:1px solid rgba(183,119,36,.18);border-radius:10px;background:rgba(255,255,255,.38);font-size:11px;color:var(--muted)}.life-command-next b{color:var(--ink)}
@media(max-width:560px){#lifeCommandCard{padding:14px 12px!important}.life-command-title{font-size:22px}.life-command-row-title{font-size:13.5px}.life-command-head{margin-bottom:12px}}
</style>
<script>
(function(){
 const CMD_ID='lifeCommandCard';
 function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
 function hm(v){var m=String(v||'').match(/(?:^|\\s)(\\d{1,2}):(\\d{2})/);return m?Number(m[1])*60+Number(m[2]):null}
 function fmt(min){if(min==null)return'';min=((min%1440)+1440)%1440;return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0')}
 function itemTime(item){return hm(item.note)||hm(item.time)||hm(item.start)||hm(item.title)}
 function cleanTitle(item){return String(item.title||'').replace(/^\\s*\\d{1,2}:\\d{2}\\s*[·•-]?\\s*/,'').trim()}
 function durationFromTitle(title){var s=String(title||'').toLowerCase(),m=s.match(/(\\d+(?:[.,]\\d+)?)\\s*(?:ч|час|часа|часов)\\b/);if(m)return Math.round(Number(m[1].replace(',','.'))*60);m=s.match(/(\\d+)\\s*(?:мин|минута|минуты|минут)\\b/);return m?Number(m[1]):null}
 function nowMin(){var d=new Date();return d.getHours()*60+d.getMinutes()}
 function actionRows(day){var rows=[];(day.tasks||[]).forEach(function(x,i){if(!x.done)rows.push({kind:'task',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Дело'})});(day.habits||[]).forEach(function(x,i){if(!x.done)rows.push({kind:'habit',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Привычка'})});return rows.sort(function(a,b){return (a.time==null?99999:a.time)-(b.time==null?99999:b.time)})}
 function eventRows(day){return (day.events||[]).map(function(e,i){return{index:i,item:e,start:hm(e.start||e.time),end:hm(e.end),title:e.title||'Событие'}}).filter(function(e){return e.start!=null}).sort(function(a,b){return a.start-b.start})}
 function model(day){var now=nowMin(),actions=actionRows(day),events=eventRows(day),activeEvent=events.find(function(e){return e.start<=now&&(e.end==null||now<e.end)});if(activeEvent){var ee=activeEvent.end==null?Math.min(1440,activeEvent.start+60):activeEvent.end;return{mode:'Сейчас',start:activeEvent.start,end:ee,title:activeEvent.title,meta:activeEvent.item.place||activeEvent.item.category||'',actions:actions.filter(function(a){return a.time!=null&&a.time>=activeEvent.start&&a.time<ee}),events:events}}
 var timed=actions.filter(function(a){return a.time!=null}),active=null;for(var i=0;i<timed.length;i++){var a=timed[i];if(a.time>now)break;var dur=durationFromTitle(a.title),next=timed[i+1]&&timed[i+1].time,ae=dur?Math.min(1440,a.time+dur):(next==null?Math.min(1440,a.time+60):next);if(now<ae)active={a:a,end:ae}}
 if(active){return{mode:'Сейчас',start:active.a.time,end:active.end,title:active.a.title,meta:active.a.type,actions:timed.filter(function(x){return x.time>=active.a.time&&x.time<active.end}),events:events}}
 var ne=events.find(function(e){return e.start>now}),na=timed.find(function(a){return a.time>now}),n=null;if(ne&&(!na||ne.start<=na.time))n={time:ne.start,title:ne.title};else if(na)n={time:na.time,title:na.title};var untimed=actions.filter(function(a){return a.time==null});if(n)return{mode:'До следующего блока',start:now,end:n.time,title:'Свободное время',meta:'Можно закрыть дела без привязки ко времени',actions:untimed,next:n};return{mode:'Сейчас',start:now,end:1440,title:'Свободное время',meta:'До конца дня',actions:untimed}}
 function render(){if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}var count=m.actions.length;var rows=count?m.actions.map(function(a){return '<div class="life-command-row"><button class="os-check" type="button" onclick="toggleDayItem(\\''+a.kind+'\\','+a.index+');setTimeout(window.renderLifeCommandBlock,0)" aria-label="Выполнено"></button><div><div class="life-command-row-title">'+esc(a.title)+'</div><div class="life-command-row-meta">'+esc(a.type)+'</div></div><div class="life-command-row-time">'+(a.time!=null?esc(fmt(a.time)):'')+'</div></div>'}).join(''):'<div class="life-command-empty">В этом блоке отдельных дел нет.</div>';var nx=m.next?'<div class="life-command-next">Дальше в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';card.innerHTML='<div class="life-command-head"><div><div class="life-command-kicker">'+esc(m.mode)+'</div><div class="life-command-time">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class="life-command-title">'+esc(m.title)+'</div>'+(m.meta?'<div class="life-command-meta">'+esc(m.meta)+'</div>':'')+'</div><div class="life-command-clock">'+esc(fmt(nowMin()))+'</div></div><div class="life-command-actions"><div class="life-command-actions-title">Выполнить в этом блоке · '+count+'</div>'+rows+'</div>'+nx}
 window.renderLifeCommandBlock=render;var old=window.refreshLifeOsToday;if(typeof old==='function')window.refreshLifeOsToday=async function(){var r=await old.apply(this,arguments);render();return r};window.addEventListener('load',function(){setTimeout(render,150);setInterval(render,60000)});document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(render,50)});setTimeout(render,50)
})();
</script>
<!-- LIFE_OS_COMMAND_BLOCK_END -->
'''
text=text.replace('</body>',block+'\n</body>',1)
p.write_text(text,encoding='utf-8')
