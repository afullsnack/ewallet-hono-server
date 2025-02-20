import appFactory from "../../app";
import { guardian } from "./create";
import {guardianRecovery} from "./recover"

const guardianRoute = appFactory.createApp();

guardianRoute.post('/create', ...guardian);
guardianRoute.post('/recover', ...guardianRecovery);

export { guardianRoute };
