import appFactory from "../../app";
import { loginHandler } from "./login";
// import { logger } from "../../middlewares/logger";

const authRoute = appFactory.createApp();

authRoute.route("/login", loginHandler);

export { authRoute };
