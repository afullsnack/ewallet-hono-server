import { logger } from "./logger";
import { FailureResponse } from "../models/response";
import { createMiddleware } from "hono/factory";

// return custom failed response when unhandled errors occur
export const panicLogger = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(err);
    const res: FailureResponse = {
      success: false,
      code: 500,
      message: "Internal Server Error",
    };

    return c.json(res);
  }
})
