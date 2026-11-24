import { NextRequest } from "next/server";

export function createJsonRequest(url: string, body?: unknown, method: string = "POST"): NextRequest {
  const req = new Request(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return req as unknown as NextRequest;
}
