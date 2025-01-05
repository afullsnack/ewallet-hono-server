import {testClient} from "hono/testing";

export function makeTestClient(app: any) {
  return testClient(app);
}
