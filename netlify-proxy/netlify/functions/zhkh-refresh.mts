import { isAuthorized, refreshState, publicShape } from "./lib/zhkh-core.mts";

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
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401);
  try {
    const state = await refreshState("manual");
    return json(publicShape(state));
  } catch (error: any) {
    console.error(error);
    return json({ error: String(error?.message || error) }, 502);
  }
};

export const config = {
  path: "/api/zhkh/refresh",
};
