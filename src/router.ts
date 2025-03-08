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
import { walletRoute } from "./routes/wallet";
import { userRoute } from "./routes/user";
import { auth } from "./_lib/shared/auth";


export function setupRouter(app: Hono<Env>) {
  // TODO: init app with prelim configs
  app.use("*", honoLogger);;
  app.use("*", panicLogger);
  app.use("*", prettyJSON());
  app.use("*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  }))

  app.use("*", async (c, next) => {
    // set session
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    
    if (!session) {
      c.set('user', null);
      c.set('session', null);
      return next();
    }
    c.set('user', session.user);
    c.set('session', session.session);
    return next();
  });

  const v1App = app.basePath("/api/v1");

  // Routes;
  // v1App.route("/auth", authRoute);
  v1App.route("/guardian", guardianRoute);
  v1App.route("/wallet", walletRoute);
  v1App.route("/user", userRoute);
  v1App.get("/health", healthCheck);

  app.on(["POST", "GET"], '/api/*', (c) => {
    return auth.handler(c.req.raw);
  });

  // Handlers
  v1App.notFound((c) => {
    return c.text(`Could not find the route, ${c.req.url}`);
  });
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
  });
  showRoutes(app, {
    verbose: true,
    colorize: true,
  });
}

