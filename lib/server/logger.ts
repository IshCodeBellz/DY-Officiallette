import { randomUUID } from "crypto";

// Simple in-memory latency buckets (best effort; resets on deploy)
const latencyBuckets = [50, 100, 250, 500, 1000, 2000, 5000];
const latencyCounts: Record<string, number> = {};
function recordLatency(ms: number) {
  const bucket = latencyBuckets.find((b) => ms <= b) || ">5000";
  const key = typeof bucket === "number" ? `le_${bucket}` : bucket;
  latencyCounts[key] = (latencyCounts[key] || 0) + 1;
}
export function getLatencySnapshot() {
  return { ...latencyCounts };
}

export interface LogFields {
  [k: string]: any;
}

function base(fields: LogFields) {
  return JSON.stringify({ ts: new Date().toISOString(), ...fields });
}

export function log(msg: string, fields: LogFields = {}) {
  console.log(base({ level: "info", msg, ...fields }));
}
export function warn(msg: string, fields: LogFields = {}) {
  console.warn(base({ level: "warn", msg, ...fields }));
}
export function error(msg: string, fields: LogFields = {}) {
  console.error(base({ level: "error", msg, ...fields }));
}

export function withRequest<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  // Wrap a Next.js route handler to add a request id & latency logging
  return async function wrapped(this: any, ...args: any[]) {
    const start = Date.now();
    const req = args[0];
    const rid = req?.headers?.get?.("x-request-id") || randomUUID();
    try {
      const res = await handler.apply(this, args);
      const dur = Date.now() - start;
      const method = req?.method;
      const userId = (req as any)?.headers?.get?.("x-demo-user") || undefined;
      recordLatency(dur);
      log("req_complete", {
        path: req?.nextUrl?.pathname,
        query: req?.nextUrl?.search || undefined,
        method,
        rid,
        ms: dur,
        latencyBucket: latencyBuckets.find((b) => dur <= b) || ">5000",
        status: res?.status,
        userId,
      });
      return res;
    } catch (e: any) {
      const dur = Date.now() - start;
      const method = req?.method;
      const userId = (req as any)?.headers?.get?.("x-demo-user") || undefined;
      recordLatency(dur);
      error("req_error", {
        path: req?.nextUrl?.pathname,
        query: req?.nextUrl?.search || undefined,
        method,
        rid,
        ms: dur,
        latencyBucket: latencyBuckets.find((b) => dur <= b) || ">5000",
        err: e?.message,
        userId,
      });
      throw e;
    }
  } as any;
}
