import appFactory from "../../app";
import {effectValidator} from "@hono/effect-validator";
import {Schema} from "@effect/schema";

const Body = Schema.Struct({
  
});
const guardianRecovery = appFactory.createHandlers(effectValidator('json', Body), async (c) => {
  
});


export {guardianRecovery};
