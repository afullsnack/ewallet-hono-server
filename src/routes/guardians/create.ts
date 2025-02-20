import appFactory from "../../app";
import { effectValidator } from "@hono/effect-validator"; 
import {Schema} from "@effect/schema";

const Body = Schema.Struct({
  guardian: Schema.String
});
const guardian = appFactory.createHandlers(effectValidator('json', Body), async (c) => {
  const body = c.req.valid('json');
});


export { guardian };
export type ICreateGuardian = typeof Body.Type;
