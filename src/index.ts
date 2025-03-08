import "dotenv/config";
import { serve } from '@hono/node-server'
import { setupRouter } from './router';
import appFactory from "./app";
import { logger } from "./middlewares/logger";

const app = appFactory.createApp();
setupRouter(app);
// TODO: read port from configuration with effect/docker-compose
const port = 9001
const server = serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    logger.info(`Server is ready on port [${info.port}], with address [${info.address}]`);
  }
)

process.on('SIGINT', () => {
  server.close((err) => {
    if (err) {
      logger.error(`❌ Error trying to close connection ${err}`);
    } else {
      logger.info(`✅ Server closed successfully`);
    }
  });
});
process.on('uncaughtException', (err) => {
  // log the exception
  logger.fatal(err, 'uncaught exception detected');
  // shutdown the server gracefully
  server.close((err) => {
    logger.error(err, 'Error closing server');
    // If a graceful shutdown is not achieved after 1 second,
    // shut down the process completely
    setTimeout(() => {
      process.abort(); // exit immediately and generate a core dump file
    }, 1000).unref()
    process.exit(1); // then exit
  });
});
