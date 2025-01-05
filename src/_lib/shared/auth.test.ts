import {test, describe, expect, assert, vi} from "vitest";
import { LogtoAuthAdapter } from "./auth";
import { Context } from "hono";

const context = {} as Context ;
test('it should initialise LogtoServiceAdapter', async () => {
  const adapter = new LogtoAuthAdapter(context);
  const result = await adapter.login({email: '', password: ''});
  expect(result);
});
