import appFactory from "../../app";
import { zValidator } from "@hono/zod-validator"; 
import {z} from "zod";

const guardianRecovery = appFactory.createApp();


export {guardianRecovery};
