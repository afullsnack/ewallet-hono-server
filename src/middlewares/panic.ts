import { logger } from "./logger";
import {FailureResponse} from "../models/response";
import { Context, Next } from "hono";

// return custom failed response when unhandled errors occur
export const panicLogger = async (c: Context, next: Next) => {
  try {
    await next();
  } catch(err) {
    logger.error(err);
    const res: FailureResponse = {
      success: false,
      code: 500,
      message: "Internal Server Error",
    };

    return c.json(res);
  }
}
