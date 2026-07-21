import {zValidator} from "@hono/zod-validator"
import {z} from "zod"
import appFactory from "../../app";
import { Schema } from "@effect/schema";
import { updateUser } from "../../db";
import { HTTPException } from "hono/http-exception";
import { tryCatch } from "../../_lib/try-catch";

const BodySchema = z.object({
  username: z.string().optional().nullable(),
  isFullyOnboarded: z.boolean().optional().nullable()
});

export const updateUserHandlers = appFactory.createHandlers(
  zValidator('json', BodySchema),
  async (c) => {
    const body = c.req.valid('json');
    const user = c.get('user');

    console.log(body, ':::body');

    if (!user) throw new HTTPException(
      404,
      {
        message: 'User not found',
        res: c.res,
        cause: { action: 'update-user' }
      }
    );

    const { error, data } = await tryCatch(updateUser(user.id, {
      ...body
    }));

    if (error) throw new HTTPException(500, { message: 'Failed to update user' });

    return c.json({
      'success': true,
      'message': 'User update successfully',
      data
    }, 200);
  }
)
