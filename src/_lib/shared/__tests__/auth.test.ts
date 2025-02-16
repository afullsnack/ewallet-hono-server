import {test, describe, expect, assert, vi} from "vitest";
import { LogtoAuthAdapter } from "../auth";

test('it should initialise LogtoServiceAdapter and generateAccessToken', async () => {
  const adapter = new LogtoAuthAdapter();
  await adapter.generateAccessToken();

  expect(adapter.auth).toBeTypeOf("object");
  expect(adapter.auth).toHaveProperty('token');
});
