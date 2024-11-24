// TODO: Requirements
//> 1. Init logto authentication module for signup and login with password and oauth providers
//> 2. Implement SQLite DB schema's for account, user, tokens, e.t.c...
import { Hono } from "hono";
import { effectValidator } from "@hono/effect-validator";
import {Schema} from "@effect/schema";

export const authRoute = new Hono();


const Body = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

authRoute.post("/login", effectValidator("json", Body),  async (c) => {
  const reqBody = c.req.valid('json');
  console.log(reqBody, ":::req body");
  if(!reqBody) throw new Error('Body not found');
  return c.json({
    body: "sample-body",
    route: "/login"
  });
});
