export default async () => new Response(JSON.stringify({
  ok: true,
  service: "ilya-zhkh",
  now: new Date().toISOString(),
}), {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
  },
});

export const config = {
  path: "/api/zhkh/health",
};
