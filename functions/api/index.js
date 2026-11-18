export async function onRequest() {
  return Response.json(
    { error: "This legacy service is unavailable while it is being secured." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
