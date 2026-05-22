/**
 * SSE ping handler to keep FE-BE connection warm.
 * Sends ping every 5 seconds and closes after 2 minutes.
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @returns {void}
 */
export function pingConnectionMiddleware(_req, res) {
  const startedAt = Date.now();
  const intervalMs = 5000;
  const maxOpenMs = 120000;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendPing = () => {
    const elapsedMs = Date.now() - startedAt;
    res.write(`event: ping\ndata: ${JSON.stringify({ ok: true, elapsedMs, timestamp: new Date(startedAt + elapsedMs).toISOString() })}\n\n`);
  };

  sendPing();
  const ticker = setInterval(sendPing, intervalMs);
  const closer = setTimeout(() => {
    clearInterval(ticker);
    res.write("event: close\ndata: connection-window-complete\n\n");
    res.end();
  }, maxOpenMs);

  res.on("close", () => {
    clearInterval(ticker);
    clearTimeout(closer);
  });
}
