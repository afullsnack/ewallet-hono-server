import { effectValidator } from "@hono/effect-validator";
import appFactory from "../../app";
import { Schema } from "@effect/schema";
import { updateUser } from "src/db";
import { HTTPException } from "hono/http-exception";

const Body = Schema.Struct({
  username: Schema.NonEmptyTrimmedString
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

    await updateUser(user.id, {
      username: body.username,
    })

    return c.json({
      'success': true,
      'message': 'User update successfully'
    }, 200);
  }
)
