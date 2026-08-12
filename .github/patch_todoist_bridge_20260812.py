from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""      day.events=live.events;
      day.habits=live.habits;
      day.tasks=live.tasks;"""
new="""      day.events=live.events;
      if(!window.LIFE_OS_TODOIST_BRIDGE_ACTIVE){
        day.habits=live.habits;
        day.tasks=live.tasks;
      }"""
if old not in s:
    raise SystemExit('live assignment block not found')
s=s.replace(old,new,1)
s=s.replace('data/todoist-writeback.js?v=20260811-2300','data/todoist-writeback.js?v=20260812-0950')
p.write_text(s,encoding='utf-8')
