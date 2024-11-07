import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

const app = new Hono()

// TODO: init app with prelim configs
app.use("*", cors())
app.use("*", logger())
app.use("*", prettyJSON())

app.use("*", async (_, next) => {
  // TODO: implement rate limiting/indempotency
  await next()
});

app.use("*", async (_, next) => {
  // TODO: implement basic security check, custom/business checks
  await next()
})

// TODO: read port from configuration with effect/docker-compose
const port = 8081
console.log(`Server is running on port ${port}`)
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(info, ":::info listener");
})

// NOTE: implement graceful shutdown on process kill signal
// process.on('SIGINT', async () => {
//   console.log("Graceful shutdown and cleanup");
//   serverType.close((err) => console.log(`Error trying to close connection ${err}`));
// });
