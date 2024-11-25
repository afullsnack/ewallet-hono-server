import { logger } from "./logger";
import {FailureResponse} from "../models/response";
import {ErrorCode} from "../models/error_codes";
import { Context, Next } from "hono";
export const panicLogger = async (c: Context, next: Next) => {
  try {
    await next();
  } catch(err) {
    logger.error(err);
    const res: FailureResponse = {
      success: false,
      code:ErrorCode.HANDLER_PANIC,
      message: "Internal Server Error",
    };

    return c.json(res);
  }
}
