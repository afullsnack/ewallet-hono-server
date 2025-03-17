import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator";
import {z} from "zod"

const guardian = appFactory.createApp();

export { guardian };
