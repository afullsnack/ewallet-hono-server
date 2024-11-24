import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authRoute } from './routes/auth';

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
});

app.route("/api/auth", authRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      status: "failed",
      message: "Internal server error",
      error: JSON.stringify(err, null, 4)
    },
    500
  );
  // return c.text("Error occured on the application", 500);
})

// TODO: read port from configuration with effect/docker-compose
const port = 9001
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(info.port, ":::App is running");
})

// NOTE: implement graceful shutdown on process kill signal
// process.on('SIGINT', async () => {
//   console.log("Graceful shutdown and cleanup");
//   serverType.close((err) => console.log(`Error trying to close connection ${err}`));
// });
