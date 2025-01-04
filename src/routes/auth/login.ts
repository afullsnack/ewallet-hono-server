// TODO: Requirements
//> 1. Init logto authentication module for signup and login with password and oauth providers
//> 2. Implement SQLite DB schema's for account, user, tokens, e.t.c...
import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator";
import { Schema } from "@effect/schema";
import { logger } from "../../middlewares/logger";

const Body = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});
const loginHandler = appFactory.createHandlers(effectValidator("json", Body), async (c) => {
  const body = c.req.valid('json'); // NOTE: picks out only validated properties
  logger.info(body, 'login-input');
  return c.json({
    token: 'tkn_loginToken',
    sub: 'sadaosbdvbasodv',
    user: {
      email: body.email
    }
  });
});

export { loginHandler };
export type IBody = typeof Body.Type;
