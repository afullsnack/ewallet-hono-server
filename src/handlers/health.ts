import { HealthResp } from "../models/health";
import { Context } from "hono";

export async function healthCheck(c: Context) {
  const resp: HealthResp = {
    ok: true,
  };
  return c.json(resp);
}
