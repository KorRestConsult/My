from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='data/todoist-writeback.js?v=20260812-0950'
new='data/todoist-writeback.js?v=20260812-0956'
if old not in s:
    raise SystemExit('todoist script version not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
