// TODO: Requirements
//> 1. Init logto authentication module for signup and login with password and oauth providers
//> 2. Implement SQLite DB schema's for account, user, tokens, e.t.c...
import { Hono } from "hono";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { logger } from "../../middlewares/logger";

const loginHandler = new Hono();

const Body = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});
loginHandler.post("/", effectValidator("json", Body), async (c) => {
  const body = c.req.valid('json'); // NOTE: picks out only validated properties
  logger.info(body);
  return c.json({
    token: 'tkn_loginToken',
    sub: 'sadaosbdvbasodv',
    user: {
      email: body.email
    }
  });
});

export { loginHandler };
