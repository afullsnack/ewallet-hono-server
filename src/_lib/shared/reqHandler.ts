import { MiddlewareHandler } from "hono";

interface HandlerArgs {
  validator: MiddlewareHandler;
}
type RequestHandler<F> = <HandlerArgs>() => F;

// export const makeHandler: RequestHandler = () => {
  
// }
