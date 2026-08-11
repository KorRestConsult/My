from pathlib import Path

p=Path('index.html')
s=p.read_text()

old="""   var nextAction=pending.find(function(a){return a.time!=null&&a.time>=end});
   var next=null;
   if(nextEvent)next={time:nextEvent.start,title:nextEvent.title};
   else if(nextAction)next={time:nextAction.time,title:nextAction.title};
   return{mode:'Сейчас',start:start,end:end,title:title,meta:meta,actions:current,carry:carry,next:next};
"""
new="""   var next=null;
   if(nextEvent)next={time:nextEvent.start,title:nextEvent.title};
   return{mode:'Сейчас',start:start,end:end,title:title,meta:meta,actions:current,carry:carry,next:next};
"""
if old not in s:
    raise SystemExit('model snippet not found')
s=s.replace(old,new,1)

old_render=""" function render(){if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}var rows=m.actions.length?m.actions.map(row).join(''):'<div class=\"life-command-empty\">В этом блоке ничего не осталось.</div>';var carry=m.carry&&m.carry.length?'<div class=\"life-command-carry\"><div class=\"life-command-carry-title\">Осталось · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';var nx=m.next?'<div class=\"life-command-next\">Дальше в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';card.innerHTML='<div class=\"life-command-head\"><div><div class=\"life-command-kicker\">'+esc(m.mode)+'</div><div class=\"life-command-time\">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class=\"life-command-title\">'+esc(m.title)+'</div>'+(m.meta?'<div class=\"life-command-meta\">'+esc(m.meta)+'</div>':'')+'</div><div class=\"life-command-clock\">'+esc(fmt(nowMin()))+'</div></div><div class=\"life-command-actions\">'+rows+carry+'</div>'+nx}
"""
new_render=""" function render(){if(typeof todayDay!=='function')return;var hq=document.querySelector('#home .hq');if(!hq)return;var day=todayDay(),m=model(day),card=document.getElementById(CMD_ID);if(!card){card=document.createElement('section');card.id=CMD_ID;card.className='section-card';hq.insertBefore(card,hq.firstElementChild)}var pending=actionRows(day,false);var used={};(m.actions||[]).concat(m.carry||[]).forEach(function(a){used[a.kind+':'+a.index]=true});var future=pending.filter(function(a){return !used[a.kind+':'+a.index]});var rows=m.actions.length?m.actions.map(row).join(''):'<div class=\"life-command-empty\">В этом блоке ничего не осталось.</div>';var carry=m.carry&&m.carry.length?'<div class=\"life-command-carry\"><div class=\"life-command-carry-title\">Просрочено · '+m.carry.length+'</div>'+m.carry.map(row).join('')+'</div>':'';var futureRows=future.length?'<div class=\"life-command-future\"><div class=\"life-command-future-title\">Дальше сегодня · '+future.length+'</div>'+future.map(row).join('')+'</div>':'';var nx=m.next?'<div class=\"life-command-next\">Следующий блок в <b>'+esc(fmt(m.next.time))+'</b> — '+esc(m.next.title)+'</div>':'';card.innerHTML='<div class=\"life-command-head\"><div><div class=\"life-command-kicker\">'+esc(m.mode)+'</div><div class=\"life-command-time\">'+esc(fmt(m.start))+(m.end<1440?'–'+esc(fmt(m.end)):'')+'</div><div class=\"life-command-title\">'+esc(m.title)+'</div>'+(m.meta?'<div class=\"life-command-meta\">'+esc(m.meta)+'</div>':'')+'</div><div class=\"life-command-clock\">'+esc(fmt(nowMin()))+'</div></div><div class=\"life-command-actions\">'+rows+carry+futureRows+'</div>'+nx}
"""
if old_render not in s:
    raise SystemExit('render snippet not found')
s=s.replace(old_render,new_render,1)

css_anchor=".life-command-carry .life-command-row{opacity:.82}\n"
css_add=".life-command-carry .life-command-row{opacity:.82}\n.life-command-future{margin-top:7px;padding-top:8px;border-top:1px dashed rgba(116,91,57,.18)}\n.life-command-future-title{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(112,96,78,.62);margin-bottom:1px}\n"
if css_anchor not in s:
    raise SystemExit('css anchor not found')
s=s.replace(css_anchor,css_add,1)

p.write_text(s)
