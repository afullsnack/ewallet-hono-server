import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

app.get('/hello/:name', (c) => {
  const params = c.req.param
  c.status(404);
  return c.json({ params });
});

const port = 3000
console.log(`Server is running on port ${port}`)

const serverType = serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(info, ":::info listener");
})

// NOTE: implement graceful shutdown on process kill signal
process.on('SIGINT', async () => {
  console.log("Graceful shutdown and cleanup");
  serverType.close((err) => console.log(`Error trying to close connection ${err}`));
});
