from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('data/todoist-writeback.js?v=20260812-0956','data/todoist-writeback.js?v=20260812-1004-direct')
p.write_text(s,encoding='utf-8')
