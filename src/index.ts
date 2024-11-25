import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authRoute } from './routes/auth';
import { setupRouter } from './router';

const app = new Hono()

setupRouter(app);
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
