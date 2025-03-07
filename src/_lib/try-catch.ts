import {logger} from "../middlewares/logger";
// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error?: never;
};

type Failure<E> = {
  data?: never;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
  action?: {}
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data };
  } catch (error: any) {
    logger.error(error, action);
    return { error: error as E };
  }
}
