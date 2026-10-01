import { isAuthorized, loadState, publicShape } from "./lib/zhkh-core.mts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export default async (req: Request) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);
  const state = await loadState();
  return json(publicShape(state));
};

export const config = {
  path: "/api/zhkh/status",
};
