import { Hono  } from "hono";
import { loginHandler } from "./login";


const authRoute = new Hono();

authRoute.route("/login", loginHandler);


export {authRoute};
