import { Context, Next } from "hono";
import { pino } from "pino";
// const formatters = {
//   level(label: string, _num: number) {
//     return { level: label }
//   },
// };

export const logger = pino({
  base: undefined,
  // level: "info",
  messageKey: "msg",
  redact: {
    paths: ['user.email', 'user.password', 'user.name', 'user.phone'],
    censor: '[👻]'
  }
});

export const honoLogger= async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const responseTime = Date.now() - start;

  logger.info(
    {
      method: `${c.req.method}`,
      path: `${c.req.url}`,
      status: `${c.res.status}`,
      response_time: `${responseTime}ms`
    },
  )
}
