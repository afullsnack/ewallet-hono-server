import { HealthResp } from "../models/health";
import { Context } from "hono";

export async function health_check(c: Context) {
  const resp: HealthResp = {
    ok: true,
  };
  return c.json(resp);
}
