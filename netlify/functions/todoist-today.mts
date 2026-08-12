import type { Config } from "@netlify/functions";

const PROJECTS = [
  { id: "6h9M43R7RWC7JcC5", name: "Привычки", type: "habit" },
  { id: "6h9M43XMVgmVRRhm", name: "Дела", type: "task" },
] as const;

const ALLOWED_ORIGINS = new Set([
  "https://korrestconsult.github.io",
  "https://ilya-life-os.netlify.app",
]);

function requestOrigin(req: Request) {
  return req.headers.get("origin") || "";
}

function sourceAllowed(req: Request) {
  const origin = requestOrigin(req);
  const referer = req.headers.get("referer") || "";
  if (origin) return ALLOWED_ORIGINS.has(origin);
  return [...ALLOWED_ORIGINS].some((base) => referer.startsWith(base + "/"));
}

function corsHeaders(req: Request) {
  const origin = requestOrigin(req);
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function reply(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(req) });
}

function dateOf(task: any) {
  const raw = task?.due?.date || task?.due_date || task?.due?.datetime || task?.due_datetime || "";
  return String(raw).slice(0, 10);
}

function timeOf(task: any) {
  const raw = task?.due?.datetime || task?.due_datetime || "";
  if (raw) {
    const d = new Date(String(raw));
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    }
  }
  const text = String(task?.due?.string || task?.due_string || "");
  const m = text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

async function loadProject(token: string, projectId: string) {
  const all: any[] = [];
  let cursor = "";
  do {
    const url = new URL("https://api.todoist.com/api/v1/tasks");
    url.searchParams.set("project_id", projectId);
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Todoist tasks failed: ${res.status}`);
    const data = await res.json() as any;
    const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    all.push(...rows);
    cursor = Array.isArray(data) ? "" : String(data?.next_cursor || "");
  } while (cursor);
  return all;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    if (!sourceAllowed(req)) return reply(req, { error: "Forbidden" }, 403);
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "GET") return reply(req, { error: "Method not allowed" }, 405);
  if (!sourceAllowed(req)) return reply(req, { error: "Forbidden" }, 403);

  const token = Netlify.env.get("TODOIST_TOKEN");
  if (!token) return reply(req, { error: "TODOIST_TOKEN is not configured" }, 500);

  const url = new URL(req.url);
  const date = String(url.searchParams.get("date") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply(req, { error: "Bad date" }, 400);

  try {
    const grouped = await Promise.all(PROJECTS.map(async (project) => ({
      project,
      tasks: await loadProject(token, project.id),
    })));

    const tasks = grouped.flatMap(({ project, tasks }) => tasks
      .filter((task) => dateOf(task) === date)
      .map((task) => ({
        id: String(task.id || ""),
        title: String(task.content || "").trim(),
        time: timeOf(task),
        project: project.name,
        projectId: project.id,
        sectionId: String(task.section_id || ""),
        labels: Array.isArray(task.labels) ? task.labels : [],
        type: project.type,
        done: false,
      })))
      .filter((task) => task.id && task.title)
      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

    return reply(req, { date, updatedAt: new Date().toISOString(), tasks });
  } catch (error) {
    console.error(error);
    return reply(req, { error: "Todoist live fetch failed" }, 502);
  }
};

export const config: Config = {
  path: "/api/todoist-today",
};
