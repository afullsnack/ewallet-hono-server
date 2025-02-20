import { Hono } from "hono";
import { cors } from "hono/cors";
import { honoLogger } from "./middlewares/logger";
import { panicLogger } from "./middlewares/panic";
import { prettyJSON } from "hono/pretty-json";
import { authRoute } from "./routes/auth";
import { healthCheck } from "./handlers/health";
import { showRoutes } from "hono/dev";
import { Env } from "./app";
import { guardianRoute } from "./routes/guardians";


export function setupRouter(app: Hono<Env>) {
  // TODO: init app with prelim configs
  app.use("*", honoLogger);;
  app.use("*", panicLogger);
  app.use("*", prettyJSON());
  app.use("*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
    maxAge: 86400,
    credentials: true,
  }))

  app.use("*", async (_, next) => {
    // TODO: implement rate limiting/indempotency
    await next()
  });

  app.use("*", async (_, next) => {
    // TODO: implement basic security check, custom/business checks
    await next()
  });
  const v1App = app.basePath("/api/v1");

  // Routes;
  v1App.route("/auth", authRoute);
  v1App.route("/guardian", guardianRoute);


  // Handlers
  v1App.get("/health", healthCheck);
  v1App.notFound((c) => {
    return c.text(`Could not find the route, ${c.req.url}`);
  });
  v1App.onError((err, c) => {
    console.error(err);
    return c.json(
      {
        status: "failed",
        message: "Internal server error",
        error: JSON.stringify(err, null, 4)
      },
      500
    );
  });
  showRoutes(v1App, {
    verbose: true,
    colorize: true,
  });
}

