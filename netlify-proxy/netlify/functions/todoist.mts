const ALLOWED_ORIGIN = "https://korrestconsult.github.io";
const API = "https://api.todoist.com/api/v1";
const ALLOWED_PROJECTS = new Set(["6h9M43R7RWC7JcC5", "6h9M43XMVgmVRRhm"]);

function cors(origin: string | null) {
  const headers: Record<string,string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
  if (origin === ALLOWED_ORIGIN) headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
  return headers;
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: cors(origin) });
}

function token() {
  return Netlify.env.get("TODOIST_TOKEN") || "";
}

async function todoist(path: string, init: RequestInit = {}) {
  const t = token();
  if (!t) throw new Error("TODOIST_TOKEN_MISSING");
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${t}`);
  headers.set("Accept", "application/json");
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TODOIST_${res.status}${detail ? `_${detail.slice(0,160)}` : ""}`);
  }
  return res;
}

async function getTask(taskId: string) {
  const res = await todoist(`/tasks/${encodeURIComponent(taskId)}`);
  return await res.json();
}

async function complete(taskId: string) {
  const task = await getTask(taskId);
  const projectId = String(task?.project_id || "");
  if (!ALLOWED_PROJECTS.has(projectId)) throw new Error("TASK_PROJECT_NOT_ALLOWED");
  await todoist(`/tasks/${encodeURIComponent(taskId)}/close`, { method: "POST" });
  return true;
}

async function todayRows() {
  const q = encodeURIComponent("today | overdue");
  const res = await todoist(`/tasks/filter?query=${q}&limit=200`);
  const data = await res.json();
  const rows = Array.isArray(data?.results) ? data.results : [];
  return rows.filter((x: any) => ALLOWED_PROJECTS.has(String(x?.project_id || "")));
}

export default async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

  try {
    const url = new URL(req.url);
    if (req.method === "GET") {
      const action = url.searchParams.get("action") || "health";
      if (action === "health") {
        await todoist("/tasks?limit=1");
        return json({ ok: true }, 200, origin);
      }
      if (action === "today") {
        const rows = await todayRows();
        return json({ ok: true, results: rows }, 200, origin);
      }
      if (action === "test-close") {
        const testKey = url.searchParams.get("key") || "";
        if (!testKey || testKey !== (Netlify.env.get("LIFEOS_TEST_KEY") || "")) return json({ ok: false, error: "FORBIDDEN" }, 403, origin);
        const taskId = url.searchParams.get("taskId") || "";
        if (!taskId) return json({ ok: false, error: "TASK_ID_REQUIRED" }, 400, origin);
        await complete(taskId);
        return json({ ok: true, taskId }, 200, origin);
      }
      return json({ ok: false, error: "UNKNOWN_ACTION" }, 400, origin);
    }

    if (req.method === "POST") {
      if (origin !== ALLOWED_ORIGIN) return json({ ok: false, error: "ORIGIN_NOT_ALLOWED" }, 403, origin);
      const body = await req.json().catch(() => ({} as any));
      const action = String((body as any)?.action || "");
      if (action !== "complete") return json({ ok: false, error: "UNKNOWN_ACTION" }, 400, origin);
      const taskId = String((body as any)?.taskId || "");
      if (!taskId) return json({ ok: false, error: "TASK_ID_REQUIRED" }, 400, origin);
      await complete(taskId);
      return json({ ok: true, taskId }, 200, origin);
    }

    return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405, origin);
  } catch (error) {
    const message = String((error as any)?.message || error);
    console.error("Life OS Todoist proxy", message);
    return json({ ok: false, error: message }, 502, origin);
  }
};

export const config = { path: "/todoist" };
