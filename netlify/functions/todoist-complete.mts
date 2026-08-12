import type { Config } from "@netlify/functions";

const ALLOWED_PROJECTS = new Set([
  "6h9M43R7RWC7JcC5", // Привычки
  "6h9M43XMVgmVRRhm", // Дела
]);

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
}

function reply(req: Request, body: string | null, status: number) {
  return new Response(body, { status, headers: corsHeaders(req) });
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    if (!sourceAllowed(req)) return reply(req, "Forbidden", 403);
    return reply(req, null, 204);
  }
  if (req.method !== "POST") return reply(req, "Method not allowed", 405);
  if (!sourceAllowed(req)) return reply(req, "Forbidden", 403);

  const token = Netlify.env.get("TODOIST_TOKEN");
  if (!token) return reply(req, "TODOIST_TOKEN is not configured", 500);

  let taskId = "";
  try {
    const body = await req.json() as { taskId?: string };
    taskId = String(body.taskId || "").trim();
  } catch {
    return reply(req, "Bad request", 400);
  }

  if (!/^[A-Za-z0-9_-]+$/.test(taskId)) return reply(req, "Bad task id", 400);

  const headers = { Authorization: `Bearer ${token}` };
  const taskRes = await fetch(`https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}`, { headers });
  if (!taskRes.ok) return reply(req, "Task lookup failed", taskRes.status);

  const task = await taskRes.json() as { project_id?: string };
  if (!ALLOWED_PROJECTS.has(String(task.project_id || ""))) {
    return reply(req, "Task is outside Life OS projects", 403);
  }

  const closeRes = await fetch(`https://api.todoist.com/api/v1/tasks/${encodeURIComponent(taskId)}/close`, {
    method: "POST",
    headers,
  });

  if (!closeRes.ok) return reply(req, "Todoist close failed", closeRes.status);
  return reply(req, null, 204);
};

export const config: Config = {
  path: "/api/todoist-complete",
};
