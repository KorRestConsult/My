import type { Config } from "@netlify/functions";

const ALLOWED_PROJECTS = new Set([
  "6h9M43R7RWC7JcC5", // Привычки
  "6h9M43XMVgmVRRhm", // Дела
]);

const ALLOWED_ORIGINS = new Set([
  "https://korrestconsult.github.io",
  "https://ilya-life-os.netlify.app",
]);

function sourceAllowed(req: Request) {
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  if (origin) return ALLOWED_ORIGINS.has(origin);
  return [...ALLOWED_ORIGINS].some((base) => referer.startsWith(base + "/"));
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!sourceAllowed(req)) return new Response("Forbidden", { status: 403 });

  const token = Netlify.env.get("TODOIST_TOKEN");
  if (!token) return new Response("TODOIST_TOKEN is not configured", { status: 500 });

  let taskId = "";
  try {
    const raw = await req.text();
    const body = JSON.parse(raw || "{}");
    taskId = String(body.taskId || "").trim();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!/^[A-Za-z0-9_-]+$/.test(taskId)) return new Response("Bad task id", { status: 400 });

  const headers = { Authorization: `Bearer ${token}` };
  const taskRes = await fetch(`https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}`, { headers });
  if (!taskRes.ok) return new Response("Task lookup failed", { status: taskRes.status });

  const task = await taskRes.json() as { project_id?: string };
  if (!ALLOWED_PROJECTS.has(String(task.project_id || ""))) {
    return new Response("Task is outside Life OS projects", { status: 403 });
  }

  const closeRes = await fetch(`https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}/close`, {
    method: "POST",
    headers,
  });

  if (!closeRes.ok) return new Response("Todoist close failed", { status: closeRes.status });
  return new Response(null, { status: 204 });
};

export const config: Config = {
  path: "/api/todoist-complete",
};
