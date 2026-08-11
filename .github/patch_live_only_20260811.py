from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="function actionRows(day,includeDone){var rows=[];(day.tasks||[]).forEach(function(x,i){if(includeDone||!x.done)rows.push({kind:'task',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Дело',done:!!x.done})});(day.habits||[]).forEach(function(x,i){if(includeDone||!x.done)rows.push({kind:'habit',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Привычка',done:!!x.done})});return rows.sort(function(a,b){return (a.time==null?99999:a.time)-(b.time==null?99999:b.time)})}"
new="function actionRows(day,includeDone){var rows=[];(day.tasks||[]).forEach(function(x,i){if(x&&x.source==='Todoist'&&x.rawTodoistId&&(includeDone||!x.done))rows.push({kind:'task',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Дело',done:!!x.done})});(day.habits||[]).forEach(function(x,i){if(x&&x.source==='Todoist'&&x.rawTodoistId&&(includeDone||!x.done))rows.push({kind:'habit',index:i,item:x,time:itemTime(x),title:cleanTitle(x),type:'Привычка',done:!!x.done})});return rows.sort(function(a,b){return (a.time==null?99999:a.time)-(b.time==null?99999:b.time)})}"
if old not in s:
    raise SystemExit('actionRows target not found')
s=s.replace(old,new,1)
old2="readArchive().forEach(function(x){if(map[x.key])return;map[x.key]=1;out.push({kind:x.kind||'task',index:-1,item:{rawTodoistId:x.id||''},time:x.time,title:x.title,type:x.type||((x.kind==='habit')?'Привычка':'Дело'),done:true,archived:true,completedAt:x.completedAt||''})});"
new2="readArchive().forEach(function(x){if(!x||!x.id||map[x.key])return;map[x.key]=1;out.push({kind:x.kind||'task',index:-1,item:{rawTodoistId:x.id||''},time:x.time,title:x.title,type:x.type||((x.kind==='habit')?'Привычка':'Дело'),done:true,archived:true,completedAt:x.completedAt||''})});"
if old2 not in s:
    raise SystemExit('archive target not found')
s=s.replace(old2,new2,1)
s=re.sub(r'<script src="data/todoist-writeback\.js(?:\?v=[^"]*)?"></script>', '<script src="data/todoist-writeback.js?v=20260811-2300"></script>', s, count=1)
p.write_text(s,encoding='utf-8')
