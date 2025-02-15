import {test, describe, expect, assert, vi} from "vitest";
import { LogtoAuthAdapter } from "../auth";
import { Context } from "hono";

const context = {} as Context ;
test('it should initialise LogtoServiceAdapter and get config', () => {
  const adapter = new LogtoAuthAdapter(context);
  const result = adapter.getConfig;

  console.log(result, 'logto-config');
  expect(result).toBeTypeOf("object");
});
