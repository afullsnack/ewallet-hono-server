import { logger } from "../../middlewares/logger";
import { Env } from "../../app";
import { pipe, Effect } from "effect";
import { Schema } from "@effect/schema";
import { HttpClient, HttpClientResponse, HttpClientRequest } from "@effect/platform"
import { Context } from "hono";
import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {db} from "../../db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' })
});
