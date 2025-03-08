import { effectValidator } from "@hono/effect-validator";
import appFactory from "../../app";
import { Schema } from "@effect/schema";
import { updateUser } from "src/db";
import { HTTPException } from "hono/http-exception";
import { tryCatch } from "src/_lib/try-catch";

const Body = Schema.Struct({
  username: Schema.String,
});

export const updateUserHandlers = appFactory.createHandlers(
  effectValidator('json', Body),
  async (c) => {

    const body = c.req.valid('json');
    const user = c.get('user');

    console.log(user, ':::user in current session');
    console.log(body, ':::body');

    if (!user) throw new HTTPException(
      404,
      {
        message: 'User not found',
        res: c.res,
        cause: { action: 'update-user' }
      }
    );

    const { error } = await tryCatch(updateUser(user.id, {
      ...body
    }));

    if (error) throw new HTTPException(500, { message: 'Failed to update user' });

    return c.json({
      'success': true,
      'message': 'User update successfully'
    }, 200);
  }
)
