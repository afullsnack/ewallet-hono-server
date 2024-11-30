// TODO: Requirements
//> 1. Init logto authentication module for signup and login with password and oauth providers
//> 2. Implement SQLite DB schema's for account, user, tokens, e.t.c...
import {Hono} from "hono";
import { effectValidator } from "@hono/effect-validator";
import {Schema} from "@effect/schema";

const Body = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

const loginHandler = new Hono();
loginHandler.post("/", effectValidator("json", Body),  async (c) => {
  const reqBody = c.req.valid('json'); // NOTE: picks out only validated properties
  console.log(await c.req.json(), "body json and parse");
  if(!reqBody) throw new Error('Body not found');
  return c.json({
    token: 'tkn_loginToken',
    sub: 'sadaosbdvbasodv'
  });
});

export {loginHandler};
