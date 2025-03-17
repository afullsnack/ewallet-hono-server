import appFactory from "../../app";
import { guardian as guardianCreation } from "./create";
import {guardianRecovery} from "./recover"

const guardianRoute = appFactory.createApp();

guardianRoute.route('/create', guardianCreation);
guardianRoute.route('/recover', guardianRecovery);

export { guardianRoute };
