import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const port = 3000
console.log(`Server is running on port ${port}`)

const serverType = serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(info, ":::info listener");
})

// NOTE: implement graceful shutdown on process kill signal
process.on('SIGINT', () => {
  console.log("Graceful shutdown and cleanup");
  serverType.close();
})
