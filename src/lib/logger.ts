/**
 * Structured JSON logger for server-side route handlers and cron routes.
 * Writes a single-line JSON object to stdout (via console.error so Vercel
 * captures it in the error log stream).
 *
 * Optional Sentry HTTP API forwarding when SENTRY_DSN is set.
 */

type LogContext = Record<string, unknown>;

function emit(level: "error", message: string, ctx?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(ctx ?? {}),
  };
  // console.error writes to stderr; Vercel ingests both stdout and stderr.
  console.error(JSON.stringify(entry));

  const dsn = process.env.SENTRY_DSN;
  if (dsn && level === "error") {
    // Fire-and-forget: do not await so the response is never blocked.
    void sendToSentry(dsn, message, ctx).catch(() => {
      /* swallow — logging must never throw */
    });
  }
}

async function sendToSentry(dsn: string, message: string, ctx?: LogContext) {
  // Parse DSN: https://<key>@<host>/<project-id>
  const url = new URL(dsn);
  const projectId = url.pathname.replace("/", "");
  const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/`;
  const publicKey = url.username;

  await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": [
        "Sentry sentry_version=7",
        `sentry_key=${publicKey}`,
        "sentry_client=albert-nelly/1.0",
      ].join(", "),
    },
    body: JSON.stringify({
      message,
      level: "error",
      timestamp: new Date().toISOString(),
      extra: ctx,
    }),
  });
}

export const logger = {
  error: (message: string, ctx?: LogContext) => emit("error", message, ctx),
};
