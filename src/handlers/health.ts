import { HealthResp } from "../models/health";
import { Context } from "hono";

export async function healthCheck(c: Context) {
  const resp: HealthResp = {
    ok: true,
    message: 'Routes operational, /api/v1'
  };
  return c.json(resp);
}
