
import appFactory from "../../app";
import { createWalletHandler } from "./create";
import { recoverWalletHandler } from "./recover";

const walletRoute = appFactory.createApp();

walletRoute.post('/create', ...createWalletHandler);
walletRoute.post('/recover', ...recoverWalletHandler);

export { walletRoute };
