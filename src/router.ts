import { Hono } from "hono";
import { cors } from "hono/cors";
import { honoLogger } from "./middlewares/logger";
import { panicLogger } from "./middlewares/panic";
import { prettyJSON } from "hono/pretty-json";
import { authRoute } from "./routes/auth";
import { health_check } from "./handlers/health";


export function setupRouter(app: Hono) {
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
  app.basePath("/api");

  // Routes;
  app.route("/auth", authRoute);


  // Handlers
  app.get("/health", health_check);
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
  })
}

